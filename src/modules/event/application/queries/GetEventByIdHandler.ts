// src/modules/event/application/queries/GetEventByIdHandler.ts

import { EventoDetalleDTO, IEventQueryService } from '../services/IEventQueryService';
import { EventNotFoundError } from '../../domain/errors';

export class GetEventByIdHandler {
  constructor(
    private readonly eventQueryService: IEventQueryService  // ← Cambio: usar QueryService
  ) {}

  async execute(eventId: string): Promise<EventoDetalleDTO> {  // ← Cambio: devolver DTO
    const evento = await this.eventQueryService.findById(eventId);
    if (!evento) throw new EventNotFoundError(eventId);

    return evento;  // ← El QueryService ya devuelve el DTO completo con tickets
  }
}