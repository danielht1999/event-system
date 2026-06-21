import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@shared/domain/errors';
import { AppError, ErrorCategory } from '@shared/errors';
import { logger } from '../../infrastructure/logging/winston';
import { excepcionesGlobales } from '../../infrastructure/monitoring/metrics';

const STATUS_MAP = {
  [ErrorCategory.VALIDATION]: 400,
  [ErrorCategory.UNAUTHORIZED]: 401,
  [ErrorCategory.FORBIDDEN]: 403,
  [ErrorCategory.NOT_FOUND]: 404,
  [ErrorCategory.CONFLICT]: 409,
  [ErrorCategory.SERVICE_UNAVAILABLE]: 503,
  [ErrorCategory.INTERNAL]: 500,
} as const;

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const currentRoute =
    req.route?.path || req.path;

  const errorType =
    err instanceof AppError
      ? err.code
      : err.name;

  // ====================================================
  // MÉTRICAS
  // ====================================================

  excepcionesGlobales.inc({
    method: req.method,
    route: currentRoute,
    error_type: errorType,
  });

  // ====================================================
  // ERRORES CONTROLADOS
  // ====================================================

  if (err instanceof AppError) {
    logger.warn({
      category: err.category,
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });

    const response: Record<string, unknown> = {
      status: 'fail',
      category: err.category,
      code: err.code,
      message: err.message,
    };

    if (
      err instanceof ValidationError &&
      err.details
    ) {
      response.details = err.details;
    }

    return res
      .status(STATUS_MAP[err.category] ?? 500)
      .json(response);
  }

  // ====================================================
  // ERRORES INESPERADOS
  // ====================================================

  logger.error({
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    status: 'error',
    category: ErrorCategory.INTERNAL,
    code: 'INTERNAL_SERVER_ERROR',
    message:
      'Hubo un error interno en el servidor.',
  });
}