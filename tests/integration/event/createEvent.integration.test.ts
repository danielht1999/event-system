import pool from '../../../src/shared/infrastructure/database/connection';

import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';

import { CreateEventHandler } from '../../../src/modules/event/application/commands/CreateEventHandler';
import { CreateEventCommand } from '../../../src/modules/event/application/commands/CreateEventCommand';

import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';

import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';

describe('CreateEventHandler (Integration Test)', () => {
  let createEventHandler: CreateEventHandler;

  beforeEach(() => {
    createEventHandler = new CreateEventHandler(
      new PostgresEventRepository()
    );
  });

  test('debe crear un evento y guardarlo en DB', async () => {
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

    const result = await createEventHandler.execute(
      new CreateEventCommand({
        titulo: 'Conferencia DDD',
        descripcion: 'Evento de prueba',
        fecha: new Date(Date.now() + 86400000).toISOString(),
        lugar: 'Oaxaca',
        capacidadTotal: 100,
        precio: 500,
        organizadorId: user.user.id
      })
    );

    expect(result.id).toBeDefined();
    expect(result.titulo).toBe('Conferencia DDD');

    const dbResult = await pool.query(
      'SELECT * FROM eventos WHERE id = $1',
      [result.id]
    );

    expect(dbResult.rows).toHaveLength(1);

    expect(dbResult.rows[0]).toMatchObject({
      titulo: 'Conferencia DDD',
      lugar: 'Oaxaca',
      organizador_id: user.user.id
    });

    expect(dbResult.rows[0].reservas_confirmadas).toBe(0);
    expect(dbResult.rows[0].reservas_pendientes).toBe(0);
  });
});