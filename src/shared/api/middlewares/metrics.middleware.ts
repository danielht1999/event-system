import { Request, Response, NextFunction } from 'express';
import { usedRoutes, responseTime } from '../../infrastructure/monitoring/metrics';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const inicio = Date.now(); // 1. Anotar tiempo de inicio

  res.on('finish', () => {
    const duracion = Date.now() - inicio; // 3. Calcular duración
    const labels = {
      method: req.method,        // GET, POST, etc.
      route: req.path,           // /api/v1/auth/login
      status: res.statusCode     // 200, 404, 500
    };

    usedRoutes.inc(labels);               // incrementar contador de rutas
    responseTime.observe(labels, duracion); // registrar duración
  });

  next(); // 2. Pasar al siguiente middleware
};