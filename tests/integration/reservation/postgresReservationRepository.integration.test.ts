import { v4 as uuidv4 } from 'uuid';

import { PostgresReservationRepository } from '../../../src/modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { Reservation } from '../../../src/modules/reservation/domain/entities/Reservation';

import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';
import { Event } from '../../../src/modules/event/domain/entities/Event';
import { EventDate } from '../../../src/modules/event/domain/value-objects/EventDate';
import { Capacity } from '../../../src/modules/event/domain/value-objects/Capacity';

import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';

import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';

describe('PostgresReservationRepository (Integration Test)', () => {
  let repository: PostgresReservationRepository;

  let organizerId: string;
  let attendeeId: string;

  let eventId: string;

  beforeEach(async () => {
    repository = new PostgresReservationRepository();

    const userRepository = new PostgresUserRepository();
    const passwordHasher = new BcryptPasswordHasher();
    const jwtService = new JwtService();

    const registerUserHandler = new RegisterUserHandler(
      userRepository,
      passwordHasher,
      jwtService
    );

    const organizer = await registerUserHandler.execute(
      new RegisterUserCommand({
        email: `organizer-${uuidv4()}@example.com`,
        password: 'Password123',
        nombre: 'Organizer',
        rol: 'ORGANIZADOR'
      })
    );

    organizerId = organizer.user.id;

    const attendee = await registerUserHandler.execute(
      new RegisterUserCommand({
        email: `user-${uuidv4()}@example.com`,
        password: 'Password123',
        nombre: 'User',
        rol: 'ASISTENTE'
      })
    );

    attendeeId = attendee.user.id;

    const eventRepository = new PostgresEventRepository();

    const event = new Event(
      uuidv4(),
      'Evento Test',
      'Descripcion',
      EventDate.create(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      ),
      'CDMX',
      new Capacity(100),
      500,
      organizerId
    );

    const savedEvent = await eventRepository.save(event);

    eventId = savedEvent.id;
  });

  function buildReservation(): Reservation {
    return Reservation.create({
      id: uuidv4(),
      eventoId: eventId,
      usuarioId: attendeeId,
      cantidadTickets: 2,
      codigoTicket: `TK-${uuidv4()}`
    });
  }

  describe('save()', () => {
    test('debe guardar una reserva nueva', async () => {
      const reservation = buildReservation();

      const saved = await repository.save(
        reservation
      );

      expect(saved).not.toBeNull();
      expect(saved.id).toBe(reservation.id);
      expect(saved.estado).toBe('PENDIENTE_PAGO');
    });

    test('debe actualizar una reserva existente', async () => {
      const reservation = buildReservation();

      await repository.save(reservation);

      reservation.confirmarPago();

      const updated = await repository.save(
        reservation
      );

      expect(updated.estado).toBe(
        'CONFIRMADA'
      );

      expect(updated.pagadoEn).toBeDefined();
    });
  });

  describe('findById()', () => {
    test('debe encontrar una reserva existente', async () => {
      const reservation = buildReservation();

      await repository.save(reservation);

      const found = await repository.findById(
        reservation.id
      );

      expect(found).not.toBeNull();

      expect(found?.id).toBe(
        reservation.id
      );

      expect(found?.eventoId).toBe(
        reservation.eventoId
      );
    });

    test('debe retornar null si no existe', async () => {
      const found = await repository.findById(
        uuidv4()
      );

      expect(found).toBeNull();
    });
  });

  describe('findByEvent()', () => {
    test('debe retornar reservas del evento', async () => {
      await repository.save(buildReservation());
      await repository.save(buildReservation());

      const reservations =
        await repository.findByEvent(
          eventId
        );

      expect(
        reservations.length
      ).toBe(2);

      reservations.forEach(r => {
        expect(r.eventoId).toBe(
          eventId
        );
      });
    });

    test('debe retornar arreglo vacio', async () => {
      const reservations =
        await repository.findByEvent(
          uuidv4()
        );

      expect(reservations).toEqual([]);
    });
  });

  describe('findByUser()', () => {
    test('debe retornar reservas del usuario', async () => {
      await repository.save(buildReservation());
      await repository.save(buildReservation());

      const reservations =
        await repository.findByUser(
          attendeeId
        );

      expect(
        reservations.length
      ).toBe(2);

      reservations.forEach(r => {
        expect(r.usuarioId).toBe(
          attendeeId
        );
      });
    });

    test('debe retornar arreglo vacio', async () => {
      const reservations =
        await repository.findByUser(
          uuidv4()
        );

      expect(reservations).toEqual([]);
    });
  });

  describe('findByTicketCode()', () => {
    test('debe encontrar una reserva por codigo', async () => {
      const reservation =
        buildReservation();

      await repository.save(
        reservation
      );

      const found =
        await repository.findByTicketCode(
          reservation.codigoTicket
        );

      expect(found).not.toBeNull();

      expect(
        found?.codigoTicket
      ).toBe(
        reservation.codigoTicket
      );
    });

    test('debe retornar null si no existe', async () => {
      const found =
        await repository.findByTicketCode(
          'NO-EXISTE'
        );

      expect(found).toBeNull();
    });
  });

  describe('delete()', () => {
    test('debe eliminar una reserva', async () => {
      const reservation =
        buildReservation();

      await repository.save(
        reservation
      );

      await repository.delete(
        reservation.id
      );

      const found =
        await repository.findById(
          reservation.id
        );

      expect(found).toBeNull();
    });
  });
});