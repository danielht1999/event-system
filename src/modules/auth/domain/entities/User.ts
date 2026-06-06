// src/modules/auth/domain/entities/User.ts
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { Email } from '../value-objects/Email';

export type UserRole = 'ORGANIZADOR' | 'ASISTENTE';

export class User {
  private _domainEvents: IDomainEvent[] = [];
  private _email: Email; 

  constructor(
    public readonly id: string,
    emailInicial: string,           
    private _nombre: string,       
    private _rol: UserRole,        
    public readonly creadoEn: Date = new Date()
  ) {
    // El Value Object se encarga de validar, limpiar espacios y pasar a minúsculas al nacer
    this._email = new Email(emailInicial);
  }

  // =========================================================================
  // GETTERS (Lecturas seguras)
  // =========================================================================
  // Mantenemos el retorno como string plano para no romper la compatibilidad externa
  get email(): string { return this._email.value; }
  get nombre(): string { return this._nombre; }
  get rol(): UserRole { return this._rol; }

  // Obtenemos el objeto Value Object si el sistema lo requiere en algún punto de dominio
  get emailVO(): Email { return this._email; }

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

    this.recordEvent('UserRoleChanged', {
      userId: this.id,
      rolAnterior,
      nuevoRol
    });
  }

  // Ahora aceptamos el Value Object rico directamente desde el Handler
  actualizarPerfil(nuevoNombre: string, nuevoEmail: Email): void {
    this._nombre = nuevoNombre;
    this._email = nuevoEmail; // Guardamos el objeto ya validado

    this.recordEvent('UserProfileUpdated', {
      userId: this.id,
      nombre: this._nombre,
      email: this._email.value // Publicamos el string limpio en el evento
    });
  }
}