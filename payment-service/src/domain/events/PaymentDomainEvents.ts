import { IDomainEvent } from './IDomainEvent';
import { DomainEventNames } from './DomainEventNames';

export class PaymentApprovedDomainEvent implements IDomainEvent {
  readonly occurredAt: Date = new Date();
  readonly eventName = DomainEventNames.PAYMENT.APPROVED;

  constructor(
    readonly paymentId: string,
    readonly reservationId: string,
    readonly amountCents: number,
    readonly currency: string,
    readonly providerReference: string,
  ) {}
}

export class PaymentRejectedDomainEvent implements IDomainEvent {
  readonly occurredAt: Date = new Date();
  readonly eventName = DomainEventNames.PAYMENT.REJECTED;

  constructor(
    readonly paymentId: string,
    readonly reservationId: string,
    readonly reason: string,
  ) {}
}

export class PaymentRefundedDomainEvent implements IDomainEvent {
  readonly occurredAt: Date = new Date();
  readonly eventName = DomainEventNames.PAYMENT.REFUNDED;

  constructor(
    readonly paymentId: string,
    readonly reservationId: string,
    readonly amountCents: number,
    readonly currency: string,
  ) {}
}
