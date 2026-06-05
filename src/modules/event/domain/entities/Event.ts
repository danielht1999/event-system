// src/modules/event/domain/entities/Event.ts
import { EventDate } from '../value-objects/EventDate';
import { Capacity } from '../value-objects/Capacity';

export type EventStatus = 
  | 'BORRADOR'
  | 'PUBLICADA' 
  | 'CANCELADA';

export interface IDomainEvent {
  eventName: string;
  occurredOn: Date;
  data: any;
}

export class Event {
  // 1. La bolsa de eventos que leerá el repositorio
  private _domainEvents: IDomainEvent[] = [];

  constructor(
    public readonly id: string,
    public titulo: string,
    public descripcion: string,
    public fecha: EventDate,  
    public lugar: string,
    public capacidadTotal: Capacity,
    public precio: number,
    public organizadorId: string,
    public reservasConfirmadas: number,
    public reservasPendientes: number,    
    public estado: EventStatus = 'BORRADOR',
    public creadoEn: Date = new Date()
  ) {}

  // 2. Método para empujar eventos a la bolsa
  public recordEvent(name: string, data: any): void {
    this._domainEvents.push({
      eventName: name,
      occurredOn: new Date(),
      data
    });
  }

  pullDomainEvents(): IDomainEvent[] {
  const events = [...this._domainEvents];
  this._domainEvents = [];
  return events;
}

  // =========================================================================
  // NÚCLEO DDD: ACCIONES EXPLICITAS DE NEGOCIO
  // =========================================================================

  publicar(): void {
    // Validar estado anterior
    if (this.estado !== 'BORRADOR') {
        throw new Error('Solo se pueden publicar eventos en estado BORRADOR');
    }
    
    this.estado = 'PUBLICADA';
    
    // Registramos el hecho histórico
    this.recordEvent('EventStatusUpdated', {
        eventId: this.id,
        organizerId: this.organizadorId
    });
  }

  cancelar(): void {
    if (this.estado === 'CANCELADA') return;
    
    this.estado = 'CANCELADA';
    
    // Registramos el hecho histórico
    this.recordEvent('EventCancelled', {
      eventId: this.id,
      organizerId: this.organizadorId
    });
  }

  estaLleno(): boolean {
    return this.reservasConfirmadas >= this.capacidadTotal.value;
  }

  get cuposDisponibles(): number {
    return this.capacidadTotal.value - this.reservasConfirmadas - this.reservasPendientes;
  }

  reservar(cantidad: number): { exitosa: boolean, razon?: string }{
    if(cantidad > 4) {
      return { exitosa: false, razon: 'Máximo 4 tickets por persona' }
    }
    if(this.cuposDisponibles < cantidad) {
      return { exitosa: false, razon: 'No hay suficiente capacidad' }
    }
    this.reservasPendientes += cantidad;

    // Modificó cupos, registramos
    this.recordEvent('EventSeatsProvisioned', {
      eventId: this.id,
      organizerId: this.organizadorId
    });

    return { exitosa: true };
  }

  confirmarReserva(cantidad: number){
    this.reservasPendientes -= cantidad;
    this.reservasConfirmadas += cantidad;

    // Modificó estado de reservas, registramos
    this.recordEvent('EventStatusUpdated', {
      eventId: this.id,
      organizerId: this.organizadorId
    });
  }  

  puedeReservar(cantidad: number): boolean {
    return this.reservasConfirmadas + cantidad <= this.capacidadTotal.value;
  }
}