import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { reservaController } from '../../../infrastructure/di/container';
import { validate } from '../../middlewares/validation';
import { crearReservaSchema } from '../../validators/reserva.validator';

const router = Router();

router.use(authenticate); //  aplica a TODAS las rutas

router.post('/', validate(crearReservaSchema), reservaController.crearReserva);
router.get('/mis-reservas', reservaController.misReservas);
router.delete('/:id', reservaController.cancelarReserva);
router.post('/:id/pagar', reservaController.confirmarPago);

export default router;
