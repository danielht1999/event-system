import { Pool, PoolClient } from 'pg';

/**
 * Pool de Postgres propio de payment-service. Nunca comparte instancia con el monolito
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Mantienes el estándar de la URL, pero aseguras tus límites de rendimiento:
  max: 20, // Un número intermedio saludable para un microservicio
  idleTimeoutMillis: 30000,//Tiempo para cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // Evita que el servicio se quede congelado si la DB se cae
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected idle client error', err);
});

export type DbClient = Pool | PoolClient;

export function asClient(tx: unknown): DbClient {
  // El `tx` que viaja por los puertos de dominio es, en esta implementación
  // concreta, un PoolClient de `pg` dentro de una transacción abierta.
  return (tx as DbClient) ?? pool;
}
