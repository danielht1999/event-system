/**
 * ============================================================
 * TicketStockService
 * ============================================================
 *
 * Este Domain Service existe para centralizar toda la lógica
 * relacionada con manejo y validación de cupos/tickets.
 *
 * ¿Por qué NO poner esta lógica directamente en Event?
 *
 * Porque las reglas de stock probablemente terminarán
 * involucrando múltiples conceptos del dominio:
 *
 * - Event
 * - Reservation
 * - expiraciones
 * - waiting lists
 * - confirmaciones de pago
 *
 * La intención es evitar:
 *
 * - lógica duplicada
 * - handlers gigantes
 * - modificaciones directas de capacity
 * - overselling
 * - reglas dispersas
 *
 * Este servicio representa POLÍTICAS DE NEGOCIO,
 * no detalles técnicos.
 *
 * Posibles responsabilidades futuras:
 *
 * - Verificar disponibilidad de tickets.
 * - Reservar stock temporalmente.
 * - Liberar stock expirado/cancelado.
 * - Validar límites máximos por usuario.
 * - Coordinar cupos concurrentes.
 * - Manejar preventa/prioridades.
 * - Integrarse con WaitingListService.
 *
 * Posibles conexiones futuras:
 *
 * - ReservationConfirmed event
 * - ReservationExpired event
 * - CancelReservationHandler
 * - WaitingListService
 * - métricas de ocupación
 *
 * IMPORTANTE:
 *
 * Si esta lógica empieza a crecer, este archivo es el lugar
 * correcto para encapsularla.
 *
 * NO mover estas reglas a controllers ni handlers.
 *
 * ============================================================
 */