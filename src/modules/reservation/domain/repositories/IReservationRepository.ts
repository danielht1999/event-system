// src/modules/reservation/domain/repositories/IReservationRepository.ts
import { Reservation } from '../entities/Reservation';

export interface IReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | null>;
  findByEvent(eventId: string): Promise<Reservation[]>;
  findByUser(userId: string): Promise<Reservation[]>;
  findByTicketCode(code: string): Promise<Reservation | null>;
  update(reservation: Reservation): Promise<void>;
  delete(id: string): Promise<void>;
  expireObsoleteReservations(): Promise<number>
}