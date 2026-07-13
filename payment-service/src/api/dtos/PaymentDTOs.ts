export interface CreatePaymentRequestDTO {
  reservationId: string;
  usuarioId: string;
  amountCents: number;
  currency: string;
}

export interface CreatePaymentResponseDTO {
  paymentId: string;
  clientSecret: string;
  status: 'PENDIENTE';
}

export interface PaymentResponseDTO {
  paymentId: string;
  reservationId: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';
  amountCents: number;
  currency: string;
  providerReference: string | null;
  createdAt: string;
  updatedAt: string;
}
