// src/api/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../infrastructure/services/JwtService';

const jwtService = new JwtService();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: string;  // 'ORGANIZADOR' | 'ASISTENTE'
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      message: 'Formato de token inválido. Use: Bearer <token>'
    });
    return;
  }

  const token = parts[1];
  const decoded = jwtService.verify(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
    return;
  }

  req.user = decoded;
  next();
};

export const organizadorMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'ORGANIZADOR') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de ORGANIZADOR.'
    });
    return;
  }
  next();
};

export const asistenteMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'ASISTENTE') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de ASISTENTE.'
    });
    return;
  }
  next();
};

// Middleware opcional: permite ASISTENTE o ORGANIZADOR
export const allowAsistenteOrOrganizador = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'ASISTENTE' && req.user?.rol !== 'ORGANIZADOR') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de ASISTENTE u ORGANIZADOR.'
    });
    return;
  }
  next();
};
