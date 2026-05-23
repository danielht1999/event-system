// src/modules/reservation/application/commands/CreateReservationHandler.ts
import { CreateReservationCommand } from './CreateReservationCommand';
import { Reservation } from '../../domain/entities/Reservation';
import { v4 as uuidv4 } from 'uuid';
import { ReservationTransactionService } from '../../infrastructure/services/ReservationTransactionService';

export interface ReservationResult {
  id: string;
  codigoTicket: string;
  estado: string;
  cantidadTickets: number;
  expiraEn: string;
}

export class CreateReservationHandler {
  constructor(
    private reservationTransactionService: ReservationTransactionService
  ) {}

  async execute(command: CreateReservationCommand): Promise<ReservationResult> {
    const id = uuidv4();
    const codigoTicket = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const reservation = new Reservation(
      id,
      command.eventoId,
      command.usuarioId,
      command.cantidadTickets,
      'PENDIENTE_PAGO',
      codigoTicket
    );

    await this.reservationTransactionService.createReservation(reservation);

    return {
      id: reservation.id,
      codigoTicket: reservation.codigoTicket,
      estado: reservation.estado,
      cantidadTickets: reservation.cantidadTickets,
      expiraEn: '15 minutos'
    };
  }
}