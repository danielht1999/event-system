import Stripe from 'stripe';
import { IPaymentGatewayService, CreateIntentResult } from '../../domain/services/IPaymentGatewayService';
import { Money } from '../../domain/entities/Money';

/**
 * Único lugar del proyecto que toca el SDK de Stripe
 * Traduce siempre a CreateIntentResult antes de devolver el control —
 * ningún tipo de `stripe` cruza hacia domain/ ni application/.
 */
export class StripePaymentGateway implements IPaymentGatewayService {
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  }

  async createPaymentIntent(params: {
    money: Money;
    metadata: { reservationId: string; paymentId: string };
  }): Promise<CreateIntentResult> {
    // `paymentId` como idempotency key nativa de Stripe: un reintento con el
    // mismo paymentId devuelve el mismo PaymentIntent/clientSecret en vez de
    // crear uno nuevo (ver CreatePaymentHandler, manejo de idempotencia).
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: params.money.amountCents,
        currency: params.money.currency.toLowerCase(),
        metadata: {
          reservationId: params.metadata.reservationId,
          paymentId: params.metadata.paymentId,
        },

        // La v1 del payment-service solo procesa pagos con tarjeta mediante
        // Stripe Checkout/Elements y no soporta métodos de pago que redirigen
        // al usuario (iDEAL, Bancontact, Sofort, etc.).
        //
        // `allow_redirects: 'never'` evita que Stripe exija un `return_url`
        // al confirmar el PaymentIntent (por ejemplo desde Stripe CLI durante
        // las pruebas end-to-end) y restringe el flujo a métodos que pueden
        // completarse sin abandonar la aplicación.
        //
        // Si en el futuro se agregan métodos de pago con redirección, esta
        // configuración deberá revisarse junto con la implementación del
        // frontend y el flujo de confirmación.
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      },
      { idempotencyKey: params.metadata.paymentId },
    );

    if (!intent.client_secret) {
      // No debería pasar en flujo normal de creación, pero se cubre por completitud.
      throw new Error('Stripe no devolvió client_secret para el PaymentIntent creado.');
    }

    return {
      providerReference: intent.id,
      clientSecret: intent.client_secret,
    };
  }
}
