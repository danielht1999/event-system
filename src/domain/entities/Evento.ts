import { FechaEvento } from '../value-objects/FechaEvento';
import { Capacidad } from "../value-objects/Capacidad";

// src/domain/entities/Evento.ts
export type EstadoEvento = 
  | 'BORRADOR'
  | 'PUBLICADA'
  | 'CANCELADA';

export class Evento {
  constructor(
    public readonly id: string,
    public titulo: string,
    public descripcion: string,
    public fecha: FechaEvento,  
    public lugar: string,
    public capacidadTotal: Capacidad,
    public precio: number,
    public organizadorId: string,
    public reservasConfirmadas: number,
    public reservasPendientes: number,    
    public estado: EstadoEvento = 'BORRADOR',
    public creadoEn: Date = new Date()
  ) {}

  estaLleno(): boolean {
    return this.reservasConfirmadas >= this.capacidadTotal.value;
  }

  get cuposDisponibles(): number {
    return this.capacidadTotal.value - this.reservasConfirmadas - this.reservasPendientes;
  }

  reservar(cantidad): { exitosa: boolean, razon?: string }{
    if(cantidad > 4) {
      return { exitosa: false, razon: 'Máximo 4 tickets por persona' }
    }
    if(this.cuposDisponibles < cantidad) {
      return { exitosa: false, razon: 'No hay suficiente capacidad' }
    }
    this.reservasPendientes += cantidad;
    return { exitosa: true };
  }

  confirmarReserva(cantidad){
    this.reservasPendientes -= cantidad;
    this.reservasConfirmadas+= cantidad
  }  

  puedeReservar(cantidad: number): boolean {
    return this.reservasConfirmadas + cantidad <= this.capacidadTotal.value;
  }
}