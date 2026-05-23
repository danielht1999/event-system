// src/shared/api/routes/v1/reservations.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { reservationController } from '@shared/infrastructure/di/container';
import { validate } from '../../middlewares/validation';
import { createReservationSchema } from '../../middlewares/reservation.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createReservationSchema), reservationController.createReservation);
router.get('/mis-reservas', reservationController.myReservations);
router.delete('/:id', reservationController.cancelReservation);
router.post('/:id/pagar', reservationController.confirmPayment);

export default router;