// src/modules/auth/infrastructure/controllers/AuthController.ts

import { Request, Response } from 'express';
import { AuthRequest } from '@shared/api/middlewares/auth';
import { RegisterUserCommand } from '../../application/commands/RegisterUserCommand';
import { LoginCommand } from '../../application/commands/LoginCommand';
import { RegisterUserHandler } from '../../application/commands/RegisterUserHandler';
import { LoginHandler } from '../../application/commands/LoginHandler';
import { GetProfileHandler } from '../../application/queries/GetProfileHandler';
import { UpdateProfileHandler } from '../../application/commands/UpdateProfileHandler';
import { UpdateProfileCommand } from '../../application/commands/UpdateProfileCommand';
import { 
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  UserNotFoundError
} from '../../domain/errors';
import { ValidationError } from '@shared/domain/errors';

export class AuthController {
  constructor(
    private readonly registerHandler: RegisterUserHandler,
    private readonly loginHandler: LoginHandler,
    private readonly getProfileHandler: GetProfileHandler,
    private readonly updateProfileHandler: UpdateProfileHandler,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      // ✅ Eliminamos validación manual (ya la hace el middleware)
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
      this.handleError(res, error, 'Error al registrar usuario');
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // ✅ Eliminamos validación manual (ya la hace el middleware)
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
      this.handleError(res, error, 'Error al iniciar sesión');
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
      this.handleError(res, error, 'Error al obtener perfil');
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

      // ✅ Confiamos en el validador HTTP
      const command = new UpdateProfileCommand({
        userId: userId,
        email: req.body.email,
        nombre: req.body.nombre
      });

      const result = await this.updateProfileHandler.execute(command);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: result.user
      });
    } catch (error: any) {
      this.handleError(res, error, 'Error al actualizar perfil');
    }
  };

  /**
   * ✅ Centralizador de manejo de errores
   * Usa errores específicos del módulo Auth
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    // ✅ Email ya registrado (409 Conflict)
    if (error instanceof EmailAlreadyRegisteredError) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ Credenciales incorrectas (401 Unauthorized)
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ Usuario no encontrado (404 Not Found)
    if (error instanceof UserNotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ Errores de validación (400 Bad Request)
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    // ✅ Error genérico (500 Internal Server Error)
    console.error('Error no manejado:', error);
    res.status(500).json({
      success: false,
      message: defaultMessage,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
}