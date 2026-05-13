// src/application/handlers/CreateEventHandler.ts
import { CreateEventCommand } from '../commands/CreateEventCommand';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { Evento } from '../../domain/entities/Evento';
import { v4 as uuidv4 } from 'uuid';
import { FechaEvento } from '../../domain/value-objects/FechaEvento';
import { Capacidad } from '../../domain/value-objects/Capacidad';

export class CreateEventHandler {
  constructor(private eventoRepository: IEventoRepository) {}

  async execute(command: CreateEventCommand) {
    const evento = new Evento(
      uuidv4(),
      command.titulo,
      command.descripcion,
      FechaEvento.crear(new Date(command.fecha)),
      command.lugar,
      new Capacidad(command.capacidadTotal),
      command.precio,
      command.organizadorId,
      0,  // reservasConfirmadas
      0   // reservasPendientes
    );

    return this.eventoRepository.save(evento);
  }
}