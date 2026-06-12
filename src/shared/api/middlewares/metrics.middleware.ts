import { Request, Response, NextFunction } from 'express';
import { usedRoutes, responseTime } from '../../infrastructure/monitoring/metrics';

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    };
    usedRoutes.inc(labels);
    responseTime.observe(labels, duration);
  });

  next();
};