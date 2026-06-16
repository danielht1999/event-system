// src/modules/event/domain/entities/Event.ts

import { EventDate } from '../value-objects/EventDate';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames';

import {
  EventNotInDraftError
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
    public readonly organizadorId: string,
    private _estado: EventStatus = 'BORRADOR',
    public readonly creadoEn: Date = new Date()
  ) {}

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

  // =========================================================================
  // DOMAIN EVENTS
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
  // BUSINESS RULES
  // =========================================================================

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
}