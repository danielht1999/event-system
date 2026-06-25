// src/modules/reservation/infrastructure/subscribers/SendTicketEmailOnReservationConfirmed.ts

import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { ReservationConfirmedPayload } from '@shared/domain/DomainEventPayloads';
import { IEmailService } from '@shared/domain/services/IEmailService';
import { logger } from '@shared/infrastructure/logging/winston';
import { PostgresReservationQueryService } from '../queries/PostgresReservationQueryService';
import { TicketEmailDTO } from '@modules/reservation/application/services/IReservationQueryService';

export class SendTicketEmailOnReservationConfirmed {
  constructor(
    private readonly emailService: IEmailService,
    private readonly reservationQueryService: PostgresReservationQueryService
  ) {}

  public listen(): void {
    logger.info(`[Subscriber] Escuchando activamente: ${DomainEventNames.RESERVATION.CONFIRMED}`);
    domainEventBus.listen(
      DomainEventNames.RESERVATION.CONFIRMED,
      async (event: IDomainEvent<ReservationConfirmedPayload>) => {
        await this.handle(event);
      }
    );
  }

  private async handle(event: IDomainEvent<ReservationConfirmedPayload>): Promise<void> {
    const { reservationId } = event.data;

    logger.info(`[Subscriber] Evento recibido. Extrayendo manifiesto para Reserva: ${reservationId}`);

    try {
      const ticketData: TicketEmailDTO | null = await this.reservationQueryService.findTicketEmailData(reservationId);
      
      if (!ticketData) {
        logger.error(`[Subscriber] Abortando envío: No se encontraron datos para la reserva ${reservationId}`);
        return;
      }
      if (!ticketData.to || !ticketData.clientName || !ticketData.eventName) {
        logger.error(`[Subscriber] Datos incompletos para la reserva ${reservationId}`, { ticketData });
        return;
      }

      // Formateamos la fecha
      const formattedDate = ticketData.eventDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).toUpperCase();

      // Despachamos al servicio de mensajeria
      await this.emailService.sendTicketEmail({
        to: ticketData.to,
        clientName: ticketData.clientName.toUpperCase(),
        eventName: ticketData.eventName.toUpperCase(),
        eventDate: formattedDate,
        eventLocation: ticketData.eventLocation.toUpperCase(),
        ticketQuantity: ticketData.ticketQuantity,
        totalAmount: ticketData.totalAmount,
        paymentDate: new Date(event.occurredOn).toLocaleString('es-ES'),
        ticketCode: ticketData.ticketCode
      });

      logger.info(`[Subscriber] Ticket asíncrono enviado con éxito para la reserva ${reservationId}`);

    } catch (error) {
      logger.error(`[Subscriber] Error crítico al procesar el ticket de la reserva ${reservationId}`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}