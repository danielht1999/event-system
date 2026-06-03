import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ExpireReservationsCommand } from './ExpireReservationsCommand';

export class ExpireReservationsHandler {
  constructor(private reservationRepository: IReservationRepository) {}

  async execute(command: ExpireReservationsCommand): Promise<number> {
    // Aquí es donde en el futuro podrías agregar logs de auditoría o disparar eventos de dominio
    console.log('[Handler] Executing ExpireReservationsCommand...');
    return await this.reservationRepository.expireObsoleteReservations();
  }
}