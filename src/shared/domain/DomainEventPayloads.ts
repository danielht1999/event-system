// src/shared/domain/DomainEventPayloads.ts

import { DomainEventNames } from './DomainEventNames';

// ============================================================
// AUTH PAYLOADS
// ============================================================
export interface UserCreatedPayload {
  userId: string;
  email: string;
  nombre: string;
  rol: string;
}

export interface UserRoleChangedPayload {
  userId: string;
  rolAnterior: string;
  nuevoRol: string;
}

export interface UserProfileUpdatedPayload {
  userId: string;
  nombre: string;
  email: string;
}

// ============================================================
// RESERVATION PAYLOADS
// ============================================================
export interface ReservationCreatedPayload {
  reservationId: string;
  eventId: string;
  ticketTypeId: string;
  usuarioId: string;
  cantidadTickets: number;
  codigoTicket: string;
}

export interface ReservationConfirmedPayload {
  reservationId: string;
  eventId: string;
  ticketTypeId: string;
  usuarioId: string;
  cantidadTickets: number;
}

export interface ReservationCancelledPayload {
  reservationId: string;
  eventId: string;
  ticketTypeId: string;
  usuarioId: string;
  cantidadTickets: number;
  debeLiberarCupos: boolean;
}

export interface ReservationCheckedInPayload {
  reservationId: string;
  eventId: string;
  ticketTypeId: string;
  usuarioId: string;
}

export interface ReservationExpiredPayload {
  reservationId: string;
  eventId: string;
  ticketTypeId: string;
  usuarioId: string;
  cantidadTickets: number;
}

// ============================================================
// EVENT PAYLOADS
// ============================================================
export interface EventCreatedPayload {
  eventId: string;
  organizerId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  capacidadTotal: number;
  estado: string;
}

export interface EventUpdatedPayload {
  eventId: string;
  organizerId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  capacidadTotal: number;
  estado: string;
}

export interface EventStatusUpdatedPayload {
  eventId: string;
  organizerId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  capacidadTotal: number;
  estado: string;
}

export interface EventCancelledPayload {
  eventId: string;
  organizerId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  capacidadTotal: number;
  estado: string;
}

export interface EventFinishedPayload {
  eventId: string;
  organizerId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  capacidadTotal: number;
  estado: string;
}

// ============================================================
// TICKET TYPE PAYLOADS
// ============================================================
export interface TicketTypeCreatedPayload {
  ticketTypeId: string;
  eventId: string;
  nombre: string;
  precio: number;
  capacidadMaxima: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  estado: string;
}

export interface TicketTypeUpdatedPayload {
  ticketTypeId: string;
  eventId: string;
  nombre: string;
  precio: number;
  capacidadMaxima: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  estado: string;
}

export interface TicketTypeSoldOutPayload {
  ticketTypeId: string;
  eventId: string;
  nombre: string;
  precio: number;
  capacidadMaxima: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  estado: string;
}

export interface TicketTypeReservationConfirmedPayload {
  ticketTypeId: string;
  eventId: string;
  nombre: string;
  precio: number;
  capacidadMaxima: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  estado: string;
}

// ============================================================
// PAYMENT PAYLOADS
// ============================================================
export interface PaymentApprovedPayload {
  paymentId: string;
  reservationId: string;
  usuarioId: string;
  monto: number;
  moneda: string;
}

export interface PaymentRefundedPayload {
  paymentId: string;
  reservationId: string;
  usuarioId: string;
  monto: number;
  moneda: string;
}

// ============================================================
// DOMAIN EVENT PAYLOAD MAP
// ============================================================
export type DomainEventPayloadMap = {
  // Auth
  [DomainEventNames.AUTH.USER_CREATED]: UserCreatedPayload;
  [DomainEventNames.AUTH.USER_ROLE_CHANGED]: UserRoleChangedPayload;
  [DomainEventNames.AUTH.USER_PROFILE_UPDATED]: UserProfileUpdatedPayload;

  // Reservation
  [DomainEventNames.RESERVATION.CREATED]: ReservationCreatedPayload;
  [DomainEventNames.RESERVATION.CONFIRMED]: ReservationConfirmedPayload;
  [DomainEventNames.RESERVATION.CANCELLED]: ReservationCancelledPayload;
  [DomainEventNames.RESERVATION.CHECKED_IN]: ReservationCheckedInPayload;
  [DomainEventNames.RESERVATION.EXPIRED]: ReservationExpiredPayload;

  // Event
  [DomainEventNames.EVENT.CREATED]: EventCreatedPayload;
  [DomainEventNames.EVENT.UPDATED]: EventUpdatedPayload;
  [DomainEventNames.EVENT.STATUS_UPDATED]: EventStatusUpdatedPayload;
  [DomainEventNames.EVENT.CANCELLED]: EventCancelledPayload;
  [DomainEventNames.EVENT.FINISHED]: EventFinishedPayload;

  // Ticket Type
  [DomainEventNames.TICKET_TYPE.CREATED]: TicketTypeCreatedPayload;
  [DomainEventNames.TICKET_TYPE.UPDATED]: TicketTypeUpdatedPayload;
  [DomainEventNames.TICKET_TYPE.SOLD_OUT]: TicketTypeSoldOutPayload;
  [DomainEventNames.TICKET_TYPE.RESERVATION_CONFIRMED]: TicketTypeReservationConfirmedPayload;

  // Payment
  [DomainEventNames.PAYMENT.APPROVED]: PaymentApprovedPayload;
  [DomainEventNames.PAYMENT.REFUNDED]: PaymentRefundedPayload;
};