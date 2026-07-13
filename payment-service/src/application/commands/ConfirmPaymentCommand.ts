/**
 * Se dispara desde el webhook de Stripe ya verificado, busca el Payment por
 * providerReference. No confundir con el ConfirmPaymentCommand del monolito.
 */
export class ConfirmPaymentCommand {
  constructor(public readonly providerReference: string) {}
}

export interface IConfirmPaymentHandler {
  execute(command: ConfirmPaymentCommand): Promise<void>;
}
