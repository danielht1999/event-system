export const DomainEventNames = {
  // =========================================================================
  // Módulo de Autenticación / Usuarios
  // =========================================================================
  AUTH: {
    USER_REGISTERED: 'auth.user_registered',
    USER_ROLE_CHANGED: 'auth.user_role_changed',
    USER_PROFILE_UPDATED: 'auth.user_profile_updated',
  },

  // =========================================================================
  // Módulo de Reservas
  // =========================================================================
  RESERVATION: {
    CREATED: 'reservation.created',
    CONFIRMED: 'reservation.confirmed',
    CANCELLED: 'reservation.cancelled',
    EXPIRED: 'reservation.expired',
    CHECKED_IN: 'reservation.checked_in',
  },

  // =========================================================================
  // Módulo de Eventos
  // =========================================================================
  EVENT: {
    CREATED: 'event.created',
    STATUS_UPDATED: 'event.status_updated',
    CANCELLED: 'event.cancelled'
  },

  // =========================================================================
  // Tipos de Ticket
  // =========================================================================
  TICKET_TYPE: {
    CREATED: 'ticket_type.created',
    SOLD_OUT: 'ticket_type.sold_out'
  },

  // =========================================================================
  // Pagos
  // =========================================================================
  PAYMENT: {
    APPROVED: 'payment.approved',
    REFUNDED: 'payment.refunded'
  }
} as const;

// =========================================================================
// Union Type de todos los eventos válidos del sistema
// =========================================================================

export type DomainEventName =
  | typeof DomainEventNames.AUTH[keyof typeof DomainEventNames.AUTH]
  | typeof DomainEventNames.RESERVATION[keyof typeof DomainEventNames.RESERVATION]
  | typeof DomainEventNames.EVENT[keyof typeof DomainEventNames.EVENT]
  | typeof DomainEventNames.TICKET_TYPE[keyof typeof DomainEventNames.TICKET_TYPE]
  | typeof DomainEventNames.PAYMENT[keyof typeof DomainEventNames.PAYMENT];