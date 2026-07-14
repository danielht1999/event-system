import { Money } from './Money';
import { IDomainEvent } from '../events/IDomainEvent';
import {
  PaymentApprovedDomainEvent,
  PaymentRejectedDomainEvent,
} from '../events/PaymentDomainEvents';
import { InvalidPaymentStateError, NotImplementedError } from '../errors';

export type PaymentStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';

interface PaymentProps {
  id: string;
  reservationId: string;
  usuarioId: string;
  money: Money;
  estado: PaymentStatus;
  provider: 'stripe';
  providerReference?: string;
  idempotencyKey: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

export class Payment {
  private domainEvents: IDomainEvent[] = [];

  private constructor(private props: PaymentProps) {}

  static create(props: {
    id: string;
    reservationId: string;
    usuarioId: string;
    money: Money;
    idempotencyKey: string;
    // de Stripe ya existe en el momento de crear el intent, antes de que el
    // pago sea aprobado. Se guarda desde el inicio para que el webhook
    // pueda ubicar el Payment vía findByProviderReference
    providerReference?: string;
  }): Payment {
    const now = new Date();
    return new Payment({
      id: props.id,
      reservationId: props.reservationId,
      usuarioId: props.usuarioId,
      money: props.money,
      estado: 'PENDIENTE',
      provider: 'stripe',
      providerReference: props.providerReference,
      idempotencyKey: props.idempotencyKey,
      creadoEn: now,
      actualizadoEn: now,
    });
  }

  /** Reconstrucción desde persistencia — no dispara eventos de dominio. */
  static reconstitute(props: PaymentProps): Payment {
    return new Payment(props);
  }

  get id(): string {
    return this.props.id;
  }

  get reservationId(): string {
    return this.props.reservationId;
  }

  get usuarioId(): string {
    return this.props.usuarioId;
  }

  get money(): Money {
    return this.props.money;
  }

  get estado(): PaymentStatus {
    return this.props.estado;
  }

  get provider(): 'stripe' {
    return this.props.provider;
  }

  get providerReference(): string | undefined {
    return this.props.providerReference;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get creadoEn(): Date {
    return this.props.creadoEn;
  }

  get actualizadoEn(): Date {
    return this.props.actualizadoEn;
  }

  /** PENDIENTE → APROBADO. Emite PAYMENT.APPROVED. */
  aprobar(providerReference: string): void {
    if (this.props.estado !== 'PENDIENTE') {
      throw new InvalidPaymentStateError(
        `No se puede aprobar un pago en estado '${this.props.estado}' (se requiere 'PENDIENTE').`,
      );
    }
    this.props.estado = 'APROBADO';
    this.props.providerReference = providerReference;
    this.props.actualizadoEn = new Date();

    this.domainEvents.push(
      new PaymentApprovedDomainEvent(
        this.props.id,
        this.props.reservationId,
        this.props.money.amountCents,
        this.props.money.currency,
        providerReference,
      ),
    );
  }

  /** PENDIENTE → RECHAZADO. Emite PAYMENT.REJECTED  */
  rechazar(reason: string): void {
    if (this.props.estado !== 'PENDIENTE') {
      throw new InvalidPaymentStateError(
        `No se puede rechazar un pago en estado '${this.props.estado}' (se requiere 'PENDIENTE').`,
      );
    }
    this.props.estado = 'RECHAZADO';
    this.props.actualizadoEn = new Date();

    this.domainEvents.push(
      new PaymentRejectedDomainEvent(this.props.id, this.props.reservationId, reason),
    );
  }

  /**
   * APROBADO → REEMBOLSADO. Emite PAYMENT.REFUNDED.
   * la lógica de reembolso real no está definida en esta fase, así que se
   * lanza NotImplementedError en vez de una implementación a medias.
   */
  reembolsar(): void {
    if (this.props.estado !== 'APROBADO') {
      throw new InvalidPaymentStateError(
        `No se puede reembolsar un pago en estado '${this.props.estado}' (se requiere 'APROBADO').`,
      );
    }
    throw new NotImplementedError('Payment.reembolsar()');

    // Cuando se implemente, la forma será:
    // this.props.estado = 'REEMBOLSADO';
    // this.props.actualizadoEn = new Date();
    // this.domainEvents.push(new PaymentRefundedDomainEvent(...));
  }

  pullDomainEvents(): IDomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }
}
