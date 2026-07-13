import { env } from './config/env.loader'; // primero: falla rápido si falta una var requerida
import { buildContainer } from './infrastructure/di/container';
import { buildApp } from './app';

const container = buildContainer();
const app = buildApp(container);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[payment-service] escuchando en puerto ${env.PORT}`);
});

// Worker de outbox — proceso separado en espíritu (mismo patrón que
// reservationExpiry.worker.ts), aquí arrancado en el mismo proceso Node por
// simplicidad del proyecto de aprendizaje; en producción real conviene un
// entrypoint propio (ver docker-compose.yml, comentario en el servicio).
container.outboxWorker.start();

process.on('SIGTERM', () => {
  container.outboxWorker.stop();
  process.exit(0);
});