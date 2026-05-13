// src/domain/repositories/IEventoRepository.ts
import { Evento } from '../entities/Evento';

export interface IEventoRepository {
  save(evento: Evento): Promise<Evento>;
  findById(id: string): Promise<Evento | null>;
  findByIdForUpdate(id: string): Promise<Evento | null>;
  findAll(): Promise<Evento[]>;
  findByOrganizadorId(organizadorId: string): Promise<Evento[]>;
  update(id: string, evento: Partial<Evento>): Promise<Evento | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>; 
}