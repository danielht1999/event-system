// src/modules/reservation/application/commands/CreateReservationHandler.ts
import { CreateReservationCommand } from './CreateReservationCommand';
import { Reservation } from '../../domain/entities/Reservation';
import { v4 as uuidv4 } from 'uuid';
import { ReservationTransactionService } from '../../infrastructure/services/ReservationTransactionService';
import { reservasCreadas } from '@shared/infrastructure/monitoring/metrics';

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
    const codigoTicket = `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    //Usamos la factoría limpia del dominio. Cero strings hardcodeados aquí.
    const reservation = Reservation.create({
      id,
      eventoId: command.eventoId,
      usuarioId: command.usuarioId,
      cantidadTickets: command.cantidadTickets,
      codigoTicket
    });

    await this.reservationTransactionService.createReservation(reservation);
    reservasCreadas.inc();

    return {
      id: reservation.id,
      codigoTicket: reservation.codigoTicket,
      estado: reservation.estado, // Lee de forma segura el getter
      cantidadTickets: reservation.cantidadTickets,
      expiraEn: '15 minutos'
    };
  }
}