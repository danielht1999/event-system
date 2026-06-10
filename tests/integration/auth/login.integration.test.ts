// tests/integration/auth/register.integration.test.ts
import { LoginHandler } from '../../../src/modules/auth/application/commands/LoginHandler';
import { LoginCommand } from '../../../src/modules/auth/application/commands/LoginCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import pool from '../../../src/shared/infrastructure/database/connection';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { v4 as uuidv4 } from 'uuid';

// IMPORTAMOS EL ERROR ESPECÍFICO PARA VALIDARLO EN LAS ASERCIONES
import { InvalidCredentialsError } from '../../../src/modules/auth/domain/errors';

describe('LoginHandler (Integration Test)', () => {
  let loginHandler: LoginHandler;
  let registerUserHandler: RegisterUserHandler;  
  let uniqueEmail: string;

  beforeEach(async () => {
    const userRepository = new PostgresUserRepository();
    const passwordHasher = new BcryptPasswordHasher();
    const jwtService = new JwtService();
    uniqueEmail = `integration-${uuidv4()}@example.com`;

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
      email: uniqueEmail,
      password: 'Password123',
      nombre: 'Integration Test User',
      rol: 'ASISTENTE'
    });
    await registerUserHandler.execute(command);
  });

  // 1. Login exitoso
  test('debe logearse con datos validos', async () => {  
    const command = new LoginCommand({
      email: uniqueEmail,
      password: 'Password123'
    });
    const result = await loginHandler.execute(command);

    expect(result.user).toMatchObject({
      email: uniqueEmail,
      nombre: 'Integration Test User',
      rol: 'ASISTENTE'
    });
    expect(result.user.id).toBeDefined();
    expect(result.token).toBeDefined();

    // Verificación directa en DB
    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [uniqueEmail]
    );
    
    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].email).toBe(uniqueEmail);
  });
  
  // 2. Password incorrecto (el email existe pero la contraseña es erronea)
  test('debe mostrar error cuando el email existe y la contrasena es incorrecta', async () => {
    const command = new LoginCommand({
      email: uniqueEmail,
      password: 'Passworderronea'
    });

    // CORRECCIÓN: Comprobamos que lance la clase exacta del dominio
    await expect(loginHandler.execute(command))
      .rejects
      .toThrow(InvalidCredentialsError);

    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [uniqueEmail]
    );
    expect(dbResult.rows).toHaveLength(1);
  });

  // 3. Email no existe en base de datos
  test('debe mostrar error cuando el email no existe', async () => {
    const command = new LoginCommand({
      email: 'uniqueEmailErroneo',
      password: 'Passworderronea'
    });

    // CORRECCIÓN: Comprobamos que lance la clase exacta del dominio
    await expect(loginHandler.execute(command))
      .rejects
      .toThrow(InvalidCredentialsError);

    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [['uniqueEmailErroneo']]
    );
    expect(dbResult.rows).toHaveLength(0);
  });
});