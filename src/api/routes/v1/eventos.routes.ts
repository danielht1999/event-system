// src/api/routes/v1/eventos.routes.ts
import { Router } from 'express';
import { authenticate, organizadorMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { crearEventoSchema, actualizarEventoSchema } from '../../validators/evento.validator';
import { eventoController } from '../../../infrastructure/di/container';  // ← importar desde container

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get('/', eventoController.listar);           
router.get('/:id', eventoController.obtener);       
router.get('/:id/disponibilidad', eventoController.verDisponibilidad);

// Rutas protegidas (requieren autenticación y rol ORGANIZADOR)
router.post(
  '/',
  authenticate,
  organizadorMiddleware,
  validate(crearEventoSchema),
  eventoController.crear                    
);

router.put(
  '/:id',
  authenticate,
  organizadorMiddleware,
  validate(actualizarEventoSchema),
  eventoController.actualizar              
);

router.patch(
  '/:id/publicar',
  authenticate,
  organizadorMiddleware,
  eventoController.publicar                 
);

router.delete(
  '/:id',
  authenticate,
  organizadorMiddleware,
  eventoController.cancelar                 
);

export default router;