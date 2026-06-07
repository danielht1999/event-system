// src/shared/domain/DomainEventNames.ts

export const DomainEventNames = {
  // Módulo de Autenticación / Usuarios
  AUTH: {
    USER_REGISTERED: 'auth.user_registered',
    USER_ROLE_CHANGED: 'auth.user_role_changed',
    USER_PROFILE_UPDATED: 'auth.user_profile_updated',
  },

  // Módulo de Reservas
  RESERVATION: {
    CREATED: 'reservation.created',
    CONFIRMED: 'reservation.confirmed',
    CANCELLED: 'reservation.cancelled',
    EXPIRED: 'reservation.expired',
    CHECKED_IN: 'reservation.checked_in',
  },

  // Módulo de Eventos (Cartelera)
  EVENT: {
    CREATED: 'event.created',
    STATUS_UPDATED: 'event.status_updated',         
    CANCELLED: 'event.cancelled',                   
    SEATS_PROVISIONED: 'event.seats_provisioned',   
    RESERVATION_CONFIRMED: 'event.reservation_confirmed'
  }
} as const; //"as const" hace que los strings sean tipos de lectura estrictos en TypeScript

// Tipo utilitario para cuando necesites tipar una variable que acepte cualquier nombre de evento válido
export type DomainEventName = 
  | typeof DomainEventNames.AUTH[keyof typeof DomainEventNames.AUTH]
  | typeof DomainEventNames.RESERVATION[keyof typeof DomainEventNames.RESERVATION]
  | typeof DomainEventNames.EVENT[keyof typeof DomainEventNames.EVENT];