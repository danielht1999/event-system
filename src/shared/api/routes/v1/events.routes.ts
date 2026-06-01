// src/shared/api/routes/v1/events.routes.ts
import { Router } from 'express';
import { authenticate, organizadorMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { createEventSchema, updateEventSchema } from '../../middlewares/event.validator';
import { eventController } from '@shared/infrastructure/di/container';

const router = Router();

/// Rutas públicas
router.get('/', eventController.listar);
router.get('/mis-eventos', authenticate, organizadorMiddleware, eventController.misEventos); 
router.get('/:id', eventController.obtener);
router.get('/:id/disponibilidad', eventController.verDisponibilidad);

// Rutas protegidas
router.post('/', authenticate, organizadorMiddleware, validate(createEventSchema), eventController.crear);
router.put('/:id', authenticate, organizadorMiddleware, validate(updateEventSchema), eventController.actualizar);
router.patch('/:id/publicar', authenticate, organizadorMiddleware, eventController.publicar);
router.delete('/:id', authenticate, organizadorMiddleware, eventController.cancelar);

export default router;