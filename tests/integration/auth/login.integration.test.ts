import { LoginHandler } from '../../../src/modules/auth/application/commands/LoginHandler';
import { LoginCommand } from '../../../src/modules/auth/application/commands/LoginCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import pool from '../../../src/shared/infrastructure/database/connection';

import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';

import { InvalidCredentialsError } from '../../../src/modules/auth/domain/errors';

describe('LoginHandler (Integration Test)', () => {
  let loginHandler: LoginHandler;
  let registerUserHandler: RegisterUserHandler;

  const email = 'test@example.com';

  beforeEach(async () => {
    const userRepository = new PostgresUserRepository();
    const passwordHasher = new BcryptPasswordHasher();
    const jwtService = new JwtService();

    loginHandler = new LoginHandler(
      userRepository,
      passwordHasher,
      jwtService
    );

    registerUserHandler = new RegisterUserHandler(
      userRepository,
      passwordHasher,
      jwtService
    );

    const command = new RegisterUserCommand({
      email,
      password: 'Password123',
      nombre: 'Integration Test User',
      rol: 'ASISTENTE'
    });

    await registerUserHandler.execute(command);
  });

  test('debe logearse con datos validos', async () => {
    const command = new LoginCommand({
      email,
      password: 'Password123'
    });

    const result = await loginHandler.execute(command);

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
  });

  test('debe mostrar error cuando el email existe y la contrasena es incorrecta', async () => {
    const command = new LoginCommand({
      email,
      password: 'PasswordErronea'
    });

    await expect(loginHandler.execute(command))
      .rejects
      .toThrow(InvalidCredentialsError);

    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    expect(dbResult.rows).toHaveLength(1);
  });

  test('debe mostrar error cuando el email no existe', async () => {
    const command = new LoginCommand({
      email: 'inexistente@example.com',
      password: 'Password123'
    });

    await expect(loginHandler.execute(command))
      .rejects
      .toThrow(InvalidCredentialsError);

    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      ['inexistente@example.com']
    );

    expect(dbResult.rows).toHaveLength(0);
  });
});