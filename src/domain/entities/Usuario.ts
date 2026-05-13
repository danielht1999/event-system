// src/domain/entities/Usuario.ts
export type RolUsuario = 'ORGANIZADOR' | 'ASISTENTE';

export class Usuario {
  constructor(
    public readonly id: string,
    public email: string,
    public nombre: string,
    public rol: RolUsuario,
    public creadoEn: Date = new Date()
  ) {}

  esOrganizador(): boolean {
    return this.rol === 'ORGANIZADOR';
  }

  esAsistente(): boolean {
    return this.rol === 'ASISTENTE';
  }

  cambiarRol(nuevoRol: RolUsuario): void {
    if (this.rol === nuevoRol) return;
    this.rol = nuevoRol;
  }
}
