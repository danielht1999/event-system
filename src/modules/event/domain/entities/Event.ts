// src/modules/event/domain/entities/Event.ts

import { EventDate } from '../value-objects/EventDate';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { EventNotInDraftError } from '../errors';
import { Capacity } from '../value-objects/Capacity';
import { ValidationError } from '@shared/domain/errors';

export type EventStatus =
  | 'BORRADOR'
  | 'PUBLICADA'
  | 'CANCELADA'
  | 'FINALIZADA';

export class Event {
  private _domainEvents: IDomainEvent[] = [];

  private constructor(
    public readonly id: string,
    private _titulo: string,
    private _descripcion: string,
    private _fecha: EventDate,
    private _lugar: string,
    private _capacidadTotal: Capacity,
    public readonly organizadorId: string,
    private _estado: EventStatus,
    public readonly creadoEn: Date
  ) {}

  // =========================================================================
  // FACTORIES
  // =========================================================================

  public static create(
    id: string,
    titulo: string,
    descripcion: string,
    fechaRaw: Date,
    lugar: string,
    capacidadTotal: number,
    organizadorId: string
  ): Event {
    const fecha = EventDate.create(fechaRaw);
    const event = new Event(
      id,
      titulo,
      descripcion,
      fecha,
      lugar,
      new Capacity(capacidadTotal),
      organizadorId,
      'BORRADOR',
      new Date()
    );
    
    event.recordEvent(DomainEventNames.EVENT.CREATED, {
      eventId: event.id,
      organizerId: event.organizadorId,
      titulo: event._titulo,
      descripcion: event._descripcion,
      fecha: event._fecha.value.toISOString(),
      lugar: event._lugar,
      capacidadTotal: event.capacidadTotal,
      estado: event._estado
    });
    
    return event;
  }

  public static reconstruct(
    id: string,
    titulo: string,
    descripcion: string,
    fechaRaw: Date,
    lugar: string,
    capacidadTotal: number,
    organizadorId: string,
    estado: EventStatus,
    creadoEn: Date
  ): Event {
    return new Event(
      id,
      titulo,
      descripcion,
      EventDate.create(fechaRaw),
      lugar,
      new Capacity(capacidadTotal),
      organizadorId,
      estado,
      creadoEn
    );
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get titulo(): string {
    return this._titulo;
  }

  get descripcion(): string {
    return this._descripcion;
  }

  get fecha(): EventDate {
    return this._fecha;
  }

  get lugar(): string {
    return this._lugar;
  }

  get estado(): EventStatus {
    return this._estado;
  }

  get capacidadTotal(): number {
    return this._capacidadTotal.value;
  }

  // =========================================================================
  // DOMAIN EVENTS
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
  // BUSINESS RULES
  // =========================================================================

  public cambiarDetalles(props: {
    titulo?: string;
    descripcion?: string;
    fecha?: Date;
    lugar?: string;
    capacidadTotal?: number;
  }): void {
    if (this._estado !== 'BORRADOR') {
      throw new EventNotInDraftError(this.id);
    }

    // TODO:
    // Cuando exista coordinación Event + TicketType,
    // impedir reducir capacidadTotal por debajo
    // de la capacidad ya distribuida entre tickets.

    if (props.titulo !== undefined) {
      this._titulo = props.titulo;
    }
    if (props.descripcion !== undefined) {
      this._descripcion = props.descripcion;
    }
    if (props.lugar !== undefined) {
      this._lugar = props.lugar;
    }
    if (props.fecha !== undefined) {
      this._fecha = EventDate.create(props.fecha);
    }
    if (props.capacidadTotal !== undefined) {
      if (props.capacidadTotal <= 0) {
        throw new ValidationError('La capacidadTotal debe ser mayor a 0');
      }
      if (props.capacidadTotal > 10000) {
        throw new ValidationError('La capacidadTotal no puede ser mayor a 10000');
      }
      this._capacidadTotal = new Capacity(props.capacidadTotal);
    }

    this.recordEvent(DomainEventNames.EVENT.UPDATED, {
      eventId: this.id,
      organizerId: this.organizadorId,
      titulo: this._titulo,
      descripcion: this._descripcion,
      fecha: this._fecha.value.toISOString(),
      lugar: this._lugar,
      capacidadTotal: this.capacidadTotal,
      estado: this._estado
    });
  }

  public publicar(): void {
    if (this._estado !== 'BORRADOR') {
      throw new EventNotInDraftError(this.id);
    }
    this._estado = 'PUBLICADA';
    
    this.recordEvent(DomainEventNames.EVENT.STATUS_UPDATED, {
      eventId: this.id,
      organizerId: this.organizadorId,
      titulo: this._titulo,
      descripcion: this._descripcion,
      fecha: this._fecha.value.toISOString(),
      lugar: this._lugar,
      capacidadTotal: this.capacidadTotal,
      estado: this._estado
    });
  }

  public cancelar(): void {
    if (this._estado === 'CANCELADA') {
      return;
    }
    this._estado = 'CANCELADA';
    
    this.recordEvent(DomainEventNames.EVENT.CANCELLED, {
      eventId: this.id,
      organizerId: this.organizadorId,
      titulo: this._titulo,
      descripcion: this._descripcion,
      fecha: this._fecha.value.toISOString(),
      lugar: this._lugar,
      capacidadTotal: this.capacidadTotal,
      estado: this._estado
    });
  }

  public finalizar(): void {
    if (this._estado !== 'PUBLICADA') {
      throw new ValidationError('Solo se pueden finalizar eventos publicados');
    }
    this._estado = 'FINALIZADA';
    
    this.recordEvent(DomainEventNames.EVENT.FINISHED, {
      eventId: this.id,
      organizerId: this.organizadorId,
      titulo: this._titulo,
      descripcion: this._descripcion,
      fecha: this._fecha.value.toISOString(),
      lugar: this._lugar,
      capacidadTotal: this.capacidadTotal,
      estado: this._estado
    });
  }

  /**
   * Creación inicial del evento.
   * Valida que la capacidad asignada a los tickets no exceda la capacidadTotal
   */
  public validarDistribucionInicial(capacidadAsignada: number): void {
    if (capacidadAsignada > this.capacidadTotal) {
      throw new ValidationError(
        `La capacidad asignada a los tickets (${capacidadAsignada}) excede la capacidad total del evento (${this.capacidadTotal})`
      );
    }
  }

  /**
   * Operaciones posteriores sobre TicketTypes.
   * Valida que al agregar/modificar tickets no se exceda la capacidadTotal
   */
  public validarAforoTotal(
    aforosOtrosTickets: number[],
    nuevoAforoTicket: number = 0
  ): void {
    const aforoTotalExistente = aforosOtrosTickets.reduce((acc, cap) => acc + cap, 0);
    const aforoPropuestoCompleto = aforoTotalExistente + nuevoAforoTicket;
    if (aforoPropuestoCompleto > this.capacidadTotal) {
      throw new ValidationError(
        `La capacidad total de los tickets (${aforoPropuestoCompleto}) excede la capacidad del evento (${this.capacidadTotal})`
      );
    }
  }
}