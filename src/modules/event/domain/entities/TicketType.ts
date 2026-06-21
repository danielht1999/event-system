// src/modules/event/domain/entities/TicketType.ts

import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { ValidationError } from '@shared/domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { Capacity } from '../value-objects/Capacity';

export type TicketTypeStatus =
  | 'ACTIVO'
  | 'AGOTADO'
  | 'DESACTIVADO';

export class TicketType {
  private _domainEvents: IDomainEvent[] = [];

  // =========================================================================
  // CONSTRUCTOR PRIVADO
  // =========================================================================
  private constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly nombre: string,
    public readonly precio: number,
    public readonly capacidadMaxima: Capacity,
    private _reservasPendientes: number,
    private _reservasConfirmadas: number,
    private _estado: TicketTypeStatus,
    public readonly creadoEn: Date
  ) {
    this.validate();
  }

  // =========================================================================
  // FACTORIES
  // =========================================================================

 public static create(
  id: string,
  eventId: string,
  nombre: string,
  precio: number,
  capacidadMaximaRaw: number 
): TicketType {
  // El dominio se encarga de fabricar y validar el Value Object internamente
  const capacidad = new Capacity(capacidadMaximaRaw);

  const ticketType = new TicketType(
    id,
    eventId,
    nombre,
    precio,
    capacidad, 
    0,
    0,
    'ACTIVO',
    new Date()
  );

  ticketType.recordEvent(
    DomainEventNames.TICKET_TYPE.CREATED,
    {
      ticketTypeId: ticketType.id,
      eventId: ticketType.eventId,
      nombre: ticketType.nombre
    }
  );

  return ticketType;
}

  public static reconstruct(
    id: string,
    eventId: string,
    nombre: string,
    precio: number,
    capacidadMaxima: Capacity,
    reservasPendientes: number,
    reservasConfirmadas: number,
    estado: TicketTypeStatus,
    creadoEn: Date
  ): TicketType {
    return new TicketType(
      id,
      eventId,
      nombre,
      precio,
      capacidadMaxima,
      reservasPendientes,
      reservasConfirmadas,
      estado,
      creadoEn
    );
  }

  // =========================================================================
  // GETTERS
  // =========================================================================
  get reservasPendientes(): number { return this._reservasPendientes; }
  get reservasConfirmadas(): number { return this._reservasConfirmadas; }
  get estado(): TicketTypeStatus { return this._estado; }

  get cuposDisponibles(): number {
    return (
      this.capacidadMaxima.value -
      this._reservasPendientes -
      this._reservasConfirmadas
    );
  }

  // =========================================================================
  // VALIDACIONES
  // =========================================================================
  private validate(): void {
    if (this.precio < 0) throw new ValidationError('El precio no puede ser negativo');
    if (this._reservasPendientes < 0) throw new ValidationError('Las reservas pendientes no pueden ser negativas');
    if (this._reservasConfirmadas < 0) throw new ValidationError('Las reservas confirmadas no pueden ser negativas');
    if (this._reservasPendientes + this._reservasConfirmadas > this.capacidadMaxima.value) {
      throw new ValidationError('Las reservas exceden la capacidad máxima');
    }
  }

  // =========================================================================
  // EVENTOS DE DOMINIO
  // =========================================================================
  private recordEvent(eventName: string, data: any): void {
    this._domainEvents.push({
      eventName,
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
  // COMPORTAMIENTO DE NEGOCIO
  // =========================================================================
  public estaLleno(): boolean {
    return this.cuposDisponibles <= 0;
  }

  public reservar(cantidad: number): void {
    if (this._estado !== 'ACTIVO') throw new ValidationError('El tipo de ticket no está disponible');
    if (cantidad <= 0) throw new ValidationError('La cantidad debe ser mayor a 0');
    if (cantidad > this.cuposDisponibles) throw new ValidationError('No hay cupos suficientes');

    this._reservasPendientes += cantidad;
    if (this.cuposDisponibles === 0) this.marcarComoAgotado();
  }

  public confirmarReserva(cantidad: number): void {
    if (cantidad <= 0) throw new ValidationError('La cantidad debe ser mayor a 0');
    if (cantidad > this._reservasPendientes) throw new ValidationError('No existen suficientes reservas pendientes');

    this._reservasPendientes -= cantidad;
    this._reservasConfirmadas += cantidad;

    if (this.cuposDisponibles === 0) this.marcarComoAgotado();

    this.recordEvent(
      DomainEventNames.TICKET_TYPE.RESERVATION_CONFIRMED,
      {
        ticketTypeId: this.id,
        eventId: this.eventId,
        cantidad
      }
    );
  }

  public liberarPendientes(cantidad: number): void {
    if (cantidad <= 0) throw new ValidationError('La cantidad debe ser mayor a 0');
    if (cantidad > this._reservasPendientes) throw new ValidationError('No existen suficientes reservas pendientes');

    this._reservasPendientes -= cantidad;
    if (this._estado === 'AGOTADO' && this.cuposDisponibles > 0) this._estado = 'ACTIVO';
  }

  public liberarConfirmadas(cantidad: number): void {
    if (cantidad <= 0) throw new ValidationError('La cantidad debe ser mayor a 0');
    if (cantidad > this._reservasConfirmadas) throw new ValidationError('No existen suficientes reservas confirmadas');

    this._reservasConfirmadas -= cantidad;
    if (this._estado === 'AGOTADO' && this.cuposDisponibles > 0) this._estado = 'ACTIVO';
  }

  public desactivar(): void {
    this._estado = 'DESACTIVADO';
  }

  public activar(): void {
    if (this.cuposDisponibles <= 0) throw new ValidationError('No se puede activar un ticket agotado');
    this._estado = 'ACTIVO';
  }

 /**
 * Incrementa la capacidad del ticket de forma segura.
 * Ahora recibe un primitivo, protegiendo la frontera del dominio.
 */
public incrementarCapacidad(nuevaCapacidadRaw: number): void {
  // El dominio se encarga de instanciar y validar su propio Value Object
  const nuevaCapacidad = new Capacity(nuevaCapacidadRaw);

  if (nuevaCapacidad.value <= this.capacidadMaxima.value) {
    throw new ValidationError('La nueva capacidad debe ser estrictamente mayor a la actual');
  }

  (this as any).capacidadMaxima = nuevaCapacidad;

  if (this._estado === 'AGOTADO' && this.cuposDisponibles > 0) {
    this._estado = 'ACTIVO';
  }

  this.recordEvent(DomainEventNames.TICKET_TYPE.UPDATED, {
    ticketTypeId: this.id,
    eventId: this.eventId,
    nuevaCapacidad: this.capacidadMaxima.value
  });
}

  /**
   * NUEVO: Permite modificar nombre y precio cuidando que no rompa las validaciones base.
   */
  public actualizarDatosComerciales(nombre?: string, precio?: number): void {
    if (precio !== undefined) {
      (this as any).precio = precio;
    }
    if (nombre !== undefined && nombre.trim() !== '') {
      (this as any).nombre = nombre.trim();
    }

    this.validate();
  }

  private marcarComoAgotado(): void {
    if (this._estado === 'AGOTADO') return;
    this._estado = 'AGOTADO';
    this.recordEvent(DomainEventNames.TICKET_TYPE.SOLD_OUT, {
      ticketTypeId: this.id,
      eventId: this.eventId
    });
  }
}