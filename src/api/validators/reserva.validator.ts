import Joi from 'joi';

export const crearReservaSchema = Joi.object({
  eventoId: Joi.string().uuid().required(),
  cantidadTickets: Joi.number().integer().min(1).max(4).required().options({ convert: false }) // evita conversiones de "2" String a numeros
});