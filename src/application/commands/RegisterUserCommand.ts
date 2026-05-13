// src/application/commands/RegisterUserCommand.ts
export class RegisterUserCommand {
  readonly email: string;
  readonly nombre: string;
  readonly password: string;
  readonly rol: string;  // 'ORGANIZADOR' | 'ASISTENTE'

  constructor(data: { email: string; nombre: string; password: string; rol?: string }) {
    if (!data.email?.includes('@')) {
      throw new Error('Email inválido');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Password debe tener al menos 6 caracteres');
    }
    if (!data.nombre?.trim()) {
      throw new Error('Nombre es requerido');
    }

    this.email = data.email.toLowerCase();
    this.nombre = data.nombre.trim();
    this.password = data.password;
    this.rol = data.rol === 'ORGANIZADOR' ? 'ORGANIZADOR' : 'ASISTENTE';
  }
}
