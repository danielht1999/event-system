export class CreatePaymentCommand {
  constructor(
    public readonly reservationId: string,
    public readonly usuarioId: string,
    public readonly amountCents: number,
    public readonly currency: string,
    public readonly idempotencyKey: string,
  ) {}
}

export interface CreatePaymentResult {
  paymentId: string;
  clientSecret: string;
  status: 'PENDIENTE';
}

export interface ICreatePaymentHandler {
  execute(command: CreatePaymentCommand): Promise<CreatePaymentResult>;
}
