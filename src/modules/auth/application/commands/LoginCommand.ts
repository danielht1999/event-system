// src/modules/auth/application/commands/LoginCommand.ts

import { ValidationError } from '@shared/domain/errors';

export class LoginCommand {
  readonly email: string;
  readonly password: string;

  constructor(data: { email: string; password: string }) {
    if (!data.email || !data.password) {
      throw new ValidationError('Email y password requeridos');
    }
    
    // ✅ Validación básica de email
    if (!data.email.includes('@')) {
      throw new ValidationError('Email inválido');
    }

    this.email = data.email.toLowerCase().trim();
    this.password = data.password;
  }
}