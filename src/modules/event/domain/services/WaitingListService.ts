/**
 * ============================================================
 * WaitingListService
 * ============================================================
 *
 * Este Domain Service encapsula toda la lógica relacionada
 * con listas de espera y asignación de cupos liberados.
 *
 * ¿Por qué existe este servicio?
 *
 * Porque la política de waiting list NO pertenece
 * naturalmente a una sola entidad.
 *
 * Involucra coordinación entre:
 *
 * - Event
 * - Reservation
 * - TicketStock
 * - usuarios en espera
 * - expiraciones/cancelaciones
 *
 * La intención es centralizar la lógica de cola/prioridad
 * en un único punto del dominio.
 *
 * Posibles responsabilidades futuras:
 *
 * - Agregar usuarios a waiting list.
 * - Priorizar usuarios.
 * - Promover automáticamente usuarios.
 * - Gestionar cupos liberados.
 * - Expirar entradas de waiting list.
 * - Aplicar reglas FIFO/prioridad.
 * - Coordinar reintentos automáticos.
 *
 * Posibles conexiones futuras:
 *
 * - ReservationExpired event
 * - ReservationCancelled event
 * - TicketStockService
 * - workers asíncronos
 * - DomainEventBus
 * - sistemas de notificación/email
 *
 * IMPORTANTE:
 *
 * Este servicio representa una POLÍTICA DE NEGOCIO.
 *
 * NO convertirlo en:
 *
 * - helper genérico
 * - utility
 * - wrapper técnico
 *
 * Su propósito es mantener las reglas de waiting list
 * desacopladas y expresivas.
 *
 * ============================================================
 */