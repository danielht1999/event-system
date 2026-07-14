import { Pool } from 'pg';
import { IReadinessChecker } from '../../domain/services/IReadinessChecker';

const CHECK_TIMEOUT_MS = 2000;

/**
 * Solo verifica Postgres — es la única dependencia sin la cual el servicio
 * no puede hacer su trabajo mínimo (crear/consultar pagos). Redis queda
 * fuera a propósito: el patrón outbox ya tolera que Redis esté caído sin
 * perder eventos, así que cortar tráfico por Redis sería un falso negativo
 *
 * Timeout corto (2s): si Postgres está colgado en vez de caído, /ready no
 * debe tardar tanto en responder que el propio check se vuelva el problema.
 */
export class PostgresReadinessChecker implements IReadinessChecker {
  constructor(private readonly pool: Pool) {}

  async check(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.pool.query('SELECT 1'),
        new Promise((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('readiness check timeout')), CHECK_TIMEOUT_MS);
        }),
      ]);
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}