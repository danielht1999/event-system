// src/shared/api/routes/v1/events.routes.ts

import { Router } from 'express';
import { authenticate, organizadorMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { 
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
  getEventByIdSchema,
  getEventAvailabilitySchema,
  publishEventSchema,
  cancelEventSchema
} from '../../middlewares/event.validator';
import { eventController } from '@shared/infrastructure/di/container';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (con validaciones)
// ============================================

/**
 * GET /events
 * Lista eventos con soporte para filtros y paginación.
 */
router.get(
  '/', 
  authenticate, // Necesario para owner=me
  validate({ query: listEventsSchema }), // 
  eventController.list
);

/**
 * GET /events/:id
 * Obtiene un evento por ID (público)
 */
router.get(
  '/:id', 
  validate({ params: getEventByIdSchema }), 
  eventController.getById
);

/**
 * GET /events/:id/availability
 * Obtiene disponibilidad de un evento (público)
 */
router.get(
  '/:id/availability', 
  validate({ params: getEventAvailabilitySchema }), 
  eventController.getAvailability
);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación y rol organizador)
// ============================================

/**
 * POST /events
 * Crea un nuevo evento (organizador)
 */
router.post(
  '/', 
  authenticate, 
  organizadorMiddleware, 
  validate({ body: createEventSchema }), 
  eventController.create
);

/**
 * PUT /events/:id
 * Actualiza un evento existente (organizador)
 */
router.put(
  '/:id', 
  authenticate, 
  organizadorMiddleware, 
  validate({ 
    params: getEventByIdSchema,  
    body: updateEventSchema    
  }), 
  eventController.update
);

/**
 * PATCH /events/:id/publish
 * Publica un evento (organizador)
 */
router.patch(
  '/:id/publish', 
  authenticate, 
  organizadorMiddleware, 
  validate({ 
    params: publishEventSchema  
  }), 
  eventController.publish
);

/**
 * DELETE /events/:id
 * Cancela un evento (organizador)
 */
router.delete(
  '/:id', 
  authenticate, 
  organizadorMiddleware, 
  validate({ 
    params: cancelEventSchema    
  }), 
  eventController.cancel
);

export default router;