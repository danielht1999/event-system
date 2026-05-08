import { Router } from 'express';
import { ReservaController } from '../../controllers/ReservaController';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();
const reservaController = new ReservaController();

router.use(authMiddleware);

router.post('/', reservaController.crearReserva);
router.get('/mis-reservas', reservaController.misReservas);
router.delete('/:id', reservaController.cancelarReserva);
router.post('/:id/pagar', reservaController.confirmarPago);

export default router;