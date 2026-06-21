import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import pool from '../../../src/shared/infrastructure/database/connection';

import { EmailAlreadyRegisteredError } from '../../../src/modules/auth/domain/errors';

describe('RegisterUserHandler (Integration Test)', () => {
  let registerUserHandler: RegisterUserHandler;

  beforeEach(async () => {
    const userRepository = new PostgresUserRepository();
    const passwordHasher = new BcryptPasswordHasher();
    const jwtService = new JwtService();

    registerUserHandler = new RegisterUserHandler(
      userRepository,
      passwordHasher,
      jwtService
    );
  });

  test('debe registrar un nuevo usuario y guardar en DB', async () => {
    const email = 'test@example.com';

    const command = new RegisterUserCommand({
      email,
      password: 'Password123',
      nombre: 'Integration Test User',
      rol: 'ASISTENTE'
    });

    const result = await registerUserHandler.execute(command);

    expect(result.user).toMatchObject({
      email,
      nombre: 'Integration Test User',
      rol: 'ASISTENTE'
    });

    expect(result.user.id).toBeDefined();

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(20);

    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].email).toBe(email);

    // Verificamos que la contraseña no se almacena en texto plano
    expect(dbResult.rows[0].password_hash).not.toBe('Password123');
    expect(dbResult.rows[0].password_hash).toBeDefined();
  });

  test('debe mostrar error cuando el email existe', async () => {
    const email = 'duplicate@example.com';

    const command1 = new RegisterUserCommand({
      email,
      password: 'Password123',
      nombre: 'First User',
      rol: 'ASISTENTE'
    });

    await registerUserHandler.execute(command1);

    const command2 = new RegisterUserCommand({
      email,
      password: 'Password456',
      nombre: 'Second User',
      rol: 'ASISTENTE'
    });

    await expect(registerUserHandler.execute(command2))
      .rejects
      .toThrow(EmailAlreadyRegisteredError);

    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    expect(dbResult.rows).toHaveLength(1);
  });
});