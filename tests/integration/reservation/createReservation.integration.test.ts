// tests/integration/reservation/createReservation.integration.test.ts

import pool from '../../../src/shared/infrastructure/database/connection';

import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';

import { CreateEventHandler } from '../../../src/modules/event/application/commands/CreateEventHandler';
import { CreateEventCommand } from '../../../src/modules/event/application/commands/CreateEventCommand';
import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';

import { CreateReservationHandler } from '../../../src/modules/reservation/application/commands/CreateReservationHandler';
import { CreateReservationCommand } from '../../../src/modules/reservation/application/commands/CreateReservationCommand';

import { ReservationTransactionService } from '../../../src/modules/reservation/infrastructure/services/ReservationTransactionService';

import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';

import {
  EventCapacityExceededError,
  EventNotFoundError
} from '../../../src/modules/event/domain/errors';

describe('CreateReservationHandler (Integration Test)', () => {
  let handler: CreateReservationHandler;

  let userId: string;
  let eventId: string;

  beforeEach(async () => {
    const userRepository = new PostgresUserRepository();
    const passwordHasher = new BcryptPasswordHasher();
    const jwtService = new JwtService();

    const registerUserHandler = new RegisterUserHandler(
      userRepository,
      passwordHasher,
      jwtService
    );

    const user = await registerUserHandler.execute(
      new RegisterUserCommand({
        email: `reservation-${Date.now()}@test.com`,
        password: 'Password123',
        nombre: 'Reservation User',
        rol: 'ASISTENTE'
      })
    );

    userId = user.user.id;

    const createEventHandler = new CreateEventHandler(
      new PostgresEventRepository()
    );

    const event = await createEventHandler.execute(
      new CreateEventCommand({
        titulo: 'Evento Integracion',
        descripcion: 'Evento para pruebas',
        fecha: new Date(Date.now() + 86400000).toISOString(),
        lugar: 'Oaxaca',
        capacidadTotal: 100,
        precio: 100,
        organizadorId: userId
      })
    );

    eventId = event.id;

    handler = new CreateReservationHandler(
      new ReservationTransactionService(pool)
    );
  });

  test('debe crear una reserva y actualizar reservas_pendientes', async () => {
    const result = await handler.execute(
      new CreateReservationCommand({
        eventoId: eventId,
        usuarioId: userId,
        cantidadTickets: 2
      })
    );

    expect(result.id).toBeDefined();
    expect(result.estado).toBe('PENDIENTE_PAGO');

    const reservationResult = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [result.id]
    );

    expect(reservationResult.rows).toHaveLength(1);

    const eventResult = await pool.query(
      'SELECT reservas_pendientes FROM eventos WHERE id = $1',
      [eventId]
    );

    expect(eventResult.rows[0].reservas_pendientes).toBe(2);
  });

  test('debe lanzar EventNotFoundError si el evento no existe', async () => {
    await expect(
      handler.execute(
        new CreateReservationCommand({
          eventoId: '11111111-1111-1111-1111-111111111111',
          usuarioId: userId,
          cantidadTickets: 1
        })
      )
    ).rejects.toThrow(EventNotFoundError);
  });

  test('debe lanzar EventCapacityExceededError si el evento esta lleno', async () => {
    await pool.query(`
      UPDATE eventos
      SET reservas_confirmadas = capacidad_total
      WHERE id = '${eventId}'
    `);

    await expect(
      handler.execute(
        new CreateReservationCommand({
          eventoId: eventId,
          usuarioId: userId,
          cantidadTickets: 1
        })
      )
    ).rejects.toThrow(EventCapacityExceededError);
  });
});