// tests/integration/reservation/confirmPayment.integration.test.ts

import pool from '../../../src/shared/infrastructure/database/connection';
import { ConfirmPaymentHandler } from '../../../src/modules/reservation/application/commands/ConfirmPaymentHandler';
import { ConfirmPaymentCommand } from '../../../src/modules/reservation/application/commands/ConfirmPaymentCommand';

import { PostgresUnitOfWork } from '../../../src/shared/infrastructure/database/PostgresUnitOfWork';
import { PostgresReservationRepository } from '../../../src/modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { PostgresTicketTypeRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository';

import { IDomainEventDispatcher } from '../../../src/shared/domain/IDomainEventDispatcher';
import { IDomainEvent } from '../../../src/shared/domain/IDomainEvent';

import {
  ReservationNotFoundError,
  ReservationOwnershipError
} from '../../../src/modules/reservation/domain/errors';

// =========================================================================
// MOCK PARA TESTS
// =========================================================================
class MockDomainEventDispatcher implements IDomainEventDispatcher {
  async dispatch(events: IDomainEvent[]): Promise<void> {
    return Promise.resolve();
  }
}

describe('ConfirmPaymentHandler (Integration Test)', () => {
  let handler: ConfirmPaymentHandler;

  let reservationId: string;
  let userId: string;
  let otherUserId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeEach(async () => {
    // 1. Crear usuarios
    const userResult = await pool.query(`
      INSERT INTO usuarios(id, nombre, email, password_hash, rol)
      VALUES(gen_random_uuid(), 'User', 'user@test.com', 'hash', 'ASISTENTE')
      RETURNING id
    `);
    userId = userResult.rows[0].id;

    const otherResult = await pool.query(`
      INSERT INTO usuarios(id, nombre, email, password_hash, rol)
      VALUES(gen_random_uuid(), 'Other', 'other@test.com', 'hash', 'ASISTENTE')
      RETURNING id
    `);
    otherUserId = otherResult.rows[0].id;

    // 2. Crear Evento con capacidad_total ✅
    const eventResult = await pool.query(`
      INSERT INTO eventos(id, titulo, descripcion, fecha, lugar, organizador_id, capacidad_total, estado)
      VALUES(gen_random_uuid(), 'Evento', 'Desc', NOW() + INTERVAL '1 day', 'Oaxaca', $1, 100, 'PUBLICADA')
      RETURNING id
    `, [userId]);
    eventId = eventResult.rows[0].id;

    // 3. Crear TicketType con reservas_pendientes
    const ttResult = await pool.query(`
      INSERT INTO ticket_types(
        id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado
      )
      VALUES(
        gen_random_uuid(), $1, 'General', 100, 100, 10, 'ACTIVO'
      )
      RETURNING id
    `, [eventId]);
    ticketTypeId = ttResult.rows[0].id;

    // 4. Crear Reserva en estado PENDIENTE_PAGO
    const reservationResult = await pool.query(`
      INSERT INTO reservas(
        id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket
      )
      VALUES(
        gen_random_uuid(), $1, $2, $3, 2, 'PENDIENTE_PAGO', 'TEST-TICKET'
      )
      RETURNING id
    `, [eventId, ticketTypeId, userId]);
    reservationId = reservationResult.rows[0].id;

    // 5. Instanciar el Mock del Dispatcher
    const dispatcher = new MockDomainEventDispatcher();

    // 6. Crear UnitOfWork con pool y dispatcher
    const uow = new PostgresUnitOfWork(pool, dispatcher);

    // 7. Inyectar dependencias
    handler = new ConfirmPaymentHandler(
      uow,
      new PostgresReservationRepository(),
      new PostgresTicketTypeRepository()
    );
  });

  afterEach(async () => {
    // Limpiar datos después de cada test
    await pool.query('DELETE FROM reservas WHERE evento_id = $1', [eventId]);
    await pool.query('DELETE FROM ticket_types WHERE evento_id = $1', [eventId]);
    await pool.query('DELETE FROM eventos WHERE id = $1', [eventId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [userId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [otherUserId]);
  });

  test('debe confirmar una reserva pendiente', async () => {
    const result = await handler.execute(
      new ConfirmPaymentCommand({ reservationId, usuarioId: userId })
    );

    expect(result.estado).toBe('CONFIRMADA');

    const reservationDb = await pool.query('SELECT estado FROM reservas WHERE id = $1', [reservationId]);
    expect(reservationDb.rows[0].estado).toBe('CONFIRMADA');
  });

  test('debe hacer rollback si ocurre un error durante la transacción', async () => {
    const reservationIdCopy = reservationId;

    // Simulamos un escenario de fallo eliminando el evento de referencia
    await pool.query('DELETE FROM eventos WHERE id = $1', [eventId]);

    await expect(
      handler.execute(new ConfirmPaymentCommand({ reservationId, usuarioId: userId }))
    ).rejects.toThrow();

    // Verificamos que la reserva sigue existente y en estado PENDIENTE_PAGO
    const reservaDb = await pool.query(
      'SELECT estado FROM reservas WHERE id = $1',
      [reservationIdCopy]
    );
    
    if (reservaDb.rows.length > 0) {
      expect(reservaDb.rows[0].estado).toBe('PENDIENTE_PAGO');
    }
  });

  test('debe lanzar ReservationNotFoundError', async () => {
    await expect(
      handler.execute(
        new ConfirmPaymentCommand({
          reservationId: '11111111-1111-1111-1111-111111111111',
          usuarioId: userId
        })
      )
    ).rejects.toThrow(ReservationNotFoundError);
  });

  test('debe lanzar ReservationOwnershipError', async () => {
    await expect(
      handler.execute(
        new ConfirmPaymentCommand({ reservationId, usuarioId: otherUserId })
      )
    ).rejects.toThrow(ReservationOwnershipError);
  });

  test('debe lanzar error si se intenta confirmar más tickets de los pendientes', async () => {
    // Crear ticket type con solo 3 pendientes
    const limitedTtResult = await pool.query(`
      INSERT INTO ticket_types(
        id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado
      )
      VALUES(
        gen_random_uuid(), $1, 'Limitado', 100, 50, 3, 'ACTIVO'
      )
      RETURNING id
    `, [eventId]);
    const limitedTicketTypeId = limitedTtResult.rows[0].id;

    // Crear primera reserva de 2 tickets
    const res1Result = await pool.query(`
      INSERT INTO reservas(
        id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket
      )
      VALUES(
        gen_random_uuid(), $1, $2, $3, 2, 'PENDIENTE_PAGO', 'TICKET-1'
      )
      RETURNING id
    `, [eventId, limitedTicketTypeId, userId]);
    const res1Id = res1Result.rows[0].id;

    // Confirmar la primera reserva (gasta 2 de los 3 pendientes)
    await handler.execute(
      new ConfirmPaymentCommand({ reservationId: res1Id, usuarioId: userId })
    );

    // Verificar que el ticket type ahora tiene 1 pendiente
    const ticketTypeCheck = await pool.query(
      'SELECT reservas_pendientes FROM ticket_types WHERE id = $1',
      [limitedTicketTypeId]
    );
    expect(ticketTypeCheck.rows[0].reservas_pendientes).toBe(1);

    // Crear segunda reserva de 2 tickets (debería fallar)
    const res2Result = await pool.query(`
      INSERT INTO reservas(
        id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket
      )
      VALUES(
        gen_random_uuid(), $1, $2, $3, 2, 'PENDIENTE_PAGO', 'TICKET-2'
      )
      RETURNING id
    `, [eventId, limitedTicketTypeId, userId]);
    const res2Id = res2Result.rows[0].id;

    // Intentar confirmar la segunda reserva debería fallar
    await expect(
      handler.execute(
        new ConfirmPaymentCommand({ reservationId: res2Id, usuarioId: userId })
      )
    ).rejects.toThrow('No existen suficientes reservas pendientes');

    // Verificar que la segunda reserva sigue en estado PENDIENTE_PAGO
    const res2Check = await pool.query(
      'SELECT estado FROM reservas WHERE id = $1',
      [res2Id]
    );
    expect(res2Check.rows[0].estado).toBe('PENDIENTE_PAGO');

    // Verificar que el ticket type aún tiene 1 pendiente
    const finalTicketCheck = await pool.query(
      'SELECT reservas_pendientes FROM ticket_types WHERE id = $1',
      [limitedTicketTypeId]
    );
    expect(finalTicketCheck.rows[0].reservas_pendientes).toBe(1);
  });

  test('debe permitir confirmar cuando hay suficientes pendientes', async () => {
    // Crear ticket type con 5 pendientes
    const enoughTtResult = await pool.query(`
      INSERT INTO ticket_types(
        id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado
      )
      VALUES(
        gen_random_uuid(), $1, 'Suficiente', 100, 50, 5, 'ACTIVO'
      )
      RETURNING id
    `, [eventId]);
    const enoughTicketTypeId = enoughTtResult.rows[0].id;

    // Crear reserva de 4 tickets
    const resResult = await pool.query(`
      INSERT INTO reservas(
        id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket
      )
      VALUES(
        gen_random_uuid(), $1, $2, $3, 4, 'PENDIENTE_PAGO', 'ENOUGH-TICKET'
      )
      RETURNING id
    `, [eventId, enoughTicketTypeId, userId]);
    const resId = resResult.rows[0].id;

    // Confirmar la reserva
    const result = await handler.execute(
      new ConfirmPaymentCommand({ reservationId: resId, usuarioId: userId })
    );

    expect(result.estado).toBe('CONFIRMADA');

    // Verificar que el ticket type ahora tiene 1 pendiente
    const ticketCheck = await pool.query(
      'SELECT reservas_pendientes FROM ticket_types WHERE id = $1',
      [enoughTicketTypeId]
    );
    expect(ticketCheck.rows[0].reservas_pendientes).toBe(1);
  });
});