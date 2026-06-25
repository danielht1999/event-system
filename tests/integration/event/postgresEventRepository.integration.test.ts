// tests/integration/event/postgresEventRepository.integration.test.ts

import { v4 as uuidv4 } from 'uuid';
import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';
import { Event } from '../../../src/modules/event/domain/entities/Event';
import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import pool from '../../../src/shared/infrastructure/database/connection';

describe('PostgresEventRepository (Integration Test)', () => {
  let repository: PostgresEventRepository;
  let organizerId: string;

  beforeEach(async () => {
    repository = new PostgresEventRepository();

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
        email: `organizer-${uuidv4()}@example.com`,
        password: 'Password123',
        nombre: 'Organizer',
        rol: 'ORGANIZADOR'
      })
    );

    organizerId = user.user.id;
  });

  afterEach(async () => {
    // Limpiar eventos creados por el organizador
    await pool.query('DELETE FROM eventos WHERE organizador_id = $1', [organizerId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [organizerId]);
  });

  // ✅ CORREGIDO: Event.create con 7 argumentos (incluye capacidadTotal)
  function buildEvent(): Event {
    return Event.create(
      uuidv4(),
      'Evento Test',
      'Descripcion Test',
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      'CDMX',
      100, // capacidadTotal
      organizerId
    );
  }

  describe('save()', () => {
    test('debe guardar un evento nuevo', async () => {
      const event = buildEvent();
      const saved = await repository.save(event);

      expect(saved).not.toBeNull();
      expect(saved.id).toBe(event.id);
      expect(saved.titulo).toBe('Evento Test');
      expect(saved.estado).toBe('BORRADOR');
      expect(saved.capacidadTotal).toBe(100);
      expect(saved.organizadorId).toBe(organizerId);
    });

    test('debe actualizar un evento existente', async () => {
      const event = buildEvent();
      await repository.save(event);

      event.publicar();

      const updated = await repository.save(event);
      expect(updated.estado).toBe('PUBLICADA');
    });

    test('debe actualizar detalles del evento usando cambiarDetalles()', async () => {
      const event = buildEvent();
      await repository.save(event);

      event.cambiarDetalles({
        titulo: 'Nuevo Titulo',
        descripcion: 'Nueva Descripcion',
        lugar: 'Guadalajara'
      });

      const updated = await repository.save(event);

      expect(updated.titulo).toBe('Nuevo Titulo');
      expect(updated.descripcion).toBe('Nueva Descripcion');
      expect(updated.lugar).toBe('Guadalajara');
    });
  });

  describe('findById()', () => {
    test('debe encontrar un evento existente', async () => {
      const event = buildEvent();
      await repository.save(event);

      const found = await repository.findById(event.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(event.id);
      expect(found?.titulo).toBe(event.titulo);
      expect(found?.capacidadTotal).toBe(100);
    });

    test('debe retornar null si no existe', async () => {
      const found = await repository.findById(uuidv4());
      expect(found).toBeNull();
    });
  });

  describe('findByIdForUpdate()', () => {
    test('debe encontrar un evento con bloqueo pesimista', async () => {
      const event = buildEvent();
      await repository.save(event);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const found = await repository.findByIdForUpdate(event.id, client);
        expect(found).not.toBeNull();
        expect(found?.id).toBe(event.id);
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

  describe('delete()', () => {
    test('debe eliminar un evento', async () => {
      const event = buildEvent();
      await repository.save(event);

      const deleted = await repository.delete(event.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(event.id);
      expect(found).toBeNull();
    });

    test('debe retornar false si no existe', async () => {
      const deleted = await repository.delete(uuidv4());
      expect(deleted).toBe(false);
    });
  });

  describe('exists()', () => {
    test('debe retornar true cuando existe', async () => {
      const event = buildEvent();
      await repository.save(event);

      const exists = await repository.exists(event.id);
      expect(exists).toBe(true);
    });

    test('debe retornar false cuando no existe', async () => {
      const exists = await repository.exists(uuidv4());
      expect(exists).toBe(false);
    });
  });

  // ✅ Test específico para capacidadTotal
  describe('capacidadTotal', () => {
    test('debe guardar y recuperar capacidadTotal correctamente', async () => {
      const event = Event.create(
        uuidv4(),
        'Evento con Capacidad',
        'Descripcion',
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        'CDMX',
        250, // capacidadTotal
        organizerId
      );

      await repository.save(event);

      const found = await repository.findById(event.id);
      expect(found?.capacidadTotal).toBe(250);
    });
  });
});