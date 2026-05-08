import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();
const authController = new AuthController();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Ruta protegida
router.get('/profile', authMiddleware, authController.getProfile);

export default router;