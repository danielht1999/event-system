// src/shared/api/routes/v1/events.routes.ts
import { Router } from 'express';
import { authenticate, organizadorMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { createEventSchema, updateEventSchema } from '../../middlewares/event.validator';
import { eventController } from '@shared/infrastructure/di/container';

const router = Router();

// Public routes
// Regla 3: Se unifican todos los eventos en GET /
// Para 'mis-eventos', el cliente usará GET /?owner=me
router.get('/', eventController.list); 
router.get('/:id', eventController.getById);
router.get('/:id/availability', eventController.getAvailability);

// Protected routes
// Regla 4 y 10: Comandos explícitos y nombres en inglés
router.post('/', authenticate, organizadorMiddleware, validate(createEventSchema), eventController.create);
router.put('/:id', authenticate, organizadorMiddleware, validate(updateEventSchema), eventController.update);
router.patch('/:id/publish', authenticate, organizadorMiddleware, eventController.publish);
router.delete('/:id', authenticate, organizadorMiddleware, eventController.cancel);

export default router;