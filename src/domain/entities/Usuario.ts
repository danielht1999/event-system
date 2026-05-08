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
}
