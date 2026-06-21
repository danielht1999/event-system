// src/modules/event/domain/entities/Event.ts

import { EventDate } from '../value-objects/EventDate';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { EventNotInDraftError } from '../errors';
import { Capacity } from '../value-objects/Capacity'; 

export type EventStatus =
  | 'BORRADOR'
  | 'PUBLICADA'
  | 'CANCELADA';

export class Event {
  private _domainEvents: IDomainEvent[] = [];

  // =========================================================================
  // CONSTRUCTOR PRIVADO
  // =========================================================================

  private constructor(
    public readonly id: string,
    private _titulo: string,
    private _descripcion: string,
    private _fecha: EventDate,
    private _lugar: string,
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
    fechaRaw: Date, // Cambiado a Date nativo
    lugar: string,
    organizadorId: string
  ): Event {
    // El dominio encapsula la instanciación de su propio Value Object
    const fecha = EventDate.create(fechaRaw);

    const event = new Event(
      id,
      titulo,
      descripcion,
      fecha,
      lugar,
      organizadorId,
      'BORRADOR',
      new Date()
    );

    event.recordEvent(
      DomainEventNames.EVENT.CREATED,
      {
        eventId: event.id,
        organizerId: event.organizadorId
      }
    );

    return event;
  }

  public static reconstruct(
    id: string,
    titulo: string,
    descripcion: string,
    fechaRaw: Date, // Cambiado a Date nativo para limpiar los mappers de infraestructura
    lugar: string,
    organizadorId: string,
    estado: EventStatus,
    creadoEn: Date
  ): Event {
    return new Event(
      id,
      titulo,
      descripcion,
      EventDate.create(fechaRaw), //Protegemos la hidratación histórica
      lugar,
      organizadorId,
      estado,
      creadoEn
    );
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get titulo(): string { return this._titulo; }
  get descripcion(): string { return this._descripcion; }
  get fecha(): EventDate { return this._fecha; }
  get lugar(): string { return this._lugar; }
  get estado(): EventStatus { return this._estado; }

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
    fecha?: Date; //Cambiado de EventDate a Date nativo
    lugar?: string;
  }): void {
    if (this._estado !== 'BORRADOR') {
      throw new EventNotInDraftError(this.id);
    }

    if (props.titulo !== undefined) this._titulo = props.titulo;
    if (props.descripcion !== undefined) this._descripcion = props.descripcion;
    if (props.lugar !== undefined) this._lugar = props.lugar;
    
    if (props.fecha !== undefined) {
      // El propio agregado decide cómo instanciar y validar la fecha
      this._fecha = EventDate.create(props.fecha);
    }

    this.recordEvent(
      DomainEventNames.EVENT.UPDATED,
      {
        eventId: this.id,
        organizerId: this.organizadorId,
        cambios: {
          titulo: props.titulo,
          fecha: this._fecha.value.toISOString(),
          lugar: props.lugar
        }
      }
    );
  }

  public publicar(): void {
    if (this._estado !== 'BORRADOR') {
      throw new EventNotInDraftError(this.id);
    }

    this._estado = 'PUBLICADA';

    this.recordEvent(
      DomainEventNames.EVENT.STATUS_UPDATED,
      {
        eventId: this.id,
        organizerId: this.organizadorId,
        estado: this._estado
      }
    );
  }

  public cancelar(): void {
    if (this._estado === 'CANCELADA') {
      return;
    }

    this._estado = 'CANCELADA';

    this.recordEvent(
      DomainEventNames.EVENT.CANCELLED,
      {
        eventId: this.id,
        organizerId: this.organizadorId
      }
    );
  }

  /**
   * Valida que la suma acumulada de aforos no rompa los límites lógicos
   * ni la regla de negocio de tu Value Object Capacity (10k personas).
   */
  public validarAforoTotal(aforosOtrosTickets: number[], nuevoAforoTicket: number = 0): void {
    const aforoTotalExistente = aforosOtrosTickets.reduce((acc, cap) => acc + cap, 0);
    const aforoPropuestoCompleto = aforoTotalExistente + nuevoAforoTicket;
    new Capacity(aforoPropuestoCompleto);
  }
}