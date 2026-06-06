// src/modules/reservation/domain/repositories/IReservationRepository.ts
import { Reservation } from '../entities/Reservation';

export interface IReservationRepository {
  /**
   * Sincroniza el estado de la reserva (Upsert). 
   * Devuelve la entidad actualizada y procesa de forma obligatoria los Eventos de Dominio.
   */
  save(reservation: Reservation): Promise<Reservation>; 

  findById(id: string): Promise<Reservation | null>;

  /**
   * Bloquea el registro de la reservación. Evita colisiones entre el usuario pagando
   * y el Worker de expiración corriendo en paralelo.
   */
  findByIdForUpdate(id: string): Promise<Reservation | null>; 

  findByEvent(eventId: string): Promise<Reservation[]>;
  findByUser(userId: string): Promise<Reservation[]>;
  findByTicketCode(code: string): Promise<Reservation | null>;

  delete(id: string): Promise<void>;

  /**
   * Caso de uso especializado para el Worker. 
   * Cambia masivamente a 'EXPIRADA' las reservas que superaron el tiempo límite de pago.
   */
  expireObsoleteReservations(): Promise<number>;
}