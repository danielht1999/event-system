// src/modules/auth/infrastructure/controllers/AuthController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { RegisterUserCommand } from '../../application/commands/RegisterUserCommand';
import { LoginCommand } from '../../application/commands/LoginCommand';
import { RegisterUserHandler } from '../../application/commands/RegisterUserHandler';
import { LoginHandler } from '../../application/commands/LoginHandler';
import { GetProfileHandler } from '../../application/queries/GetProfileHandler';
import { UpdateProfilehandler } from '../../application/commands/UpdateProfileHandler';
import { UpdateProfileCommand } from '../../application/commands/UpdateProfileCommand';

export class AuthController {
  constructor(
    private registerHandler: RegisterUserHandler,
    private loginHandler: LoginHandler,
    private getProfileHandler: GetProfileHandler,
    private updateProfileHandler: UpdateProfilehandler,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validación básica de existencia de campos
      if (!req.body.email || !req.body.password || !req.body.nombre) {
        res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: email, password, nombre'
        });
        return;
      }

      const command = new RegisterUserCommand({
        email: req.body.email,
        nombre: req.body.nombre,
        password: req.body.password,
        rol: req.body.rol
      });

      const result = await this.registerHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error: any) {
      // Errores de validación del comando o del handler
      const isClientError = error.message.includes('Email') ||
                            error.message.includes('password') ||
                            error.message.includes('Nombre') ||
                            error.message.includes('registrado');

      const status = isClientError ? 400 : 500;

      res.status(status).json({
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.body.email || !req.body.password) {
        res.status(400).json({
          success: false,
          message: 'Email y password requeridos'
        });
        return;
      }

      const command = new LoginCommand({
        email: req.body.email,
        password: req.body.password
      });

      const result = await this.loginHandler.execute(command);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error: any) {
      const status = error.message === 'Email o contraseña incorrectos' ? 401 : 500;

      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };

  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      const profile = await this.getProfileHandler.execute(userId);

      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      const status = error.message === 'Usuario no encontrado' ? 404 : 500;
      
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  };

  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }
      const command = new UpdateProfileCommand({
        userId: userId,
        email: req.body.email,
        nombre: req.body.nombre
      });

      const update = await this.updateProfileHandler.execute(command);

      res.json({
        success: true,
        data: update
      });
     } catch (error: any) {
      const status = error.message === 'Usuario no encontrado' ? 404 : 500;
      
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
 }
}
