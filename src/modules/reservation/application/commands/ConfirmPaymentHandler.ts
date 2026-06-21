// src/modules/reservation/application/commands/ConfirmPaymentHandler.ts
import { ConfirmPaymentCommand } from './ConfirmPaymentCommand';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ITicketTypeRepository } from '../../../event/domain/repositories/ITicketTypeRepository';
import { ReservationNotFoundError, ReservationOwnershipError } from '../../domain/errors';
import { TicketTypeNotFoundError } from '../../../event/domain/errors';
import { logger } from '@shared/infrastructure/logging/winston';

export interface ReservationResult {
  reservationId: string;
  usuarioId: string;
  estado: string;
}

export class ConfirmPaymentHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly reservationRepository: IReservationRepository,
    private readonly ticketTypeRepository: ITicketTypeRepository
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<ReservationResult> {
    await this.uow.begin();
    try {
      const tx = this.uow.getTransactionContext();

      const startLockRes = performance.now();
      const reservation = await this.reservationRepository.findByIdForUpdate(command.reservationId, tx);
      const lockResDuration = performance.now() - startLockRes;

      if (!reservation) throw new ReservationNotFoundError(command.reservationId);
      if (reservation.usuarioId !== command.usuarioId) {
        throw new ReservationOwnershipError(command.reservationId, command.usuarioId);
      }

      const startLockTicket = performance.now();
      const ticketType = await this.ticketTypeRepository.findByIdForUpdate(reservation.ticketTypeId, tx);
      const lockTicketDuration = performance.now() - startLockTicket;

      const totalLockDurationMs = lockResDuration + lockTicketDuration;

      if (totalLockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO EN CONFIRMACIÓN DE PAGO', { 
          reservationId: command.reservationId, 
          durationMs: totalLockDurationMs.toFixed(2) 
        });
      } else if (totalLockDurationMs > 100) {
        logger.warn('LOCK LENTO EN CONFIRMACIÓN DE PAGO', { 
          reservationId: command.reservationId, 
          durationMs: totalLockDurationMs.toFixed(2) 
        });
      }

      if (!ticketType) throw new TicketTypeNotFoundError(reservation.ticketTypeId);

      reservation.confirmarPago();
      ticketType.confirmarReserva(reservation.cantidadTickets);

      await this.reservationRepository.save(reservation, tx);
      await this.ticketTypeRepository.save(ticketType, tx);

      // Recolección pasiva explícita (Mutan 2 entidades)
      const events = [
        ...reservation.pullDomainEvents(),
        ...ticketType.pullDomainEvents()
      ];
      this.uow.collectEvents(events);

      await this.uow.commit();

      return {
        reservationId: reservation.id,
        usuarioId: reservation.usuarioId,
        estado: reservation.estado
      };
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}