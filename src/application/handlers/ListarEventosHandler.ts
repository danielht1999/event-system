import { ListarEventosCommand } from '../commands/ListarEventosCommand';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';

interface EventoDTO {
  id: string
  titulo: string
  descripcion: string
  fecha: Date
  lugar: string
  capacidadTotal: number
  precio: number
  organizadorId: string
  reservasConfirmadas: number
  reservasPendientes: number
  cuposDisponibles: number
  estado: string
}

export class ListarEventosHandler {
  constructor(
    private eventoRepository: IEventoRepository
  ) {}

  async execute(command: ListarEventosCommand): Promise<EventoDTO[]> {
    const eventos = await this.eventoRepository.findAll();
    
    return eventos.map(evento => ({
      id: evento.id,
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha: evento.fecha.value,
      lugar: evento.lugar,
      capacidadTotal: evento.capacidadTotal.value,
      precio: evento.precio,
      organizadorId: evento.organizadorId,
      reservasConfirmadas: evento.reservasConfirmadas,
      reservasPendientes: evento.reservasPendientes,
      cuposDisponibles: evento.cuposDisponibles, // ← getter explícito
      estado: evento.estado
    }))
  }
}