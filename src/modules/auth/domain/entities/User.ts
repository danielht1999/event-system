// src/modules/auth/domain/entities/User.ts

export type UserRole = 'ORGANIZADOR' | 'ASISTENTE';

export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public nombre: string,
    public rol: UserRole,
    public creadoEn: Date = new Date()
  ) {}

  esOrganizador(): boolean {
    return this.rol === 'ORGANIZADOR';
  }

  esAsistente(): boolean {
    return this.rol === 'ASISTENTE';
  }

  cambiarRol(nuevoRol: UserRole): void {
    if (this.rol === nuevoRol) return;
    this.rol = nuevoRol;
  }
}