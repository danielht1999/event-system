import { CrearReservaCommand } from '../commands/CrearReservaCommand';
import { IEventoRepository } from '../../domain/repositories/IEventoRepository';
import { Reserva } from '../../domain/entities/Reserva';
import { v4 as uuidv4 } from 'uuid';
import {  ReservaTransaccionService } from '../../infrastructure/services/ReservaTransaccionService';

export interface ReservaResult {
  id: string;
  codigoTicket: string;
  estado: string;
  cantidadTickets: number;
  expiraEn: string;
}

export class CrearReservaHandler {
  constructor(
  private reservaTransaccionService: ReservaTransaccionService
) {}

  async execute(command: CrearReservaCommand): Promise<ReservaResult> {
  const id = uuidv4();
  const codigoTicket = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const reserva = new Reserva(
    id,
    command.eventoId,
    command.usuarioId,
    command.cantidadTickets,
    'PENDIENTE_PAGO',
    codigoTicket
  );

  await this.reservaTransaccionService.crearReserva(reserva);

  return {
    id: reserva.id,
    codigoTicket: reserva.codigoTicket,
    estado: reserva.estado,
    cantidadTickets: reserva.cantidadTickets,
    expiraEn: '15 minutos'
  };
} 
}