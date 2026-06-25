// src/modules/auth/application/commands/RegisterUserCommand.ts

import { ValidationError } from '@shared/domain/errors';
import { EmailAlreadyRegisteredError } from '../../domain/errors';

export class RegisterUserCommand {
  readonly email: string;
  readonly nombre: string;
  readonly password: string;
  readonly rol: string;

  constructor(data: { email: string; nombre: string; password: string; rol?: string }) {
    // ✅ Validaciones con errores específicos
    if (!data.email?.includes('@')) {
      throw new ValidationError('Email inválido');
    }
    if (!data.password || data.password.length < 6) {
      throw new ValidationError('Password debe tener al menos 6 caracteres');
    }
    if (!data.nombre?.trim()) {
      throw new ValidationError('Nombre es requerido');
    }

    // Validación de rol
    const validRoles = ['ORGANIZADOR', 'ASISTENTE'];
    const userRol = data.rol || 'ASISTENTE';
    if (!validRoles.includes(userRol)) {
      throw new ValidationError('Rol inválido. Los roles válidos son: ORGANIZADOR o ASISTENTE');
    }

    // ✅ Asignación con normalización
    this.email = data.email.toLowerCase().trim();
    this.nombre = data.nombre.trim();
    this.password = data.password;
    this.rol = userRol;
  }
}