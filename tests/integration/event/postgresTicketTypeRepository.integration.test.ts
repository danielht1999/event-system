import pool from '../../../src/shared/infrastructure/database/connection';
import { PostgresTicketTypeRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository';
import { TicketType } from '../../../src/modules/event/domain/entities/TicketType';
import { Capacity } from '../../../src/modules/event/domain/value-objects/Capacity';
import { v4 as uuidv4 } from 'uuid';

describe('PostgresTicketTypeRepository (Integration)', () => {
  let repository: PostgresTicketTypeRepository;

  let userId: string;
  let eventId: string;
  let ticketId1: string;
  let ticketId2: string;

  beforeEach(async () => {
    repository = new PostgresTicketTypeRepository();

    userId = uuidv4();
    eventId = uuidv4();
    ticketId1 = uuidv4();
    ticketId2 = uuidv4();

    // Vaciado de tablas respetando escrupulosamente las claves foráneas (FK)
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM reservas');
    await pool.query('DELETE FROM ticket_types');
    await pool.query('DELETE FROM eventos');
    await pool.query('DELETE FROM usuarios');

    await pool.query(
      `
      INSERT INTO usuarios (id, email, nombre, password_hash, rol)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [userId, 'organizer@test.com', 'Organizer', 'hash', 'ORGANIZADOR']
    );

    await pool.query(
      `
      INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, estado)
      VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      `,
      [eventId, userId, 'Evento Test', 'Descripción Test', 'CDMX', 'PUBLICADA']
    );
  });

  describe('save()', () => {
    it('debería persistir ticket type', async () => {
      // ✅ Usamos reconstruct en lugar de new
      const ticket = TicketType.reconstruct(
        ticketId1,
        eventId,
        'VIP',
        300,
        new Capacity(50),
        0,
        0,
        'ACTIVO',
        new Date()
      );

      await repository.save(ticket);

      const result = await pool.query(
        `SELECT * FROM ticket_types WHERE id = $1`,
        [ticketId1]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].nombre).toBe('VIP');
      expect(Number(result.rows[0].precio)).toBe(300);
      expect(Number(result.rows[0].capacidad_maxima)).toBe(50);
    });
  });

  describe('findById()', () => {
    it('debería recuperar ticket existente', async () => {
      const ticket = TicketType.reconstruct(
        ticketId1,
        eventId,
        'VIP',
        300,
        new Capacity(50),
        0,
        0,
        'ACTIVO',
        new Date()
      );

      await repository.save(ticket);

      const found = await repository.findById(ticketId1);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(ticketId1);
      expect(found?.nombre).toBe('VIP');
      expect(found?.capacidadMaxima.value).toBe(50);
      expect(found?.eventId).toBe(eventId);
    });

    it('debería retornar null si no existe', async () => {
      const result = await repository.findById(uuidv4());
      expect(result).toBeNull();
    });
  });

  describe('findByEventId()', () => {
    it('debería recuperar todos los tickets del evento', async () => {
      await repository.save(
        TicketType.reconstruct(ticketId1, eventId, 'General', 100, new Capacity(100), 0, 0, 'ACTIVO', new Date())
      );

      await repository.save(
        TicketType.reconstruct(ticketId2, eventId, 'VIP', 300, new Capacity(20), 0, 0, 'ACTIVO', new Date())
      );

      const result = await repository.findByEventId(eventId);

      expect(result).toHaveLength(2);
      expect(result.some(t => t.nombre === 'General')).toBe(true);
      expect(result.some(t => t.nombre === 'VIP')).toBe(true);
    });

    it('debería retornar array vacío si el evento no tiene tickets', async () => {
      const result = await repository.findByEventId(uuidv4());
      expect(result).toEqual([]);
    });
  });

  describe('findByIdForUpdate()', () => {
    it('debería recuperar ticket aplicando el bloqueo bajo una transacción activa', async () => {
      const ticket = TicketType.reconstruct(
        ticketId1,
        eventId,
        'VIP',
        300,
        new Capacity(50),
        0,
        0,
        'ACTIVO',
        new Date()
      );

      await repository.save(ticket);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const found = await repository.findByIdForUpdate(ticketId1, client);
        await client.query('COMMIT');

        expect(found).not.toBeNull();
        expect(found?.id).toBe(ticketId1);
        expect(found?.nombre).toBe('VIP');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    it('debería retornar null si no existe dentro de la transacción', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const found = await repository.findByIdForUpdate(uuidv4(), client);
        await client.query('COMMIT');
        expect(found).toBeNull();
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  });
});