import pool from '../../../src/shared/infrastructure/database/connection';

import { CancelReservationHandler } from '../../../src/modules/reservation/application/commands/CancelReservationHandler';
import { CancelReservationCommand } from '../../../src/modules/reservation/application/commands/CancelReservationCommand';
import { ConfirmPaymentHandler } from '../../../src/modules/reservation/application/commands/ConfirmPaymentHandler';
import { ConfirmPaymentCommand } from '../../../src/modules/reservation/application/commands/ConfirmPaymentCommand';

// Dependencias necesarias tras refactorización
import { PostgresUnitOfWork } from '../../../src/shared/infrastructure/database/PostgresUnitOfWork';
import { PostgresReservationRepository } from '../../../src/modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { PostgresTicketTypeRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository';
import { IDomainEventDispatcher } from '../../../src/shared/domain/IDomainEventDispatcher';

import { ReservationNotFoundError, ReservationOwnershipError } from '../../../src/modules/reservation/domain/errors';

class MockDomainEventDispatcher implements IDomainEventDispatcher {
  async dispatch(): Promise<void> { return Promise.resolve(); }
}

describe('CancelReservationHandler (Integration Test)', () => {
  let cancelHandler: CancelReservationHandler;
  let confirmHandler: ConfirmPaymentHandler;

  let reservationId: string;
  let userId: string;
  let otherUserId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeEach(async () => {
    // 1. Crear usuarios
    const userResult = await pool.query(`INSERT INTO usuarios(id,nombre,email,password_hash,rol) VALUES(gen_random_uuid(),'User','user@test.com','hash','ASISTENTE') RETURNING id`);
    userId = userResult.rows[0].id;

    const otherResult = await pool.query(`INSERT INTO usuarios(id,nombre,email,password_hash,rol) VALUES(gen_random_uuid(),'Other','other@test.com','hash','ASISTENTE') RETURNING id`);
    otherUserId = otherResult.rows[0].id;

    // 2. Crear Evento
    const eventResult = await pool.query(`
      INSERT INTO eventos(id, titulo, descripcion, fecha, lugar, organizador_id, estado)
      VALUES(gen_random_uuid(), 'Evento', 'Desc', NOW() + INTERVAL '1 day', 'Oaxaca', '${userId}', 'PUBLICADA')
      RETURNING id
    `);
    eventId = eventResult.rows[0].id;

    // 3. Crear TicketType
    const ttResult = await pool.query(`
      INSERT INTO ticket_types(id, evento_id, nombre, precio, capacidad_maxima, reservas_pendientes, estado)
      VALUES(gen_random_uuid(), '${eventId}', 'General', 100, 100, 2, 'ACTIVO')
      RETURNING id
    `);
    ticketTypeId = ttResult.rows[0].id;

    // 4. Crear Reserva
    const reservationResult = await pool.query(`
      INSERT INTO reservas(id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket)
      VALUES(gen_random_uuid(), '${eventId}', '${ticketTypeId}', '${userId}', 2, 'PENDIENTE_PAGO', 'TEST-TICKET')
      RETURNING id
    `);
    reservationId = reservationResult.rows[0].id;

    // Inyección de dependencias
    const uow = new PostgresUnitOfWork(pool, new MockDomainEventDispatcher());
    const resRepo = new PostgresReservationRepository();
    const ttRepo = new PostgresTicketTypeRepository();

    cancelHandler = new CancelReservationHandler(uow, resRepo, ttRepo);
    confirmHandler = new ConfirmPaymentHandler(uow, resRepo, ttRepo);
  });

  test('debe cancelar una reserva pendiente', async () => {
    const result = await cancelHandler.execute(new CancelReservationCommand({ reservationId, usuarioId: userId }));
    expect(result.estado).toBe('CANCELADA');

    const reservationDb = await pool.query('SELECT estado FROM reservas WHERE id = $1', [reservationId]);
    expect(reservationDb.rows[0].estado).toBe('CANCELADA');

    // Verificar que los contadores de reservas se actualizaron correctamente
    const ttDb = await pool.query('SELECT reservas_pendientes FROM ticket_types WHERE id = $1', [ticketTypeId]);
    expect(ttDb.rows[0].reservas_pendientes).toBe(0);
  });

  test('debe lanzar ReservationNotFoundError', async () => {
    await expect(cancelHandler.execute(new CancelReservationCommand({ 
        reservationId: '11111111-1111-1111-1111-111111111111', usuarioId: userId 
    }))).rejects.toThrow(ReservationNotFoundError);
  });

  test('debe lanzar ReservationOwnershipError', async () => {
    await expect(cancelHandler.execute(new CancelReservationCommand({ 
        reservationId, usuarioId: otherUserId 
    }))).rejects.toThrow(ReservationOwnershipError);
  });

  test('debe fallar al cancelar una reserva ya cancelada', async () => {
    await cancelHandler.execute(new CancelReservationCommand({ reservationId, usuarioId: userId }));
    await expect(cancelHandler.execute(new CancelReservationCommand({ reservationId, usuarioId: userId }))).rejects.toThrow();

    const reservaDb = await pool.query('SELECT estado FROM reservas WHERE id = $1', [reservationId]);
    expect(reservaDb.rows[0].estado).toBe('CANCELADA');
  });

  test('debe actualizar reservas y cupos del evento', async () => {
    await cancelHandler.execute(new CancelReservationCommand({ reservationId, usuarioId: userId }));
    const ttDb = await pool.query('SELECT reservas_pendientes FROM ticket_types WHERE id = $1', [ticketTypeId]);
    expect(ttDb.rows[0].reservas_pendientes).toBe(0);
  });

  test('una reserva cancelada no puede confirmarse', async () => {
    await cancelHandler.execute(new CancelReservationCommand({ reservationId, usuarioId: userId }));
    await expect(confirmHandler.execute(new ConfirmPaymentCommand({ reservationId, usuarioId: userId }))).rejects.toThrow();
  });
  
  test('DEBE permitir cancelar una reserva CONFIRMADA y liberar el cupo', async () => {
  // 1. Asegúrate de que está confirmada
  await confirmHandler.execute(new ConfirmPaymentCommand({ reservationId, usuarioId: userId }));
  
  // 2. Actúa: Cancela la reserva confirmada
  const result = await cancelHandler.execute(new CancelReservationCommand({ reservationId, usuarioId: userId }));
  
  // 3. Verifica: Estado ahora es CANCELADA
  expect(result.estado).toBe('CANCELADA');

  // 4. Verifica: El ticketType recuperó su cupo (esto es vital)
  const ttDb = await pool.query('SELECT reservas_pendientes FROM ticket_types WHERE id = $1', [ticketTypeId]);
  // Si antes de confirmar era 1, y al confirmar se restó, al cancelar debería volver a su estado original
  expect(ttDb.rows[0].reservas_pendientes).toBe(0); // Ajusta esto según tu lógica de contadores
});

  test('SOLO el dueño de la reserva puede cancelarla', async () => {
    await expect(
        cancelHandler.execute(new CancelReservationCommand({ reservationId, usuarioId: otherUserId }))
    ).rejects.toThrow(ReservationOwnershipError);
  });
});