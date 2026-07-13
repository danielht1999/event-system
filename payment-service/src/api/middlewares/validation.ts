import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../../domain/errors';

export const createPaymentSchema = Joi.object({
  reservationId: Joi.string().uuid().required(),
  usuarioId: Joi.string().uuid().required(),
  amountCents: Joi.number().integer().positive().required(),
  currency: Joi.string().valid('MXN').required(),
});

export const paymentIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      next(new ValidationError(error.details.map((d) => d.message).join('; ')));
      return;
    }
    next();
  };
}

export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, { abortEarly: false });
    if (error) {
      next(new ValidationError(error.details.map((d) => d.message).join('; ')));
      return;
    }
    next();
  };
}
