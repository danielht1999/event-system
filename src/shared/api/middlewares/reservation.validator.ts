import Joi from 'joi';
import { paginationSchema } from '@shared/api/middlewares/common.validator';

// ============================================
// ESQUEMAS DE VALIDACIÓN - RESERVATION
// ============================================

/**
 * CREATE - POST /reservations
 * Valida la creación de una nueva reserva
 * 
 * @body {string} eventoId - UUID del evento
 * @body {string} ticketTypeId - UUID del tipo de ticket
 * @body {number} cantidadTickets - 1 a 4 tickets
 */
export const createReservationSchema = Joi.object({
  eventoId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'eventoId debe ser un UUID válido',
      'any.required': 'eventoId es requerido'
    }),
  
  ticketTypeId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ticketTypeId debe ser un UUID válido',
      'any.required': 'ticketTypeId es requerido'
    }),
  
  cantidadTickets: Joi.number()
    .integer()
    .min(1)
    .max(4)
    .required()
    .options({ convert: false })
    .messages({
      'number.base': 'cantidadTickets debe ser un número',
      'number.integer': 'cantidadTickets debe ser un número entero',
      'number.min': 'cantidadTickets debe ser al menos 1',
      'number.max': 'cantidadTickets no puede ser mayor a 4',
      'any.required': 'cantidadTickets es requerido'
    })
});

/**
 * LIST - GET /reservations
 * Hereda paginación global + filtros específicos de Reservation
 * 
 * @query {number} page - Número de página (default: 1)
 * @query {number} limit - Límite por página (default: 10, max: 100)
 * @query {string} sortBy - Campo para ordenar (default: 'createdAt')
 * @query {string} sortOrder - 'asc' o 'desc' (default: 'desc')
 * @query {string} status - Filtro por estado
 * @query {string} eventId - Filtro por evento (UUID)
 * @query {string} userId - Filtro por usuario (UUID)
 */
export const listReservationsSchema = paginationSchema.keys({
  status: Joi.string()
    .valid('PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA', 'CHECKED_IN')
    .optional()
    .messages({
      'string.base': 'status debe ser un string',
      'any.only': 'status debe ser uno de: PENDIENTE_PAGO, CONFIRMADA, CANCELADA, EXPIRADA, CHECKED_IN'
    }),
  
  eventId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'eventId debe ser un UUID válido'
    }),
  
  userId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'userId debe ser un UUID válido'
    })
});

/**
 * GET BY ID - GET /reservations/:id
 * Valida que el ID sea un UUID válido
 * 
 * @param {string} id - UUID de la reserva
 */
export const getReservationByIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ID debe ser un UUID válido',
      'any.required': 'ID es requerido'
    })
});

/**
 * CONFIRM PAYMENT - POST /reservations/:id/confirm
 * Valida que el ID sea un UUID válido
 * 
 * @param {string} id - UUID de la reserva
 */
export const confirmPaymentSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ID debe ser un UUID válido',
      'any.required': 'ID es requerido'
    })
});

/**
 * CHECK-IN - POST /reservations/:id/checkin
 * Valida que el ID sea un UUID válido
 * 
 * @param {string} id - UUID de la reserva
 */
export const checkInReservationSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ID debe ser un UUID válido',
      'any.required': 'ID es requerido'
    })
});

/**
 * CANCEL - DELETE /reservations/:id
 * Valida que el ID sea un UUID válido
 * 
 * @param {string} id - UUID de la reserva
 */
export const cancelReservationSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ID debe ser un UUID válido',
      'any.required': 'ID es requerido'
    })
});

// ============================================
// RE-EXPORT
// ============================================

/**
 * Re-export del esquema UUID genérico para consistencia
 * Útil cuando solo se necesita validar un ID en la ruta
 */
export { uuidParamSchema } from '@shared/api/middlewares/common.validator';