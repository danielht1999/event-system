import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutos, anti-replay

/**
 * Verifica firma HMAC-SHA256 sobre `${timestamp}.${rawBody}`.
 * comparación con timingSafeEqual,
 * nunca `===` directo. Rechaza si el timestamp está fuera de la ventana.
 */
export class HmacVerifier {
  constructor(private readonly secret: string) {}

  verify(rawBody: string, timestampHeader: string | undefined, signatureHeader: string | undefined): boolean {
    if (!timestampHeader || !signatureHeader) return false;

    const timestamp = Number(timestampHeader);
    if (!Number.isFinite(timestamp)) return false;

    const now = Date.now();
    if (Math.abs(now - timestamp) > MAX_CLOCK_SKEW_MS) return false;

    const expected = createHmac('sha256', this.secret)
      .update(`${timestampHeader}.${rawBody}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signatureHeader, 'hex');
    //obliga a la computadora a revisar absolutamente todas las letras,
    //sin importar si la primera ya falló. Por lo tanto,
    //tardará exactamente los mismos nanosegundos en evaluar una firma completamente falsa que una firma casi perfecta.
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  }
}
