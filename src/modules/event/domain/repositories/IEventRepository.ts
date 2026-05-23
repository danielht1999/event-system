// src/modules/event/domain/repositories/IEventRepository.ts
import { Event } from '../entities/Event';

export interface IEventRepository {
  save(event: Event): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findByIdForUpdate(id: string): Promise<Event | null>;
  findAll(): Promise<Event[]>;
  findByOrganizerId(organizerId: string): Promise<Event[]>;
  update(id: string, event: Partial<Event>): Promise<Event | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}