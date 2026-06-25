// src/shared/api/middlewares/event.validator.ts

import Joi from 'joi';
import { paginationSchema } from './common.validator';

/**
 * Esquema para tickets dentro de un evento
 */
const ticketSchema = Joi.object({
  nombre: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.base': 'nombre del ticket debe ser un string',
      'string.min': 'nombre del ticket debe tener al menos 1 carácter',
      'string.max': 'nombre del ticket no puede tener más de 100 caracteres',
      'any.required': 'nombre del ticket es requerido'
    }),
  
  precio: Joi.number()
    .min(0)
    .required()
    .precision(2)
    .messages({
      'number.base': 'precio debe ser un número',
      'number.min': 'precio debe ser mayor o igual a 0',
      'number.precision': 'precio solo puede tener 2 decimales',
      'any.required': 'precio es requerido'
    }),
  
  capacidad: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'capacidad debe ser un número',
      'number.integer': 'capacidad debe ser un número entero',
      'number.min': 'capacidad debe ser al menos 1',
      'any.required': 'capacidad es requerido'
    })
});

/**
 * CREATE - POST /events
 */
export const createEventSchema = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.base': 'titulo debe ser un string',
      'string.min': 'titulo debe tener al menos 5 caracteres',
      'string.max': 'titulo no puede tener más de 200 caracteres',
      'any.required': 'titulo es requerido'
    }),
  
 descripcion: Joi.string()
  .trim()
  .min(1)
  .max(2000)
  .required()
  .messages({
    'string.base': 'descripcion debe ser un string',
    'string.empty': 'descripcion no puede estar vacía',
    'string.min': 'descripcion debe tener al menos 1 carácter',
    'string.max': 'descripcion no puede tener más de 2000 caracteres',
    'any.required': 'descripcion es requerido'
  }),
  
  fecha: Joi.date()
    .iso()
    .greater('now')
    .required()
    .messages({
      'date.base': 'fecha debe ser una fecha válida',
      'date.iso': 'fecha debe estar en formato ISO (YYYY-MM-DD)',
      'date.greater': 'fecha debe ser en el futuro',
      'any.required': 'fecha es requerida'
    }),
  
  lugar: Joi.string()
  .trim()
  .min(1)
  .max(300)
  .required()
  .messages({
    'string.base': 'lugar debe ser un string',
    'string.empty': 'lugar no puede estar vacío',
    'string.min': 'lugar debe tener al menos 1 carácter',
    'string.max': 'lugar no puede tener más de 300 caracteres',
    'any.required': 'lugar es requerido'
  }),
  capacidadTotal: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'number.base': 'capacidadTotal debe ser un número',
      'number.integer': 'capacidadTotal debe ser un número entero',
      'number.min': 'capacidadTotal debe ser al menos 1',
      'number.max': 'capacidadTotal no puede ser mayor a 10000',
      'any.required': 'capacidadTotal es requerido'
    }),
  
  tickets: Joi.array()
    .items(ticketSchema)
    .min(1)
    .required()
    .messages({
      'array.base': 'tickets debe ser un arreglo',
      'array.min': 'tickets debe tener al menos 1 ticket',
      'any.required': 'tickets es requerido'
    })
})
.custom((value, helpers) => {
  // Validar que la suma de capacidades no exceda capacidadTotal
  const capacidadAsignada = value.tickets.reduce(
    (sum: number, t: any) => sum + t.capacidad,
    0
  );

  if (capacidadAsignada > value.capacidadTotal) {
    return helpers.error('any.invalid', {
      message: `La capacidad total de los tickets (${capacidadAsignada}) excede la capacidadTotal (${value.capacidadTotal})`
    });
  }

  return value;
});

/**
 * UPDATE - PUT /events/:id
 */
export const updateEventSchema = Joi.object({
  titulo: Joi.string()
    .min(5)
    .max(200)
    .optional()
    .messages({
      'string.base': 'titulo debe ser un string',
      'string.min': 'titulo debe tener al menos 5 caracteres',
      'string.max': 'titulo no puede tener más de 200 caracteres'
    }),
  
  descripcion: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.base': 'descripcion debe ser un string',
      'string.max': 'descripcion no puede tener más de 2000 caracteres'
    }),
  
  fecha: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .messages({
      'date.base': 'fecha debe ser una fecha válida',
      'date.iso': 'fecha debe estar en formato ISO (YYYY-MM-DD)',
      'date.greater': 'fecha debe ser en el futuro'
    }),
  
  lugar: Joi.string()
    .max(300)
    .optional()
    .messages({
      'string.base': 'lugar debe ser un string',
      'string.max': 'lugar no puede tener más de 300 caracteres'
    }),
  
  capacidadTotal: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .optional()
    .messages({
      'number.base': 'capacidadTotal debe ser un número',
      'number.integer': 'capacidadTotal debe ser un número entero',
      'number.min': 'capacidadTotal debe ser al menos 1',
      'number.max': 'capacidadTotal no puede ser mayor a 10000'
    })
});

/**
 * LIST - GET /events
 * Hereda paginación global + filtros específicos de Event
 */
export const listEventsSchema = paginationSchema.keys({
  owner: Joi.string()
    .valid('me')
    .optional()
    .messages({
      'string.base': 'owner debe ser un string',
      'any.only': 'owner solo puede ser "me"'
    }),
  
  search: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'search no puede tener más de 100 caracteres'
    }),
  
  status: Joi.string()
    .valid('BORRADOR', 'PUBLICADA', 'CANCELADA', 'FINALIZADA')
    .optional()
    .messages({
      'string.base': 'status debe ser un string',
      'any.only': 'status debe ser BORRADOR, PUBLICADA, CANCELADA o FINALIZADA'
    }),
  
  sortBy: Joi.string()
    .valid('date', 'title', 'price', 'createdAt')
    .default('date')
    .messages({
      'string.base': 'sortBy debe ser un string',
      'any.only': 'sortBy debe ser date, title, price o createdAt'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .messages({
      'string.base': 'sortOrder debe ser un string',
      'any.only': 'sortOrder debe ser asc o desc'
    })
});

/**
 * GET BY ID - GET /events/:id
 */
export const getEventByIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID debe ser un UUID válido',
    'any.required': 'ID es requerido'
  })
});

/**
 * GET AVAILABILITY - GET /events/:id/availability
 */
export const getEventAvailabilitySchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID debe ser un UUID válido',
    'any.required': 'ID es requerido'
  })
});

/**
 * PUBLISH - PATCH /events/:id/publish
 */
export const publishEventSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID debe ser un UUID válido',
    'any.required': 'ID es requerido'
  })
});

/**
 * CANCEL - DELETE /events/:id
 */
export const cancelEventSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID debe ser un UUID válido',
    'any.required': 'ID es requerido'
  })
});

// Re-exportar uuidParamSchema para consistencia
export { uuidParamSchema } from './common.validator';