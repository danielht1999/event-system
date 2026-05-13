// application/handlers/ListarEventosHandler.ts
import { ListarEventosCommand } from '../commands/ListarEventosCommand';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { Evento } from '../../domain/entities/Evento';

export class ListarEventosHandler {
  constructor(
    private eventoRepository: IEventoRepository
  ) {}

  async execute(command: ListarEventosCommand): Promise<Evento[]> {
    // 1. Buscar todos los eventos
    const eventos = await this.eventoRepository.findAll();
    // 2. Retornar resultado
    return eventos;
  }
}