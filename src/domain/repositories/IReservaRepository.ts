// src/domain/repositories/IReservaRepository.ts
import { Reserva } from '../entities/Reserva';

export interface IReservaRepository {
  save(reserva: Reserva): Promise<void>;
  findById(id: string): Promise<Reserva | null>;
  findByEvento(eventoId: string): Promise<Reserva[]>;
  findByUsuario(usuarioId: string): Promise<Reserva[]>;
  findByCodigoTicket(codigo: string): Promise<Reserva | null>;
  update(reserva: Reserva): Promise<void>;
  delete(id: string): Promise<void>;
}
