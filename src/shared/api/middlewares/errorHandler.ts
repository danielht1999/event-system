import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/errors/DomainError';
import { logger } from '../../infrastructure/logging/winston';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Si es un error controlado por tu lógica de negocio
  if (err instanceof DomainError) {
    logger.warn(`[Domain Error] ${err.code}: ${err.message}`);
    return res.status(400).json({
      status: 'fail',
      code: err.code,
      message: err.message
    });
  }

  // 2. Si es un colapso inesperado de infraestructura (Postgres, Redis, etc.)
  logger.error({
    message: err.message,
    stack: err.stack,
    name: err.name,
    context: {
      path: req.path,
      method: req.method,
      body: req.body 
    }
  });

  // Escudo para el usuario: Jamás se entera del stack real del servidor
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Hubo un error interno en el servidor. Por favor, inténtalo más tarde.'
  });
}