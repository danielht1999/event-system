// src/shared/domain/DomainEventPayloads.ts
import { DomainEventNames } from './DomainEventNames';

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

export interface ReservationConfirmedPayload {
  reservationId: string;
  eventoId: string;
  cantidadTickets: number;
}

export interface ReservationCancelledPayload {
  reservationId: string;
  eventoId: string;
  cantidadTickets: number;
  debeLiberarCupos: boolean;
}

export interface ReservationCheckedInPayload {
  reservationId: string;
  eventoId: string;
}

export interface ReservationExpiredPayload {
  reservationId: string;
  eventoId: string;
  cantidadTickets: number;
}

export interface EventCancelledPayload {
  eventId: string;
  organizerId: string;
}

export interface EventSeatsProvisionedPayload {
  eventId: string;
  organizerId: string;
  cantidad: number;
}

export interface EventStatusUpdatedPayload {
  eventId: string;
  organizerId: string;
}

// 💡 El Mapa Maestro: Vincula el string del evento con su interfaz real
export type DomainEventPayloadMap = {
  [DomainEventNames.AUTH.USER_ROLE_CHANGED]: UserRoleChangedPayload;
  [DomainEventNames.AUTH.USER_PROFILE_UPDATED]: UserProfileUpdatedPayload;
  [DomainEventNames.RESERVATION.CONFIRMED]: ReservationConfirmedPayload;
  [DomainEventNames.RESERVATION.CANCELLED]: ReservationCancelledPayload;
  [DomainEventNames.RESERVATION.CHECKED_IN]: ReservationCheckedInPayload;
  [DomainEventNames.RESERVATION.EXPIRED]: ReservationExpiredPayload;
  [DomainEventNames.EVENT.CANCELLED]: EventCancelledPayload;
  [DomainEventNames.EVENT.SEATS_PROVISIONED]: EventSeatsProvisionedPayload;
  [DomainEventNames.EVENT.STATUS_UPDATED]: EventStatusUpdatedPayload;
};