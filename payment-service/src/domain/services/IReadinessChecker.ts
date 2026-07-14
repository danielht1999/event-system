/**
 * Puerto de verificación de disponibilidad para GET /ready.
 * La implementación concreta vive en infrastructure
 */
export interface IReadinessChecker {
  check(): Promise<boolean>;
}