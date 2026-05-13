// src/api/routes/v1/auth.routes.ts
import { Router } from 'express';
import { authController } from '../../../infrastructure/di/container';
import { authenticate } from '../../middlewares/auth'; 

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);

export default router;
