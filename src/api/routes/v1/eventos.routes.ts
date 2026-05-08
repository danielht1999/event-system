import { Router } from 'express';
import { EventoController } from '../../controllers/EventoController';
import { authMiddleware, organizadorMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { crearEventoSchema, actualizarEventoSchema } from '../../validators/evento.validator';

const router = Router();
const eventoController = new EventoController();

// Rutas públicas
router.get('/', eventoController.listarEventos);
router.get('/:id', eventoController.obtenerEvento);
router.get('/:id/disponibilidad', eventoController.verDisponibilidad);

// Rutas protegidas (requieren autenticación)
router.post('/', authMiddleware, validate(crearEventoSchema), eventoController.crearEvento);
router.put('/:id', authMiddleware, validate(actualizarEventoSchema), eventoController.actualizarEvento);
router.patch('/:id/publicar', authMiddleware, organizadorMiddleware, eventoController.publicarEvento);
router.delete('/:id', authMiddleware, eventoController.cancelarEvento);

export default router;