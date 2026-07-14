import { Money } from '../entities/Money';

/**
 * CreateIntentResult ya viene traducido a tipos propios — nunca un tipo del
 * SDK de Stripe cruza hacia domain/ ni application/ 
 */
export interface CreateIntentResult {
  providerReference: string;
  clientSecret: string;
}

export interface IPaymentGatewayService {
  createPaymentIntent(params: {
    money: Money;
    metadata: { reservationId: string; paymentId: string };
  }): Promise<CreateIntentResult>;
}
