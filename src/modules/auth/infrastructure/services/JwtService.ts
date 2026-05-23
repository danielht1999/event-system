// src/modules/auth/infrastructure/services/JwtService.ts
import jwt from 'jsonwebtoken';
import { IJwtService } from '../../domain/services/IJwtService';

const JWT_SECRET = process.env.JWT_SECRET || 'mi-secreto-super-seguro-2024';

export class JwtService implements IJwtService {
  sign(payload: { id: string; email: string; rol: string }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  verify(token: string): { id: string; email: string; rol: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as any;
    } catch {
      return null;
    }
  }
}
