import { Request, Response, NextFunction } from 'express';

import {
  DomainError,
  ValidationError,
  ErrorCategory
} from '@shared/domain/errors';

import { logger } from '../../infrastructure/logging/winston';

const STATUS_MAP = {
  [ErrorCategory.VALIDATION]: 400,
  [ErrorCategory.UNAUTHORIZED]: 401,
  [ErrorCategory.FORBIDDEN]: 403,
  [ErrorCategory.NOT_FOUND]: 404,
  [ErrorCategory.CONFLICT]: 409,
  [ErrorCategory.INTERNAL]: 500,
};

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {

  // ==================== 1. ERRORES DE DOMINIO CONTROLADOS ====================

  if (err instanceof DomainError) {

    logger.warn({
      category: err.category,
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    const response: Record<string, unknown> = {
      status: 'fail',
      category: err.category,
      code: err.code,
      message: err.message,
    };

    // Solo ValidationError tiene details
    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    return res
      .status(STATUS_MAP[err.category] ?? 400)
      .json(response);
  }

  // ==================== 2. ERRORES INESPERADOS ====================

  logger.error({
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Hubo un error interno en el servidor.',
  });
}