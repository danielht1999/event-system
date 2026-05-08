// src/domain/repositories/IEventoRepository.ts
import { Evento } from '../entities/Evento';

export interface IEventoRepository {
  save(evento: Evento): Promise<void>;
  findById(id: string): Promise<Evento | null>;
  findAll(): Promise<Evento[]>;
  findByOrganizador(organizadorId: string): Promise<Evento[]>;
  findPublicados(): Promise<Evento[]>;
  delete(id: string): Promise<void>;
  update(evento: Evento): Promise<void>;
}