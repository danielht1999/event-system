import * as dotenv from 'dotenv';
import { validateEnv, EnvConfig } from './env.validator';

dotenv.config();

/**
 * Se importa una sola vez, antes que cualquier otro módulo (server.ts lo
 * importa primero) — si falta una variable requerida, el proceso falla al
 * arrancar en vez de fallar a mitad de una petición HTTP.
 * Todo el resto del código (container.ts, etc.) importa `env` desde aquí,
 * nunca lee `process.env` directamente.
 */
export const env: EnvConfig = validateEnv();