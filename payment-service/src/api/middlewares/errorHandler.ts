import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/AppError';

/**
 * controller nunca mapea errores a HTTP con try/catch propio. Siempre
 * `next(error)`, y el mapeo vive únicamente aquí.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json(err.toResponse());
    return;
  }

  // eslint-disable-next-line no-console
  console.error('[errorHandler] error no controlado:', err);
  res.status(500).json({
    status: 'fail',
    category: 'INTERNAL',
    code: 'INTERNAL_ERROR',
    message: 'Ocurrió un error interno.',
  });
}
