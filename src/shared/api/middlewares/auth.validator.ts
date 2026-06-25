import Joi from 'joi';

/**
 * REGISTER - POST /auth/register
 * 
 * @body {string} email - Email del usuario
 * @body {string} nombre - Nombre del usuario
 * @body {string} password - Contraseña (mínimo 6 caracteres)
 * @body {string} rol - Rol del usuario (ORGANIZADOR | ASISTENTE) - Opcional
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': 'email debe ser un string',
      'string.email': 'email debe ser un correo electrónico válido',
      'any.required': 'email es requerido'
    }),
  
  nombre: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.base': 'nombre debe ser un string',
      'string.min': 'nombre debe tener al menos 2 caracteres',
      'string.max': 'nombre no puede tener más de 50 caracteres',
      'any.required': 'nombre es requerido'
    }),
  
  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({
      'string.base': 'password debe ser un string',
      'string.min': 'password debe tener al menos 6 caracteres',
      'string.max': 'password no puede tener más de 50 caracteres',
      'any.required': 'password es requerido'
    }),
  
  rol: Joi.string()
    .valid('ORGANIZADOR', 'ASISTENTE')
    .optional()
    .default('ASISTENTE')
    .messages({
      'string.base': 'rol debe ser un string',
      'any.only': 'rol debe ser ORGANIZADOR o ASISTENTE'
    })
});

/**
 * LOGIN - POST /auth/login
 * 
 * @body {string} email - Email del usuario
 * @body {string} password - Contraseña del usuario
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.base': 'email debe ser un string',
      'string.email': 'email debe ser un correo electrónico válido',
      'any.required': 'email es requerido'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.base': 'password debe ser un string',
      'any.required': 'password es requerido'
    })
});

/**
 * UPDATE PROFILE - PATCH /auth/profile
 * 
 * @body {string} email - Nuevo email (opcional)
 * @body {string} nombre - Nuevo nombre (opcional)
 * 
 * @rule Al menos un campo debe ser enviado
 */
export const updateProfileSchema = Joi.object({
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.base': 'email debe ser un string',
      'string.email': 'email debe ser un correo electrónico válido'
    }),
  
  nombre: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.base': 'nombre debe ser un string',
      'string.min': 'nombre debe tener al menos 2 caracteres',
      'string.max': 'nombre no puede tener más de 50 caracteres'
    })
})
.custom((value, helpers) => {
  // ✅ Validar que al menos un campo sea enviado
  if (!value.email && !value.nombre) {
    return helpers.error('any.invalid', {
      message: 'Debe proporcionar al menos un campo para actualizar (email o nombre)'
    });
  }
  return value;
});