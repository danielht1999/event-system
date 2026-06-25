// tests/integration/reservation/postgresReservationRepository.integration.test.ts

import { v4 as uuidv4 } from 'uuid';
import { PostgresReservationRepository } from '../../../src/modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { Reservation } from '../../../src/modules/reservation/domain/entities/Reservation';
import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';
import { Event } from '../../../src/modules/event/domain/entities/Event';
import { TicketType } from '../../../src/modules/event/domain/entities/TicketType';
import { PostgresTicketTypeRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository';
import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import pool from '../../../src/shared/infrastructure/database/connection';

describe('PostgresReservationRepository (Integration Test)', () => {
  let repository: PostgresReservationRepository;
  let organizerId: string;
  let attendeeId: string;
  let eventId: string;
  let ticketTypeId: string;

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

    // ✅ CORREGIDO: Event.create con 7 argumentos (incluye capacidadTotal)
    const event = Event.create(
      uuidv4(),
      'Evento Test',
      'Descripcion',
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      'CDMX',
      100, // capacidadTotal
      organizerId
    );

    const savedEvent = await eventRepository.save(event);
    eventId = savedEvent.id;

    // Crear un tipo de ticket real en la DB
    const ticketTypeRepo = new PostgresTicketTypeRepository();
    const ticketType = TicketType.create(
      uuidv4(),
      eventId,
      'General',
      100,
      50
    );
    await ticketTypeRepo.save(ticketType);
    ticketTypeId = ticketType.id;
  });

  afterEach(async () => {
    // Limpiar datos después de cada test
    await pool.query('DELETE FROM reservas WHERE evento_id = $1', [eventId]);
    await pool.query('DELETE FROM ticket_types WHERE evento_id = $1', [eventId]);
    await pool.query('DELETE FROM eventos WHERE id = $1', [eventId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [organizerId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [attendeeId]);
  });

  function buildReservation(): Reservation {
    return Reservation.create({
      id: uuidv4(),
      eventId: eventId,
      ticketTypeId: ticketTypeId,
      usuarioId: attendeeId,
      cantidadTickets: 2,
      codigoTicket: `TK-${uuidv4()}`
    });
  }

  describe('save()', () => {
    test('debe guardar una reserva nueva', async () => {
      const reservation = buildReservation();
      const saved = await repository.save(reservation);

      expect(saved).not.toBeNull();
      expect(saved.id).toBe(reservation.id);
      expect(saved.estado).toBe('PENDIENTE_PAGO');
    });

    test('debe actualizar una reserva existente', async () => {
      const reservation = buildReservation();
      await repository.save(reservation);

      reservation.confirmarPago();
      const updated = await repository.save(reservation);

      expect(updated.estado).toBe('CONFIRMADA');
      expect(updated.pagadoEn).toBeDefined();
    });
  });

  describe('findById()', () => {
    test('debe encontrar una reserva existente', async () => {
      const reservation = buildReservation();
      await repository.save(reservation);

      const found = await repository.findById(reservation.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(reservation.id);
      expect(found?.eventId).toBe(reservation.eventId);
    });

    test('debe retornar null si no existe', async () => {
      const found = await repository.findById(uuidv4());
      expect(found).toBeNull();
    });
  });

  describe('findByIdForUpdate()', () => {
    test('debe encontrar una reserva con bloqueo pesimista', async () => {
      const reservation = buildReservation();
      await repository.save(reservation);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const found = await repository.findByIdForUpdate(reservation.id, client);
        expect(found).not.toBeNull();
        expect(found?.id).toBe(reservation.id);
        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });

    test('debe retornar null si no existe', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const found = await repository.findByIdForUpdate(uuidv4(), client);
        expect(found).toBeNull();
        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });
  });

  describe('findByEvent()', () => {
    test('debe retornar reservas del evento', async () => {
      await repository.save(buildReservation());
      await repository.save(buildReservation());

      const reservations = await repository.findByEvent(eventId);

      expect(reservations.length).toBe(2);
      reservations.forEach(r => {
        expect(r.eventId).toBe(eventId);
      });
    });

    test('debe retornar arreglo vacio', async () => {
      const reservations = await repository.findByEvent(uuidv4());
      expect(reservations).toEqual([]);
    });
  });

  describe('findByUser()', () => {
    test('debe retornar reservas del usuario', async () => {
      await repository.save(buildReservation());
      await repository.save(buildReservation());

      const reservations = await repository.findByUser(attendeeId);

      expect(reservations.length).toBe(2);
      reservations.forEach(r => {
        expect(r.usuarioId).toBe(attendeeId);
      });
    });

    test('debe retornar arreglo vacio', async () => {
      const reservations = await repository.findByUser(uuidv4());
      expect(reservations).toEqual([]);
    });
  });

  describe('findByTicketCode()', () => {
    test('debe encontrar una reserva por codigo', async () => {
      const reservation = buildReservation();
      await repository.save(reservation);

      const found = await repository.findByTicketCode(reservation.codigoTicket);

      expect(found).not.toBeNull();
      expect(found?.codigoTicket).toBe(reservation.codigoTicket);
    });

    test('debe retornar null si no existe', async () => {
      const found = await repository.findByTicketCode('NO-EXISTE');
      expect(found).toBeNull();
    });
  });

  describe('delete()', () => {
    test('debe eliminar una reserva', async () => {
      const reservation = buildReservation();
      await repository.save(reservation);

      await repository.delete(reservation.id);

      const found = await repository.findById(reservation.id);
      expect(found).toBeNull();
    });
  });

  describe('findObsoleteReservations()', () => {
    test('debe encontrar reservas pendientes expiradas', async () => {
      const reservation = buildReservation();
      await repository.save(reservation);

      // Insertar directamente en BD con fecha antigua (más de 15 minutos)
      await pool.query(
        `UPDATE reservas 
         SET reservado_en = NOW() - INTERVAL '20 minutes'
         WHERE id = $1`,
        [reservation.id]
      );

      const client = await pool.connect();
      try {
        const obsolete = await repository.findObsoleteReservations(client);
        expect(obsolete.length).toBeGreaterThan(0);
        
        const found = obsolete.find(r => r.id === reservation.id);
        expect(found).toBeDefined();
        expect(found?.estado).toBe('PENDIENTE_PAGO');
      } finally {
        client.release();
      }
    });

    test('debe retornar array vacío si no hay reservas expiradas', async () => {
      const reservation = buildReservation();
      await repository.save(reservation);

      const client = await pool.connect();
      try {
        const obsolete = await repository.findObsoleteReservations(client);
        const found = obsolete.find(r => r.id === reservation.id);
        expect(found).toBeUndefined();
      } finally {
        client.release();
      }
    });
  });
});