// src/modules/event/domain/entities/Event.ts
import { EventDate } from '../value-objects/EventDate';
import { Capacity } from '../value-objects/Capacity';

export type EventStatus = 
  | 'BORRADOR'
  | 'PUBLICADA'
  | 'CANCELADA';

export class Event {
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
    return { exitosa: true };
  }

  confirmarReserva(cantidad: number){
    this.reservasPendientes -= cantidad;
    this.reservasConfirmadas+= cantidad
  }  

  puedeReservar(cantidad: number): boolean {
    return this.reservasConfirmadas + cantidad <= this.capacidadTotal.value;
  }
}