import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mi-secreto-super-seguro-2024';

// Extender Request de Express
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido. Use: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      rol: string;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

export const organizadorMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'organizador') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de organizador.'
    });
  }
  next();
};

export const asistenteMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'asistente' && req.user?.rol !== 'organizador') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de asistente.'
    });
  }
  next();
};