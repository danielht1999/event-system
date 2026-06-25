// src/shared/api/routes/v1/reservations.routes.ts

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validation';
import { 
  createReservationSchema,
  listReservationsSchema,
  confirmPaymentSchema,
  cancelReservationSchema
} from '../../middlewares/reservation.validator';
import { reservationController } from '@shared/infrastructure/di/container';

const router = Router();

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(authenticate);

// ============================================
// RUTAS EXISTENTES CON VALIDACIÓN
// ============================================

/**
 * GET /reservations
 * Lista reservas con paginación y filtros
 */
router.get(
  '/', 
  validate({ query: listReservationsSchema }),  
  reservationController.list
);

/**
 * POST /reservations
 * Crea una nueva reserva
 */
router.post(
  '/', 
  validate({ body: createReservationSchema }), 
  reservationController.createReservation
);

/**
 * POST /reservations/:id/confirm
 * Confirma el pago de una reserva
 */
router.post(
  '/:id/confirm', 
  validate({ 
    params: confirmPaymentSchema   
  }), 
  reservationController.confirmPayment
);

/**
 * DELETE /reservations/:id
 * Cancela una reserva
 */
router.delete(
  '/:id', 
  validate({ 
    params: cancelReservationSchema   
  }), 
  reservationController.cancelReservation
);

export default router;