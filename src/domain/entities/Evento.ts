import { Capacidad } from '../value-objects/Capacidad';
import { FechaEvento } from '../value-objects/FechaEvento';

export type EstadoEvento = 'BORRADOR' | 'PUBLICADO' | 'CANCELADO' | 'FINALIZADO';

export class Evento {
  constructor(
    public readonly id: string,
    public readonly organizadorId: string,
    public titulo: string,
    public descripcion: string,
    public lugar: string,  // ← PROPERTY ADDED
    private _fecha: FechaEvento,
    private _capacidad: Capacidad,
    public precio: number,
    private _estado: EstadoEvento = 'BORRADOR',
    private _reservasConfirmadas: number = 0,
    private _reservasPendientes: number = 0,
    public creadoEn: Date = new Date()
  ) {}

  get fecha(): Date {
    return this._fecha.value;
  }

  get capacidad(): number {
    return this._capacidad.value;
  }

  get estado(): EstadoEvento {
    return this._estado;
  }

  get cuposDisponibles(): number {
    return this._capacidad.value - (this._reservasConfirmadas + this._reservasPendientes);
  }

  get estaLleno(): boolean {
    return this.cuposDisponibles <= 0;
  }

  public publicar(): void {
    if (this._estado !== 'BORRADOR') {
      throw new Error('Solo se pueden publicar eventos en estado BORRADOR');
    }
    if (this.titulo.length < 5) {
      throw new Error('El título debe tener al menos 5 caracteres');
    }
    this._estado = 'PUBLICADO';
  }

  public cancelar(): void {
    if (this._estado === 'FINALIZADO') {
      throw new Error('No se puede cancelar un evento finalizado');
    }
    if (this._estado === 'CANCELADO') {
      throw new Error('El evento ya está cancelado');
    }
    this._estado = 'CANCELADO';
  }

  public finalizar(): void {
    if (this._estado !== 'PUBLICADO') {
      throw new Error('Solo se pueden finalizar eventos publicados');
    }
    this._estado = 'FINALIZADO';
  }

  public reservar(cantidad: number = 1): { exitosa: boolean; razon?: string } {
    if (this._estado !== 'PUBLICADO') {
      return { exitosa: false, razon: 'El evento no está disponible para reservas' };
    }

    if (this._fecha.value < new Date()) {
      return { exitosa: false, razon: 'El evento ya ha pasado' };
    }

    if (cantidad > 4) {
      return { exitosa: false, razon: 'Máximo 4 tickets por persona' };
    }

    const cuposOcupados = this._reservasConfirmadas + this._reservasPendientes;
    const cuposDisponibles = this._capacidad.value - cuposOcupados;
    
    if (cuposDisponibles < cantidad) {
      return { exitosa: false, razon: 'No hay suficiente capacidad' };
    }

    this._reservasPendientes += cantidad;
    return { exitosa: true };
  }

  public confirmarReserva(cantidad: number = 1): void {
    if (this._reservasPendientes < cantidad) {
      throw new Error('No hay reservas pendientes suficientes');
    }
    this._reservasPendientes -= cantidad;
    this._reservasConfirmadas += cantidad;
  }

  public cancelarReserva(cantidad: number = 1): void {
    if (this._reservasConfirmadas < cantidad) {
      throw new Error('No hay suficientes reservas confirmadas');
    }
    this._reservasConfirmadas -= cantidad;
  }

  public liberarReservaPendiente(cantidad: number = 1): void {
    if (this._reservasPendientes < cantidad) {
      throw new Error('No hay suficientes reservas pendientes');
    }
    this._reservasPendientes -= cantidad;
  }
}
