/**
 * Fuente única de verdad para las variables de entorno requeridas.
 * Mismo patrón REQUIRED_ENV_VARS que env.validator.ts del monolito
 * (MONOLITH_INTEGRATION_CONTRACTS.md, sección 8): agregar aquí, no en
 * container.ts ni en ningún otro archivo, cuando se necesite una var nueva.
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'PAYMENT_SERVICE_HMAC_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

export interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  PAYMENT_SERVICE_HMAC_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

/**
 * Lanza si falta cualquier variable de REQUIRED_ENV_VARS — falla rápido al
 * arrancar el proceso, nunca a mitad de una petición (esto es lo que
 * reemplaza al requireEnv() disperso que antes vivía en container.ts).
 */
export function validateEnv(): EnvConfig {
  const missing: RequiredEnvVar[] = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}. Revisa tu archivo .env (ver .env.example).`,
    );
  }

  return {
    PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
    DATABASE_URL: process.env.DATABASE_URL as string,
    REDIS_URL: process.env.REDIS_URL as string,
    PAYMENT_SERVICE_HMAC_SECRET: process.env.PAYMENT_SERVICE_HMAC_SECRET as string,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
  };
}