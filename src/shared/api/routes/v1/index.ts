// src/shared/api/routes/v1/index.ts
import { Router } from 'express';
import eventsRoutes from './events.routes';
import reservationsRoutes from './reservations.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/eventos', eventsRoutes);
router.use('/reservas', reservationsRoutes);

router.get('/', (req, res) => {
  res.json({
    message: 'API de Sistema de Eventos',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth (register, login, profile)',
      eventos: '/api/v1/eventos',
      reservas: '/api/v1/reservas'
    }
  });
});

export { router as v1Routes };