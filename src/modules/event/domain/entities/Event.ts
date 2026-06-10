// src/modules/event/domain/entities/Event.ts
import { EventDate } from '../value-objects/EventDate';
import { Capacity } from '../value-objects/Capacity';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { ValidationError } from '@shared/domain/errors'; 
import { 
  EventNotInDraftError, 
  EventNotPublishedError, 
  EventCapacityExceededError,
  InvalidReservationQuantityError 
} from '../errors'; 

export type EventStatus = 
  | 'BORRADOR'
  | 'PUBLICADA' 
  | 'CANCELADA';

export class Event {
  private _domainEvents: IDomainEvent[] = [];

  constructor(
    public readonly id: string,
    private _titulo: string,
    private _descripcion: string,
    private _fecha: EventDate,  
    private _lugar: string,
    private _capacidadTotal: Capacity,
    private _precio: number, // TODO: Evolucionar a Value Object Price en el futuro
    public readonly organizadorId: string,
    private _reservasConfirmadas: number = 0,
    private _reservasPendientes: number = 0,    
    private _estado: EventStatus = 'BORRADOR',
    public readonly creadoEn: Date = new Date()
  ) {}

  // =========================================================================
  // GETTERS (Lecturas seguras hacia el exterior/mapeadores)
  // =========================================================================
  get titulo(): string { return this._titulo; }
  get descripcion(): string { return this._descripcion; }
  get fecha(): EventDate { return this._fecha; }
  get lugar(): string { return this._lugar; }
  get capacidadTotal(): Capacity { return this._capacidadTotal; }
  get precio(): number { return this._precio; }
  get reservasConfirmadas(): number { return this._reservasConfirmadas; }
  get reservasPendientes(): number { return this._reservasPendientes; }
  get estado(): EventStatus { return this._estado; }

  // =========================================================================
  // GESTIÓN DE EVENTOS DE DOMINIO
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
  // NÚCLEO DDD: INVARIANTES Y ACCIONES EXPLICITAS
  // =========================================================================

  public publicar(): void {
    if (this._estado !== 'BORRADOR') {
      throw new EventNotInDraftError(this.id);
    }
    this._estado = 'PUBLICADA';
    this.recordEvent(DomainEventNames.EVENT.STATUS_UPDATED, { eventId: this.id, organizerId: this.organizadorId });
  }

  public cancelar(): void {
    if (this._estado === 'CANCELADA') return;
    this._estado = 'CANCELADA';
    this.recordEvent(DomainEventNames.EVENT.CANCELLED, { eventId: this.id, organizerId: this.organizadorId });
  }

  public estaLleno(): boolean {
    return this._reservasConfirmadas >= this._capacidadTotal.value;
  }

  get cuposDisponibles(): number {
    return this._capacidadTotal.value - this._reservasConfirmadas - this._reservasPendientes;
  }

  public puedeReservar(cantidad: number): boolean {
    return this.cuposDisponibles >= cantidad && this._estado === 'PUBLICADA';
  }

  /**
   * Provisiona asientos tentativos en el evento. Defiende sus invariantes agresivamente.
   */
  public reservar(cantidad: number): void {
    // 1. Regla técnica/formativa del caso de uso
    if (cantidad > 4) {
      throw new InvalidReservationQuantityError(cantidad);
    }

    // 2. Desglosamos las invariantes de negocio para saber EXACTAMENTE qué falló
    if (this._estado !== 'PUBLICADA') {
      throw new EventNotPublishedError(this.id);
    }

    if (this.cuposDisponibles < cantidad) {
      throw new EventCapacityExceededError(this.id);
    }
    
    this._reservasPendientes += cantidad;

    this.recordEvent(DomainEventNames.EVENT.SEATS_PROVISIONED, {
      eventId: this.id,
      organizerId: this.organizadorId,
      cantidad
    });
  }

  /**
   * Confirma la reserva convirtiendo cupos pendientes en confirmados definitivos.
   */
  public confirmarReserva(cantidad: number): void {
    if (this._reservasPendientes < cantidad) {
      throw new ValidationError('No puedes confirmar más reservas de las que están pendientes');
    }
    this._reservasPendientes -= cantidad;
    this._reservasConfirmadas += cantidad;

    this.recordEvent(DomainEventNames.EVENT.RESERVATION_CONFIRMED, { 
      eventId: this.id,
      organizerId: this.organizadorId,
      cantidad
    });
  }  
}