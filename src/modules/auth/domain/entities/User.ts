// src/modules/auth/domain/entities/User.ts
import { IDomainEvent } from '@shared/domain/IDomainEvent';

export type UserRole = 'ORGANIZADOR' | 'ASISTENTE';

export class User {
  // 1. Consistencia estructural con la bolsa de eventos
  private _domainEvents: IDomainEvent[] = [];

  constructor(
    public readonly id: string,
    private _email: string,        // 2. Protegemos contra mutaciones directas de infraestructura
    private _nombre: string,       // 2. Protegemos contra mutaciones directas de infraestructura
    private _rol: UserRole,        // 2. Protegemos contra mutaciones directas de infraestructura
    public readonly creadoEn: Date = new Date()
  ) {
    this.validarEmail(this._email);
  }

  // =========================================================================
  // GETTERS (Lecturas seguras)
  // =========================================================================
  get email(): string { return this._email; }
  get nombre(): string { return this._nombre; }
  get rol(): UserRole { return this._rol; }

  // =========================================================================
  // CONTROL DE EVENTOS DE DOMINIO
  // =========================================================================
  public recordEvent(name: string, data: any): void {
    this._domainEvents.push({
      eventName: name,
      occurredOn: new Date(),
      data
    });
  }

  public pullDomainEvents(): IDomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // =========================================================================
  // NÚCLEO DDD: ACCIONES EXPLICITAS Y VALIDACIONES
  // =========================================================================
  private validarEmail(email: string): void {
    if (!email.includes('@')) {
      throw new Error('El formato del correo electrónico es inválido');
    }
  }

  esOrganizador(): boolean {
    return this._rol === 'ORGANIZADOR';
  }

  esAsistente(): boolean {
    return this._rol === 'ASISTENTE';
  }

  cambiarRol(nuevoRol: UserRole): void {
    if (this._rol === nuevoRol) return;
    
    const rolAnterior = this._rol;
    this._rol = nuevoRol;

    // Hecho histórico: Útil a futuro para el punto 14 (Blacklist/invalidar JWT)
    this.recordEvent('UserRoleChanged', {
      userId: this.id,
      rolAnterior,
      nuevoRol
    });
  }

  actualizarPerfil(nuevoNombre: string, nuevoEmail: string): void {
    this.validarEmail(nuevoEmail);
    this._nombre = nuevoNombre;
    this._email = nuevoEmail;

    this.recordEvent('UserProfileUpdated', {
      userId: this.id,
      nombre: this._nombre,
      email: this._email
    });
  }
}