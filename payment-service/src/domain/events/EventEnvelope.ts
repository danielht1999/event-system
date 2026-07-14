/**
 * Envelope genérico para eventos publicados al broker (Redis Streams hoy).
 * Es TypeScript puro — vive en domain/ porque no depende de ningún SDK,
 * pero conceptualmente pertenece al "contrato externo" del servicio.
 * Duplicado intencionalmente en el monolito (PAYMENT_SERVICE_ARCHITECTURE.md
 * sección 12: "Contratos compartidos... duplicados por ahora").
 */
export interface EventEnvelope<TPayload = unknown> {
  eventId: string; // UUID v4, generado por el productor — clave de idempotencia
  eventType: string; // 'payment.confirmed' | 'payment.failed' | 'payment.refunded'
  schemaVersion: number; // arranca en 1, solo sube con cambios incompatibles
  occurredAt: string; // ISO 8601 UTC
  correlationId: string; // = reservationId
  producer: string; // 'payment-service'
  payload: TPayload;
}
