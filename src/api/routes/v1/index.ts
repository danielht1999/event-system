import { Router } from 'express';
import eventosRoutes from './eventos.routes';
import reservasRoutes from './reservas.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/eventos', eventosRoutes);
router.use('/reservas', reservasRoutes);

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
