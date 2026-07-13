import { randomUUID } from 'node:crypto';
import { ConfirmPaymentCommand, IConfirmPaymentHandler } from './ConfirmPaymentCommand';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IOutboxStore } from '../../domain/services/IOutboxStore';
import { IUnitOfWork } from '../../domain/services/IUnitOfWork';
import { PaymentNotFoundError } from '../../domain/errors';
import { PaymentEventTypes } from '../../domain/events/PaymentEventTypes';
import { PaymentConfirmedPayload } from '../../domain/events/PaymentEventPayloads';
import { EventEnvelope } from '../../domain/events/EventEnvelope';

/**
 * Payment.save() + outbox.append() en la MISMA transacción.
 * Este handler nunca publica directo a Redis — eso es tarea exclusiva del
 * OutboxWorker (infraestructura), que ni siquiera vive en este proceso lógico.
 */
export class ConfirmPaymentHandler implements IConfirmPaymentHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly paymentRepository: IPaymentRepository,
    private readonly outboxStore: IOutboxStore,
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<void> {
    await this.uow.execute(async (tx) => {
      const payment = await this.paymentRepository.findByProviderReference(command.providerReference, tx);
      if (!payment) {
        throw new PaymentNotFoundError(command.providerReference);
      }

      // Idempotencia: si ya no está PENDIENTE (reentrega del webhook de Stripe)
      if (payment.estado !== 'PENDIENTE') {
        return;
      }

      payment.aprobar(command.providerReference);
      await this.paymentRepository.save(payment, tx);

      const [domainEvent] = payment.pullDomainEvents();
      const payload: PaymentConfirmedPayload = {
        paymentId: payment.id,
        reservationId: payment.reservationId,
        amountCents: payment.money.amountCents,
        currency: payment.money.currency,
        provider: 'stripe',
        providerReference: command.providerReference,
        confirmedAt: (domainEvent?.occurredAt ?? new Date()).toISOString(),
      };

      const envelope: EventEnvelope<PaymentConfirmedPayload> = {
        eventId: randomUUID(),
        eventType: PaymentEventTypes.PAYMENT_CONFIRMED,
        schemaVersion: 1,
        occurredAt: new Date().toISOString(),
        correlationId: payment.reservationId,
        producer: 'payment-service',
        payload,
      };

      await this.outboxStore.append(envelope, tx);
    });
  }
}
