// src/shared/api/routes/v1/auth.routes.ts

import { Router } from 'express';
import { authController } from '@shared/infrastructure/di/container';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { 
  registerSchema,
  loginSchema,
  updateProfileSchema
} from '../../middlewares/auth.validator';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (Sin autenticación)
// ============================================

/**
 * POST /auth/register
 * Registra un nuevo usuario
 * 
 * @body {string} email - Email del usuario
 * @body {string} nombre - Nombre del usuario
 * @body {string} password - Contraseña (mínimo 6 caracteres)
 * @body {string} rol - Rol (ORGANIZADOR | ASISTENTE) - Opcional
 */
router.post(
  '/register',
  validate({ body: registerSchema }),
  authController.register
);

/**
 * POST /auth/login
 * Inicia sesión de usuario
 * 
 * @body {string} email - Email del usuario
 * @body {string} password - Contraseña del usuario
 */
router.post(
  '/login',
  validate({ body: loginSchema }),  
  authController.login
);

// ============================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ============================================

/**
 * GET /auth/profile
 * Obtiene el perfil del usuario autenticado
 * 
 * @header {string} Authorization - Bearer token
 */
router.get(
  '/profile',
  authenticate,  
  authController.getProfile
);

/**
 * PATCH /auth/profile
 * Actualiza el perfil del usuario autenticado
 * 
 * @header {string} Authorization - Bearer token
 * @body {string} email - Nuevo email (opcional)
 * @body {string} nombre - Nuevo nombre (opcional)
 * 
 * @rule Al menos un campo debe ser enviado
 */
router.patch(
  '/profile',
  authenticate,  
  validate({ body: updateProfileSchema }), 
  authController.updateProfile
);

export default router;