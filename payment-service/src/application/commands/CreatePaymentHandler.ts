import { randomUUID } from 'node:crypto';
import { CreatePaymentCommand, CreatePaymentResult, ICreatePaymentHandler } from './CreatePaymentCommand';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IPaymentGatewayService } from '../../domain/services/IPaymentGatewayService';
import { IUnitOfWork } from '../../domain/services/IUnitOfWork';
import { Payment } from '../../domain/entities/Payment';
import { Money } from '../../domain/entities/Money';
import { IdempotencyConflictError, PaymentGatewayError } from '../../domain/errors';

/**
 * el monto nunca se recalcula aquí. Se confía en amountCents
 * ya verificado por HMAC en la capa api/ antes de llegar a este handler.
 */
export class CreatePaymentHandler implements ICreatePaymentHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly paymentRepository: IPaymentRepository,
    private readonly paymentGateway: IPaymentGatewayService,
  ) {}

  async execute(command: CreatePaymentCommand): Promise<CreatePaymentResult> {
    const existing = await this.paymentRepository.findByIdempotencyKey(command.idempotencyKey);

    if (existing) {
      const sameRequest =
        existing.reservationId === command.reservationId &&
        existing.usuarioId === command.usuarioId &&
        existing.money.amountCents === command.amountCents &&
        existing.money.currency === command.currency;

      if (!sameRequest) {
        throw new IdempotencyConflictError(command.idempotencyKey);
      }

      if (existing.estado !== 'PENDIENTE') {
        // Ya fue resuelto (aprobado/rechazado) — no se puede reabrir un intent.
        throw new IdempotencyConflictError(command.idempotencyKey);
      }

      // Idempotencia sin duplicar el intent en Stripe: se reutiliza `existing.id`
      // como idempotency key nativa de Stripe al llamar al gateway (ver
      // StripePaymentGateway), de modo que Stripe devuelve el MISMO
      // PaymentIntent/clientSecret en vez de crear uno nuevo. No se llama
      // dos veces a Stripe "de verdad": la propia API de Stripe deduplica.
      const { clientSecret } = await this.requestIntent(existing.id, existing.money, existing.reservationId);
      return { paymentId: existing.id, clientSecret, status: 'PENDIENTE' };
    }

    const id = randomUUID();
    const money = Money.fromCents(command.amountCents, command.currency);

    // El intent se solicita ANTES de construir la entidad: el providerReference
    // (PaymentIntent.id de Stripe) ya existe al crear el intent, no solo al
    // aprobarlo, y se persiste desde el inicio para que el webhook pueda
    // ubicar el Payment vía findByProviderReference.
    const { providerReference, clientSecret } = await this.requestIntent(id, money, command.reservationId);

    const payment = Payment.create({
      id,
      reservationId: command.reservationId,
      usuarioId: command.usuarioId,
      money,
      idempotencyKey: command.idempotencyKey,
      providerReference,
    });

    await this.uow.execute(async (tx) => {
      await this.paymentRepository.save(payment, tx);
      // El outbox no aplica aquí: PENDIENTE no dispara evento de dominio
      // (Payment.create() no emite eventos). Los eventos nacen en aprobar()/rechazar().
    });

    return { paymentId: payment.id, clientSecret, status: 'PENDIENTE' };
  }

  private async requestIntent(
    paymentId: string,
    money: Money,
    reservationId: string,
  ): Promise<{ providerReference: string; clientSecret: string }> {
    try {
      return await this.paymentGateway.createPaymentIntent({
        money,
        metadata: { reservationId, paymentId },
      });
    } catch (err) {
      //nunca se expone el error crudo de Stripe.
      throw new PaymentGatewayError();
    }
  }
}
