// src/modules/auth/application/commands/RegisterUserCommand.ts
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

    // Validación de rol
    const validRoles: string[] = ['ORGANIZADOR', 'ASISTENTE'];
    const userRol = data.rol || 'ASISTENTE';
    
    if (!validRoles.includes(userRol)) {
      throw new Error('Rol inválido. Los roles válidos son: ORGANIZADOR o ASISTENTE');
    }

    this.email = data.email.toLowerCase();
    this.nombre = data.nombre.trim();
    this.password = data.password;
    this.rol = userRol; // Asigna el rol validado directamente
  }
}