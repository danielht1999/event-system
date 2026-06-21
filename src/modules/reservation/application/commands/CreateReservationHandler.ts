// src/modules/reservation/application/commands/CreateReservationHandler.ts
import { v4 as uuidv4 } from 'uuid';
import { CreateReservationCommand } from './CreateReservationCommand';
import { Reservation } from '../../domain/entities/Reservation';
import { Payment } from '../../../payment/domain/entities/Payment';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ITicketTypeRepository } from '../../../event/domain/repositories/ITicketTypeRepository';
import { IPaymentRepository } from '../../../payment/domain/repositories/IPaymentRepository';
import { IEventRepository } from '../../../event/domain/repositories/IEventRepository'; // Importado
import { TicketTypeNotFoundError, EventNotFoundError } from '../../../event/domain/errors'; // Importado
import { reservasCreadas } from '@shared/infrastructure/monitoring/metrics';
import { logger } from '@shared/infrastructure/logging/winston';

export interface ReservationResult {
  id: string;
  codigoTicket: string;
  estado: string;
  cantidadTickets: number;
  expiraEn: string;
}

export class CreateReservationHandler {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly reservationRepository: IReservationRepository,
    private readonly eventRepository: IEventRepository, // Inyectado
    private readonly ticketTypeRepository: ITicketTypeRepository,
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(command: CreateReservationCommand): Promise<ReservationResult> {
    // 1. VALIDACIÓN PREVIA (Jerarquía de Dominio)
    // Esto asegura que el evento exista antes de iniciar cualquier transacción
    const event = await this.eventRepository.findById(command.eventoId);
    if (!event) throw new EventNotFoundError(command.eventoId);

    const id = uuidv4();
    const codigoTicket = `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    let reservation: Reservation;

    await this.uow.begin();
    try {
      const tx = this.uow.getTransactionContext();

      const startLock = performance.now();
      const ticketType = await this.ticketTypeRepository.findByIdForUpdate(command.ticketTypeId, tx);
      const lockDurationMs = performance.now() - startLock;

      if (lockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO TICKET_TYPE (CREACIÓN)', { ticketTypeId: command.ticketTypeId, durationMs: lockDurationMs.toFixed(2) });
      } else if (lockDurationMs > 100) {
        logger.warn('LOCK LENTO TICKET_TYPE (CREACIÓN)', { ticketTypeId: command.ticketTypeId, durationMs: lockDurationMs.toFixed(2) });
      }

      // Validación de integridad: el ticket debe existir y pertenecer al evento del comando
      if (!ticketType || ticketType.eventId !== command.eventoId) {
        throw new TicketTypeNotFoundError(command.ticketTypeId);
      }

      reservation = Reservation.create({
        id,
        eventId: command.eventoId,
        ticketTypeId: command.ticketTypeId,
        usuarioId: command.usuarioId,
        cantidadTickets: command.cantidadTickets,
        codigoTicket
      });

      ticketType.reservar(reservation.cantidadTickets);

      await this.ticketTypeRepository.save(ticketType, tx);
      await this.reservationRepository.save(reservation, tx);

      const montoTotal = ticketType.precio * reservation.cantidadTickets;
      const payment = Payment.create({
        id: uuidv4(),
        reservationId: reservation.id,
        usuarioId: reservation.usuarioId,
        monto: montoTotal,
        moneda: 'USD'
      });
      await this.paymentRepository.save(payment, tx);

      const events = [
        ...reservation.pullDomainEvents(),
        ...ticketType.pullDomainEvents(),
        ...payment.pullDomainEvents()
      ];
      this.uow.collectEvents(events);

      await this.uow.commit();
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }

    reservasCreadas.inc();
    
    return {
      id: reservation.id,
      codigoTicket: reservation.codigoTicket,
      estado: reservation.estado,
      cantidadTickets: reservation.cantidadTickets,
      expiraEn: '15 minutes'
    };
  }
}