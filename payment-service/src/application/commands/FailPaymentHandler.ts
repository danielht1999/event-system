import { randomUUID } from 'node:crypto';
import { FailPaymentCommand, IFailPaymentHandler } from './FailPaymentCommand';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IOutboxStore } from '../../domain/services/IOutboxStore';
import { IUnitOfWork } from '../../domain/services/IUnitOfWork';
import { PaymentNotFoundError } from '../../domain/errors';
import { PaymentEventTypes } from '../../domain/events/PaymentEventTypes';
import { PaymentFailedPayload } from '../../domain/events/PaymentEventPayloads';
import { EventEnvelope } from '../../domain/events/EventEnvelope';

export class FailPaymentHandler implements IFailPaymentHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly paymentRepository: IPaymentRepository,
    private readonly outboxStore: IOutboxStore,
  ) {}

  async execute(command: FailPaymentCommand): Promise<void> {
    await this.uow.execute(async (tx) => {
      const payment = await this.paymentRepository.findByProviderReference(command.providerReference, tx);
      if (!payment) {
        throw new PaymentNotFoundError(command.providerReference);
      }

      if (payment.estado !== 'PENDIENTE') {
        // Idempotente: reentrega del webhook sobre un pago ya resuelto, no-op.
        return;
      }

      payment.rechazar(command.reason);
      await this.paymentRepository.save(payment, tx);

      const [domainEvent] = payment.pullDomainEvents();
      const payload: PaymentFailedPayload = {
        paymentId: payment.id,
        reservationId: payment.reservationId,
        reason: command.reason,
        failedAt: (domainEvent?.occurredAt ?? new Date()).toISOString(),
      };

      const envelope: EventEnvelope<PaymentFailedPayload> = {
        eventId: randomUUID(),
        eventType: PaymentEventTypes.PAYMENT_FAILED,
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
