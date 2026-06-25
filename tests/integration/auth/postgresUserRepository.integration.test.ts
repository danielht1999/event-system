// tests/integration/reservation/postgresReservationRepository.integration.test.ts

import pool from '../../../src/shared/infrastructure/database/connection';
import { PostgresReservationRepository } from '../../../src/modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { Reservation } from '../../../src/modules/reservation/domain/entities/Reservation';
import { Event } from '../../../src/modules/event/domain/entities/Event';
import { v4 as uuidv4 } from 'uuid';

describe('PostgresReservationRepository (Integration Test)', () => {
  let repository: PostgresReservationRepository;
  let userId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeEach(async () => {
    repository = new PostgresReservationRepository();

    // Crear usuario
    const userResult = await pool.query(
      `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [uuidv4(), `test-${Date.now()}@test.com`, 'Test User', 'hashed', 'ASISTENTE']
    );
    userId = userResult.rows[0].id;

    // Crear evento con 7 argumentos
    const event = Event.create(
      uuidv4(),
      'Evento Test',
      'Descripción del evento para pruebas',
      new Date(Date.now() + 86400000),
      'Lugar Test',
      100, // capacidadTotal
      userId // organizadorId
    );

    // Guardar evento
    await pool.query(
      `INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, capacidad_total, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [event.id, event.organizadorId, event.titulo, event.descripcion, event.lugar, event.fecha.value, event.capacidadTotal, event.estado]
    );
    eventId = event.id;

    // Crear ticket type
    const ticketResult = await pool.query(
      `INSERT INTO ticket_types (id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [uuidv4(), eventId, 'General', 100, 50, 0, 'ACTIVO']
    );
    ticketTypeId = ticketResult.rows[0].id;
  });

  afterEach(async () => {
    // Limpiar datos después de cada test
    await pool.query('DELETE FROM reservas WHERE evento_id = $1', [eventId]);
    await pool.query('DELETE FROM ticket_types WHERE evento_id = $1', [eventId]);
    await pool.query('DELETE FROM eventos WHERE id = $1', [eventId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [userId]);
  });

  describe('save()', () => {
    test('debe guardar una reserva en la base de datos', async () => {
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation);

      const result = await pool.query(
        'SELECT * FROM reservas WHERE id = $1',
        [reservation.id]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].evento_id).toBe(eventId);
      expect(result.rows[0].usuario_id).toBe(userId);
      expect(result.rows[0].cantidad_tickets).toBe(2);
      expect(result.rows[0].estado).toBe('PENDIENTE_PAGO');
    });

    test('debe actualizar una reserva existente', async () => {
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation);

      // Cambiar estado
      reservation.confirmarPago();

      await repository.save(reservation);

      const result = await pool.query(
        'SELECT * FROM reservas WHERE id = $1',
        [reservation.id]
      );

      expect(result.rows[0].estado).toBe('CONFIRMADA');
    });
  });

  describe('findById()', () => {
    test('debe encontrar una reserva por id', async () => {
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation);

      const found = await repository.findById(reservation.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(reservation.id);
      expect(found?.eventId).toBe(eventId);
      expect(found?.usuarioId).toBe(userId);
      expect(found?.cantidadTickets).toBe(2);
      expect(found?.estado).toBe('PENDIENTE_PAGO');
    });

    test('debe retornar null si la reserva no existe', async () => {
      const found = await repository.findById(uuidv4());
      expect(found).toBeNull();
    });
  });

  describe('findByIdForUpdate()', () => {
    test('debe encontrar una reserva con bloqueo pesimista', async () => {
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation);

      // Necesitamos un cliente para la transacción
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

    test('debe retornar null si la reserva no existe', async () => {
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

  describe('findByUser()', () => {
    test('debe encontrar reservas por usuario', async () => {
      const reservation1 = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 1,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      const reservation2 = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 3,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation1);
      await repository.save(reservation2);

      const reservations = await repository.findByUser(userId);

      expect(reservations).toHaveLength(2);
      expect(reservations[0].usuarioId).toBe(userId);
      expect(reservations[1].usuarioId).toBe(userId);
    });

    test('debe retornar array vacío si no hay reservas', async () => {
      const reservations = await repository.findByUser(uuidv4());
      expect(reservations).toHaveLength(0);
    });
  });

  describe('findByEvent()', () => {
    test('debe encontrar reservas por evento', async () => {
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation);

      const reservations = await repository.findByEvent(eventId);

      expect(reservations).toHaveLength(1);
      expect(reservations[0].eventId).toBe(eventId);
    });

    test('debe retornar array vacío si no hay reservas para el evento', async () => {
      const reservations = await repository.findByEvent(uuidv4());
      expect(reservations).toHaveLength(0);
    });
  });

  describe('findByTicketCode()', () => {
    test('debe encontrar una reserva por código de ticket', async () => {
      const codigoTicket = `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: codigoTicket
      });

      await repository.save(reservation);

      const found = await repository.findByTicketCode(codigoTicket);

      expect(found).not.toBeNull();
      expect(found?.codigoTicket).toBe(codigoTicket);
    });

    test('debe retornar null si el código no existe', async () => {
      const found = await repository.findByTicketCode('CODIGO-INEXISTENTE');
      expect(found).toBeNull();
    });
  });

  describe('findObsoleteReservations()', () => {
    test('debe encontrar reservas pendientes expiradas', async () => {
      // Crear reserva pendiente
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

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
        
        // Verificar que nuestra reserva está en la lista
        const found = obsolete.find(r => r.id === reservation.id);
        expect(found).toBeDefined();
        expect(found?.estado).toBe('PENDIENTE_PAGO');
      } finally {
        client.release();
      }
    });

    test('debe retornar array vacío si no hay reservas expiradas', async () => {
      // Crear reserva pendiente reciente (no expirada)
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation);

      const client = await pool.connect();
      try {
        const obsolete = await repository.findObsoleteReservations(client);
        // No debería encontrar la reserva reciente
        const found = obsolete.find(r => r.id === reservation.id);
        expect(found).toBeUndefined();
      } finally {
        client.release();
      }
    });
  });

  describe('delete()', () => {
    test('debe eliminar una reserva', async () => {
      const reservation = Reservation.create({
        id: uuidv4(),
        eventId: eventId,
        ticketTypeId: ticketTypeId,
        usuarioId: userId,
        cantidadTickets: 2,
        codigoTicket: `TCK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      });

      await repository.save(reservation);

      await repository.delete(reservation.id);

      const result = await pool.query(
        'SELECT * FROM reservas WHERE id = $1',
        [reservation.id]
      );
      expect(result.rows).toHaveLength(0);
    });
  });
});