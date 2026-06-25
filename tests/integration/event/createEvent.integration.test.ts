// tests/integration/event/createEvent.integration.test.ts

import pool from '../../../src/shared/infrastructure/database/connection';
import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { CreateEventHandler } from '../../../src/modules/event/application/commands/CreateEventHandler';
import { CreateEventCommand } from '../../../src/modules/event/application/commands/CreateEventCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';
import { PostgresTicketTypeRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository';
import { PostgresUnitOfWork } from '../../../src/shared/infrastructure/database/PostgresUnitOfWork';
import { IDomainEventDispatcher } from '../../../src/shared/domain/IDomainEventDispatcher';
import { IDomainEvent } from '../../../src/shared/domain/IDomainEvent';

describe('CreateEventHandler (Integration Test)', () => {
  let createEventHandler: CreateEventHandler;

  class MockDomainEventDispatcher implements IDomainEventDispatcher {
    async dispatch(events: IDomainEvent[]): Promise<void> {
      // No hacemos nada en tests, solo cumplimos con la interfaz
      return Promise.resolve();
    }
  }

  beforeEach(() => {
    const dispatcher = new MockDomainEventDispatcher();
    const uow = new PostgresUnitOfWork(pool, dispatcher);
    createEventHandler = new CreateEventHandler(
      uow,
      new PostgresEventRepository(),
      new PostgresTicketTypeRepository()
    );
  });

  test('debe crear un evento con sus tipos de tickets y guardarlo en DB', async () => {
    const registerUserHandler = new RegisterUserHandler(
      new PostgresUserRepository(),
      new BcryptPasswordHasher(),
      new JwtService()
    );

    const user = await registerUserHandler.execute(
      new RegisterUserCommand({
        email: `organizer-${Date.now()}@test.com`,
        password: 'Password123',
        nombre: 'Organizer',
        rol: 'ORGANIZADOR'
      })
    );

    // ✅ CORREGIDO: usar 'capacidad' en lugar de 'capacidadTotal'
    // ✅ CORREGIDO: agregar 'capacidadTotal' en el evento
    const result = await createEventHandler.execute(
      new CreateEventCommand({
        titulo: 'Conferencia DDD',
        descripcion: 'Evento de prueba',
        fecha: new Date(Date.now() + 86400000).toISOString(),
        lugar: 'Oaxaca',
        capacidadTotal: 150, // ✅ Agregado
        organizadorId: user.user.id,
        tickets: [
          {
            nombre: 'General',
            precio: 500,
            capacidad: 100 // ✅ 'capacidad', no 'capacidadTotal'
          }
        ]
      })
    );

    // ✅ CORREGIDO: usar 'eventId' en lugar de 'id'
    expect(result.eventId).toBeDefined();

    // ✅ CORREGIDO: 'estado' en lugar de 'titulo'
    expect(result.estado).toBe('BORRADOR');

    // Verificación de persistencia en eventos
    const eventDb = await pool.query(
      'SELECT * FROM eventos WHERE id = $1',
      [result.eventId] // ✅ CORREGIDO: usar 'eventId'
    );
    expect(eventDb.rows).toHaveLength(1);
    expect(eventDb.rows[0].titulo).toBe('Conferencia DDD');

    // Verificación de persistencia en ticket_types
    const ticketsDb = await pool.query(
      'SELECT * FROM ticket_types WHERE evento_id = $1',
      [result.eventId] // ✅ CORREGIDO: usar 'eventId'
    );
    expect(ticketsDb.rows).toHaveLength(1);
    expect(ticketsDb.rows[0].nombre).toBe('General');
    expect(Number(ticketsDb.rows[0].precio)).toBe(500);
  });
});