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

  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly nombre: string,
    public readonly precio: number,
    public readonly capacidadMaxima: Capacity,
    private _reservasPendientes: number = 0,
    private _reservasConfirmadas: number = 0,
    private _estado: TicketTypeStatus = 'ACTIVO',
    public readonly creadoEn: Date = new Date()
  ) {
    this.validate();
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get reservasPendientes(): number {
    return this._reservasPendientes;
  }

  get reservasConfirmadas(): number {
    return this._reservasConfirmadas;
  }

  get estado(): TicketTypeStatus {
    return this._estado;
  }

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
    if (this.precio < 0) {
      throw new ValidationError(
        'El precio no puede ser negativo'
      );
    }

    if (this._reservasPendientes < 0) {
      throw new ValidationError(
        'Las reservas pendientes no pueden ser negativas'
      );
    }

    if (this._reservasConfirmadas < 0) {
      throw new ValidationError(
        'Las reservas confirmadas no pueden ser negativas'
      );
    }

    if (
      this._reservasPendientes +
      this._reservasConfirmadas >
      this.capacidadMaxima.value
    ) {
      throw new ValidationError(
        'Las reservas exceden la capacidad máxima'
      );
    }
  }

  // =========================================================================
  // EVENTOS DE DOMINIO
  // =========================================================================

  public recordEvent(
    eventName: string,
    data: any
  ): void {
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

  /**
   * Reserva cupos temporalmente mientras el usuario completa el pago.
   */
  public reservar(cantidad: number): void {
    if (this._estado !== 'ACTIVO') {
      throw new ValidationError(
        'El tipo de ticket no está disponible'
      );
    }

    if (cantidad <= 0) {
      throw new ValidationError(
        'La cantidad debe ser mayor a 0'
      );
    }

    if (cantidad > this.cuposDisponibles) {
      throw new ValidationError(
        'No hay cupos suficientes'
      );
    }

    this._reservasPendientes += cantidad;

    if (this.cuposDisponibles === 0) {
      this.marcarComoAgotado();
    }
  }

  /**
   * Convierte reservas pendientes en reservas confirmadas
   * una vez aprobado el pago.
   */
  public confirmarReserva(
    cantidad: number
  ): void {
    if (cantidad <= 0) {
      throw new ValidationError(
        'La cantidad debe ser mayor a 0'
      );
    }

    if (cantidad > this._reservasPendientes) {
      throw new ValidationError(
        'No existen suficientes reservas pendientes'
      );
    }

    this._reservasPendientes -= cantidad;
    this._reservasConfirmadas += cantidad;

    if (this.cuposDisponibles === 0) {
      this.marcarComoAgotado();
    }

    this.recordEvent(
      DomainEventNames.TICKET_TYPE.RESERVATION_CONFIRMED,
      {
        ticketTypeId: this.id,
        eventId: this.eventId,
        cantidad
      }
    );
  }

  /**
   * Libera reservas pendientes cuando expiran o se cancelan
   * antes de ser pagadas.
   */
  public liberarPendientes(
    cantidad: number
  ): void {
    if (cantidad <= 0) {
      throw new ValidationError(
        'La cantidad debe ser mayor a 0'
      );
    }

    if (cantidad > this._reservasPendientes) {
      throw new ValidationError(
        'No existen suficientes reservas pendientes'
      );
    }

    this._reservasPendientes -= cantidad;

    if (
      this._estado === 'AGOTADO' &&
      this.cuposDisponibles > 0
    ) {
      this._estado = 'ACTIVO';
    }
  }

  /**
   * Libera reservas confirmadas cuando se procesa
   * una cancelación o devolución.
   */
  public liberarConfirmadas(
    cantidad: number
  ): void {
    if (cantidad <= 0) {
      throw new ValidationError(
        'La cantidad debe ser mayor a 0'
      );
    }

    if (cantidad > this._reservasConfirmadas) {
      throw new ValidationError(
        'No existen suficientes reservas confirmadas'
      );
    }

    this._reservasConfirmadas -= cantidad;

    if (
      this._estado === 'AGOTADO' &&
      this.cuposDisponibles > 0
    ) {
      this._estado = 'ACTIVO';
    }
  }

  public desactivar(): void {
    this._estado = 'DESACTIVADO';
  }

  public activar(): void {
    if (this.cuposDisponibles <= 0) {
      throw new ValidationError(
        'No se puede activar un ticket agotado'
      );
    }

    this._estado = 'ACTIVO';
  }

  private marcarComoAgotado(): void {
    if (this._estado === 'AGOTADO') {
      return;
    }

    this._estado = 'AGOTADO';

    this.recordEvent(
      DomainEventNames.TICKET_TYPE.SOLD_OUT,
      {
        ticketTypeId: this.id,
        eventId: this.eventId
      }
    );
  }
}