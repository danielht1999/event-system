// src/modules/reservation/application/commands/CreateReservationHandler.ts

import { v4 as uuidv4 } from 'uuid';
import { CreateReservationCommand } from './CreateReservationCommand';
import { Reservation } from '../../domain/entities/Reservation';
import { Payment } from '../../../payment/domain/entities/Payment';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ITicketTypeRepository } from '../../../event/domain/repositories/ITicketTypeRepository';
import { IPaymentRepository } from '../../../payment/domain/repositories/IPaymentRepository';
import { TicketTypeNotFoundError } from '../../../event/domain/errors';
import { reservasCreadas } from '@shared/infrastructure/monitoring/metrics';
import { logger } from '@shared/infrastructure/logging/winston';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import {
  ReservationCreatedPayload,
  TicketTypeReservationConfirmedPayload,
  PaymentApprovedPayload,
  PaymentRefundedPayload
} from '@shared/domain/DomainEventPayloads';

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
    private readonly ticketTypeRepository: ITicketTypeRepository,
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(command: CreateReservationCommand): Promise<ReservationResult> {
    const id = uuidv4();
    const codigoTicket = `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    let reservation: Reservation;

    await this.uow.begin();
    try {
      const tx = this.uow.getTransactionContext();

      const startLock = performance.now();
      const ticketType = await this.ticketTypeRepository.findByIdForUpdate(
        command.ticketTypeId, 
        tx
      );
      const lockDurationMs = performance.now() - startLock;

      if (lockDurationMs > 1000) {
        logger.error('LOCK CRÍTICO TICKET_TYPE (CREACIÓN)', { 
          ticketTypeId: command.ticketTypeId, 
          durationMs: lockDurationMs.toFixed(2) 
        });
      } else if (lockDurationMs > 100) {
        logger.warn('LOCK LENTO TICKET_TYPE (CREACIÓN)', { 
          ticketTypeId: command.ticketTypeId, 
          durationMs: lockDurationMs.toFixed(2) 
        });
      }

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

      // ✅ RECOLECTAR Y TIPAR EVENTOS
      const rawEvents = [
        ...reservation.pullDomainEvents(),
        ...ticketType.pullDomainEvents(),
        ...payment.pullDomainEvents()
      ];

      const typedEvents = rawEvents.map(e => {
        if (e.eventName === DomainEventNames.RESERVATION.CREATED) {
          return { ...e, data: e.data as ReservationCreatedPayload };
        }
        if (e.eventName === DomainEventNames.TICKET_TYPE.RESERVATION_CONFIRMED) {
          return { ...e, data: e.data as TicketTypeReservationConfirmedPayload };
        }
        if (e.eventName === DomainEventNames.PAYMENT.APPROVED) {
          return { ...e, data: e.data as PaymentApprovedPayload };
        }
        if (e.eventName === DomainEventNames.PAYMENT.REFUNDED) {
          return { ...e, data: e.data as PaymentRefundedPayload };
        }
        return e;
      });

      this.uow.collectEvents(typedEvents);
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