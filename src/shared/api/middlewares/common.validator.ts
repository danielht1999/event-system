// src/shared/api/middlewares/common.validator.ts
import Joi from 'joi';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@shared/application/query/Pagination';
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(DEFAULT_PAGE)
    .messages({
      'number.base': 'page debe ser un número',
      'number.integer': 'page debe ser un número entero',
      'number.min': 'page debe ser al menos 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(MAX_LIMIT)
    .optional()
    .default(DEFAULT_LIMIT)
    .messages({
      'number.base': 'limit debe ser un número',
      'number.integer': 'limit debe ser un número entero',
      'number.min': `limit debe ser al menos 1`,
      'number.max': `limit no puede ser mayor a ${MAX_LIMIT}`
    })
});

/**
 * Parámetro UUID genérico para rutas con :id
 */
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID debe ser un UUID válido',
    'any.required': 'ID es requerido'
  })
});