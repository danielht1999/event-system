// src/modules/auth/domain/entities/User.ts

import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { Email } from '../value-objects/Email';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { ValidationError } from '@shared/domain/errors';

export type UserRole = 'ORGANIZADOR' | 'ASISTENTE';

export interface UserProps {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  creadoEn?: Date;
  passwordHash?: string;
}

export class User {
  private _domainEvents: IDomainEvent[] = [];
  private _email: Email;
  private _nombre: string;
  private _rol: UserRole;
  private _passwordHash?: string;

  private constructor(
    public readonly id: string,
    email: string,
    nombre: string,
    rol: UserRole,
    public readonly creadoEn: Date = new Date(),
    passwordHash?: string
  ) {
    this.validateNombre(nombre);
    this.validateRol(rol);
    
    this._email = new Email(email);
    this._nombre = nombre.trim();
    this._rol = rol;
    this._passwordHash = passwordHash;
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  /**
   * ✅ Para CREAR un nuevo usuario (registro)
   * Emite evento USER_CREATED
   */
  public static create(props: {
    id: string;
    email: string;
    nombre: string;
    rol: UserRole;
    passwordHash: string;
  }): User {
    const user = new User(
      props.id,
      props.email,
      props.nombre,
      props.rol,
      new Date(),
      props.passwordHash
    );
    
    // ✅ La entidad emite su propio evento de creación
    user.recordEvent(DomainEventNames.AUTH.USER_CREATED, {
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol
    });

    return user;
  }

  /**
   * ✅ Para RECONSTRUIR un usuario desde la DB
   * NO emite eventos (ya ocurrieron)
   */
  public static reconstitute(props: {
    id: string;
    email: string;
    nombre: string;
    rol: UserRole;
    creadoEn: Date;
    passwordHash?: string;
  }): User {
    return new User(
      props.id,
      props.email,
      props.nombre,
      props.rol,
      props.creadoEn,
      props.passwordHash
    );
  }

  // =========================================================================
  // VALIDACIONES PRIVADAS
  // =========================================================================

  private validateNombre(nombre: string): void {
    if (!nombre || nombre.trim().length < 2) {
      throw new ValidationError('El nombre debe tener al menos 2 caracteres');
    }
    if (nombre.trim().length > 50) {
      throw new ValidationError('El nombre no puede tener más de 50 caracteres');
    }
  }

  private validateRol(rol: UserRole): void {
    const validRoles: UserRole[] = ['ORGANIZADOR', 'ASISTENTE'];
    if (!validRoles.includes(rol)) {
      throw new ValidationError('El rol debe ser ORGANIZADOR o ASISTENTE');
    }
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get email(): string { return this._email.value; }
  get nombre(): string { return this._nombre; }
  get rol(): UserRole { return this._rol; }
  get emailVO(): Email { return this._email; }
  get passwordHash(): string | undefined { return this._passwordHash; }

  // =========================================================================
  // EVENTOS DE DOMINIO
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
  // MÉTODOS DE NEGOCIO
  // =========================================================================

  esOrganizador(): boolean {
    return this._rol === 'ORGANIZADOR';
  }

  esAsistente(): boolean {
    return this._rol === 'ASISTENTE';
  }

  cambiarRol(nuevoRol: UserRole): void {
    this.validateRol(nuevoRol);
    
    if (this._rol === nuevoRol) return;
    
    const rolAnterior = this._rol;
    this._rol = nuevoRol;

    this.recordEvent(DomainEventNames.AUTH.USER_ROLE_CHANGED, {
      userId: this.id,
      rolAnterior,
      nuevoRol
    });
  }

  actualizarPerfil(nuevoNombre: string, nuevoEmail: Email): void {
    this.validateNombre(nuevoNombre);
    
    this._nombre = nuevoNombre.trim();
    this._email = nuevoEmail;

    this.recordEvent(DomainEventNames.AUTH.USER_PROFILE_UPDATED, {
      userId: this.id,
      nombre: this._nombre,
      email: this._email.value
    });
  }
}