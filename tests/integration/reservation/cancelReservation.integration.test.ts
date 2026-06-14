// tests/integration/reservation/cancelReservation.integration.test.ts

import pool from '../../../src/shared/infrastructure/database/connection';

import { CancelReservationHandler } from '../../../src/modules/reservation/application/commands/CancelReservationHandler';
import { CancelReservationCommand } from '../../../src/modules/reservation/application/commands/CancelReservationCommand';
import { ConfirmPaymentHandler } from '../../../src/modules/reservation/application/commands/ConfirmPaymentHandler';
import { ConfirmPaymentCommand } from '../../../src/modules/reservation/application/commands/ConfirmPaymentCommand';

import { ReservationTransactionService } from '../../../src/modules/reservation/infrastructure/services/ReservationTransactionService';

import {
  ReservationNotFoundError,
  ReservationOwnershipError
} from '../../../src/modules/reservation/domain/errors';

describe('CancelReservationHandler (Integration Test)', () => {
  let cancelHandler: CancelReservationHandler;
  let confirmHandler: ConfirmPaymentHandler;

  let reservationId: string;
  let userId: string;
  let otherUserId: string;
  let eventId: string;

  beforeEach(async () => {
    const userResult = await pool.query(`
      INSERT INTO usuarios(id,nombre,email,password_hash,rol)
      VALUES(gen_random_uuid(),'User','user@test.com','hash','ASISTENTE')
      RETURNING id
    `);

    userId = userResult.rows[0].id;

    const otherResult = await pool.query(`
      INSERT INTO usuarios(id,nombre,email,password_hash,rol)
      VALUES(gen_random_uuid(),'Other','other@test.com','hash','ASISTENTE')
      RETURNING id
    `);

    otherUserId = otherResult.rows[0].id;

    const eventResult = await pool.query(`
      INSERT INTO eventos(
        id,titulo,descripcion,fecha,lugar,
        capacidad_total,precio,organizador_id,
        reservas_confirmadas,reservas_pendientes,estado
      )
      VALUES(
        gen_random_uuid(),
        'Evento',
        'Desc',
        NOW() + INTERVAL '1 day',
        'Oaxaca',
        100,
        100,
        '${userId}',
        0,
        2,
        'PUBLICADO'
      )
      RETURNING id
    `);

    eventId = eventResult.rows[0].id;

    const reservationResult = await pool.query(`
      INSERT INTO reservas(
        id,evento_id,usuario_id,cantidad_tickets,
        estado,codigo_ticket
      )
      VALUES(
        gen_random_uuid(),
        '${eventId}',
        '${userId}',
        2,
        'PENDIENTE_PAGO',
        'TEST-TICKET'
      )
      RETURNING id
    `);

    reservationId = reservationResult.rows[0].id;

    cancelHandler = new CancelReservationHandler(
      new ReservationTransactionService(pool)
    );

    confirmHandler = new ConfirmPaymentHandler(
      new ReservationTransactionService(pool)
    );
  });

  test('debe cancelar una reserva pendiente', async () => {
    const result = await cancelHandler.execute(
      new CancelReservationCommand({
        reservationId,
        usuarioId: userId
      })
    );

    expect(result.estado).toBe('CANCELADA');

    const reservationDb = await pool.query(
      'SELECT estado FROM reservas WHERE id = $1',
      [reservationId]
    );

    expect(reservationDb.rows[0].estado).toBe('CANCELADA');

    const eventDb = await pool.query(
      `SELECT reservas_confirmadas,reservas_pendientes
       FROM eventos WHERE id = $1`,
      [eventId]
    );

    expect(eventDb.rows[0].reservas_confirmadas).toBe(0);
    expect(eventDb.rows[0].reservas_pendientes).toBe(0);
  });

  test('debe lanzar ReservationNotFoundError', async () => {
    await expect(
      cancelHandler.execute(
        new CancelReservationCommand({
          reservationId: '11111111-1111-1111-1111-111111111111',
          usuarioId: userId
        })
      )
    ).rejects.toThrow(ReservationNotFoundError);
  });

  test('debe lanzar ReservationOwnershipError', async () => {
    await expect(
      cancelHandler.execute(
        new CancelReservationCommand({
          reservationId,
          usuarioId: otherUserId
        })
      )
    ).rejects.toThrow(ReservationOwnershipError);
  });

  test('debe fallar al cancelar una reserva ya cancelada', async () => {
    await cancelHandler.execute(
      new CancelReservationCommand({
        reservationId,
        usuarioId: userId
      })
    );

    await expect(
      cancelHandler.execute(
        new CancelReservationCommand({
          reservationId,
          usuarioId: userId
        })
      )
    ).rejects.toThrow();

    const reservaDb = await pool.query(
      'SELECT estado FROM reservas WHERE id = $1',
      [reservationId]
    );

    expect(reservaDb.rows[0].estado).toBe('CANCELADA');
  });

  test('debe actualizar reservas y cupos del evento', async () => {
    await cancelHandler.execute(
      new CancelReservationCommand({
        reservationId,
        usuarioId: userId
      })
    );

    const reservaDb = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [reservationId]
    );

    const eventoDb = await pool.query(
      'SELECT * FROM eventos WHERE id = $1',
      [eventId]
    );

    expect(reservaDb.rows[0].estado).toBe('CANCELADA');
    expect(eventoDb.rows[0].reservas_pendientes).toBe(0);
  });

  test('una reserva cancelada no puede confirmarse', async () => {
    await cancelHandler.execute(
      new CancelReservationCommand({
        reservationId,
        usuarioId: userId
      })
    );

    await expect(
      confirmHandler.execute(
        new ConfirmPaymentCommand({
          reservationId,
          usuarioId: userId
        })
      )
    ).rejects.toThrow();

    const reservaDb = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [reservationId]
    );

    expect(reservaDb.rows[0].estado).toBe('CANCELADA');
  });
});