// src/modules/users/application/commands/UpdateProfileCommand.ts
export class UpdateProfileCommand {
  readonly userId: string;
  readonly email?: string; // Opcional
  readonly nombre?: string; // Opcional

  constructor(data: { userId: string; email?: string; nombre?: string }) {
    if (!data.userId) {
      throw new Error('El ID de usuario es requerido');
    }

    // Validar que al menos un campo sea enviado
    if (data.email === undefined && data.nombre === undefined) {
      throw new Error('Debe proporcionar al menos un campo para actualizar (email o nombre)');
    }

    // Validar email SOLO si viene en la petición
    if (data.email !== undefined) {
      if (!data.email.includes('@')) {
        throw new Error('Email inválido');
      }
      this.email = data.email.toLowerCase().trim();
    }

    // Validar nombre SOLO si viene en la petición
    if (data.nombre !== undefined) {
      if (!data.nombre.trim() || data.nombre.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }
      this.nombre = data.nombre.trim();
    }

    this.userId = data.userId;
  }
}