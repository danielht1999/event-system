import { v4 as uuidv4 } from 'uuid';

import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';
import { Event } from '../../../src/modules/event/domain/entities/Event';
import { EventDate } from '../../../src/modules/event/domain/value-objects/EventDate';
import { Capacity } from '../../../src/modules/event/domain/value-objects/Capacity';

import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';

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

  function buildEvent(): Event {
    return new Event(
      uuidv4(),
      'Evento Test',
      'Descripcion Test',
      EventDate.create(
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      ),
      'CDMX',
      new Capacity(100),
      500,
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
    });

    test('debe actualizar un evento existente', async () => {
      const event = buildEvent();

      await repository.save(event);

      event.publicar();

      const updated = await repository.save(event);

      expect(updated.estado).toBe('PUBLICADA');
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
    });

    test('debe retornar null si no existe', async () => {
      const found = await repository.findById(uuidv4());

      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    test('debe retornar todos los eventos', async () => {
      await repository.save(buildEvent());
      await repository.save(buildEvent());

      const events = await repository.findAll();

      expect(events.length).toBe(2);
    });

    test('debe retornar arreglo vacio cuando no existen eventos', async () => {
      const events = await repository.findAll();

      expect(events).toEqual([]);
    });
  });

  describe('findByOrganizerId()', () => {
    test('debe retornar solo eventos del organizador indicado', async () => {
      await repository.save(buildEvent());
      await repository.save(buildEvent());

      const events = await repository.findByOrganizerId(
        organizerId
      );

      expect(events.length).toBe(2);

      events.forEach(event => {
        expect(event.organizadorId).toBe(organizerId);
      });
    });

    test('debe retornar arreglo vacio si el organizador no tiene eventos', async () => {
      const events = await repository.findByOrganizerId(
        uuidv4()
      );

      expect(events).toEqual([]);
    });
  });

  describe('updateData()', () => {
    test('debe actualizar titulo', async () => {
      const event = buildEvent();

      await repository.save(event);

      const updated = await repository.updateData(
        event.id,
        {
          titulo: 'Nuevo titulo'
        }
      );

      expect(updated).not.toBeNull();
      expect(updated?.titulo).toBe('Nuevo titulo');
    });

    test('debe actualizar descripcion', async () => {
      const event = buildEvent();

      await repository.save(event);

      const updated = await repository.updateData(
        event.id,
        {
          descripcion: 'Nueva descripcion'
        }
      );

      expect(updated?.descripcion).toBe(
        'Nueva descripcion'
      );
    });

    test('debe actualizar lugar', async () => {
      const event = buildEvent();

      await repository.save(event);

      const updated = await repository.updateData(
        event.id,
        {
          lugar: 'Guadalajara'
        }
      );

      expect(updated?.lugar).toBe('Guadalajara');
    });

    test('debe actualizar multiples campos', async () => {
      const event = buildEvent();

      await repository.save(event);

      const updated = await repository.updateData(
        event.id,
        {
          titulo: 'Titulo actualizado',
          descripcion: 'Descripcion actualizada',
          lugar: 'Monterrey'
        }
      );

      expect(updated?.titulo).toBe(
        'Titulo actualizado'
      );

      expect(updated?.descripcion).toBe(
        'Descripcion actualizada'
      );

      expect(updated?.lugar).toBe(
        'Monterrey'
      );
    });

    test('debe retornar null si el evento no existe', async () => {
      const updated = await repository.updateData(
        uuidv4(),
        {
          titulo: 'No existe'
        }
      );

      expect(updated).toBeNull();
    });
  });

  describe('delete()', () => {
    test('debe eliminar un evento', async () => {
      const event = buildEvent();

      await repository.save(event);

      const deleted = await repository.delete(
        event.id
      );

      expect(deleted).toBe(true);

      const found = await repository.findById(
        event.id
      );

      expect(found).toBeNull();
    });

    test('debe retornar false si no existe', async () => {
      const deleted = await repository.delete(
        uuidv4()
      );

      expect(deleted).toBe(false);
    });
  });

  describe('exists()', () => {
    test('debe retornar true cuando existe', async () => {
      const event = buildEvent();

      await repository.save(event);

      const exists = await repository.exists(
        event.id
      );

      expect(exists).toBe(true);
    });

    test('debe retornar false cuando no existe', async () => {
      const exists = await repository.exists(
        uuidv4()
      );

      expect(exists).toBe(false);
    });
  });
});