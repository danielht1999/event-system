import { Router, Request, Response } from 'express';
import { IReadinessChecker } from '../../domain/services/IReadinessChecker';

/**
 * GET /health — liveness. Nunca toca Postgres/Redis/Stripe
 *
 * GET /ready — readiness. Solo Postgres 
 */
export function buildHealthRouter(readinessChecker: IReadinessChecker): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'payment-service' });
  });

  router.get('/ready', async (_req: Request, res: Response) => {
    const isReady = await readinessChecker.check();
    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not-ready' });
    }
  });

  return router;
}