// src/modules/event/domain/repositories/IEventRepository.ts

import { Event } from '../entities/Event';

export interface IEventRepository {
  /**
   * Persiste el agregado Event y publica
   * los Domain Events acumulados.
   */
  save(event: Event): Promise<Event>;

  /**
   * Lectura simple.
   */
  findById(id: string): Promise<Event | null>;

  /**
   * Lectura con bloqueo pesimista.
   */
  findByIdForUpdate(id: string): Promise<Event | null>;

  findAll(): Promise<Event[]>;

  findByOrganizerId(
    organizerId: string
  ): Promise<Event[]>;

  delete(id: string): Promise<boolean>;

  exists(id: string): Promise<boolean>;
}