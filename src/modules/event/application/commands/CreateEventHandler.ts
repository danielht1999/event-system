// src/modules/event/application/commands/CreateEventHandler.ts
import { CreateEventCommand } from './CreateEventCommand';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { Event } from '../../domain/entities/Event';
import { v4 as uuidv4 } from 'uuid';
import { EventDate } from '../../domain/value-objects/EventDate';
import { Capacity } from '../../domain/value-objects/Capacity';
import { cacheService } from '@shared/infrastructure/cache/cache.service';

export class CreateEventHandler {
  constructor(private eventRepository: IEventRepository) {}

  async execute(command: CreateEventCommand) {
    const event = new Event(
      uuidv4(),
      command.titulo,
      command.descripcion,
      EventDate.create(new Date(command.fecha)),
      command.lugar,
      new Capacity(command.capacidadTotal),
      command.precio,
      command.organizadorId,
      0,  // reservasConfirmadas
      0   // reservasPendientes
    );
    // 1. Guardar primero en la base de datos relacional (PostgreSQL)
    const result = await this.eventRepository.save(event);

    try {
      // 2. INVALIDACIÓN: Limpiar los datos obsoletos de Redis de forma asíncrona
      await Promise.all([
        cacheService.delete('events:all'),
        cacheService.delete(`events:organizer:${command.organizadorId}`)
      ]);
      
      console.log(`Cache purgada para el catalogo global y el organizador: ${command.organizadorId}`);
    } catch (cacheError) {
      // Aplicamos el principio Fail-Safe: si falla Redis, logueamos el error 
      // pero permitimos que la ejecución continúe con éxito porque los datos ya se guardaron en la BD.
      console.error('Error al invalidar la cache tras crear evento:', cacheError);
    }

    // 3. Retornar el resultado tal como lo hacías originalmente
    return result;
  }
}