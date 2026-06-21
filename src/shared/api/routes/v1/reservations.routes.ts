// src/shared/api/routes/v1/reservations.routes.ts

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { createReservationSchema } from '../../middlewares/reservation.validator';
import { reservationController } from '@shared/infrastructure/di/container';

const router = Router();

// Protected routes
router.use(authenticate);

router.get('/', reservationController.list);
router.post('/', validate(createReservationSchema), reservationController.createReservation);
router.post('/:id/confirm', reservationController.confirmPayment);
router.delete('/:id', reservationController.cancelReservation);

export default router;