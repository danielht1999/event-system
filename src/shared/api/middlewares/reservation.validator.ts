// src/shared/api/middlewares/reservation.validator.ts
import Joi from 'joi';

export const createReservationSchema = Joi.object({
  eventoId: Joi.string().uuid().required(),
  cantidadTickets: Joi.number().integer().min(1).max(4).required().options({ convert: false })
});