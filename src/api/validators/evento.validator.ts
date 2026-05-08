import Joi from 'joi';

export const crearEventoSchema = Joi.object({
  titulo: Joi.string().min(5).max(200).required(),
  descripcion: Joi.string().max(2000).required(),
  fecha: Joi.date().iso().greater('now').required(),
  lugar: Joi.string().max(300).required(),
  capacidad: Joi.number().integer().min(1).max(10000).required(),
  precio: Joi.number().min(0).required()
});

export const actualizarEventoSchema = Joi.object({
  titulo: Joi.string().min(5).max(200),
  descripcion: Joi.string().max(2000),
  lugar: Joi.string().max(300),
  precio: Joi.number().min(0)
});