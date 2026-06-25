// src/shared/api/middlewares/validation.ts
import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export const validate = (schemas: {
  params?: Schema;
  body?: Schema;
  query?: Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    if (schemas.params) {
      const { error } = schemas.params.validate(req.params);
      if (error) errors.push(...error.details.map(d => d.message));
    }
    
    if (schemas.body) {
      const { error } = schemas.body.validate(req.body);
      if (error) errors.push(...error.details.map(d => d.message));
    }
    
    if (schemas.query) {
      const { error } = schemas.query.validate(req.query);
      if (error) errors.push(...error.details.map(d => d.message));
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        details: errors
      });
    }
    
    next();
  };
};

// Uso para PATCH /events/:id/publish (valida params y body)
// router.patch(
//   '/:id/publish',
//   validateMultiple({
//     params: getEventByIdSchema,
//     body: publishEventSchema
//   }),
//   publishEvent
// );