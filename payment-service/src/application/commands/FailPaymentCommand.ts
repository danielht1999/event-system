export type PaymentFailureReason =
  | 'card_declined'
  | 'insufficient_funds'
  | 'gateway_timeout'
  | 'expired_intent'
  | 'unknown';

export class FailPaymentCommand {
  constructor(
    public readonly providerReference: string,
    public readonly reason: PaymentFailureReason,
  ) {}
}

export interface IFailPaymentHandler {
  execute(command: FailPaymentCommand): Promise<void>;
}
