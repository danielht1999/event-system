// tests/integration/auth/register.integration.test.ts
import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import pool from '../../../src/shared/infrastructure/database/connection';

// IMPORTAMOS EL ERROR SEMÁNTICO DEL MÓDULO DE AUTENTICACIÓN
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

  // 1. Registro exitoso con datos únicos
  test('debe registrar un nuevo usario y guardar en DB', async () => {
    const uniqueEmail = `integration-${Date.now()}@example.com`;
    
    const command = new RegisterUserCommand({
      email: uniqueEmail,
      password: 'Password123',
      nombre: 'Integration Test User',
      rol: 'ASISTENTE'
    });

    const result = await registerUserHandler.execute(command);

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

  // 2. Email duplicado - debe fallar
  test('debe mostrar error cuando el email existe', async () => {
    const uniqueEmail = `duplicate-${Date.now()}@example.com`;
    
    const command1 = new RegisterUserCommand({
      email: uniqueEmail,
      password: 'Password123',
      nombre: 'First User',
      rol: 'ASISTENTE'
    });
    await registerUserHandler.execute(command1);

    const command2 = new RegisterUserCommand({
      email: uniqueEmail,
      password: 'Password456',
      nombre: 'Second User',
      rol: 'ASISTENTE'
    });

    // CORRECCIÓN: Validamos que falle lanzando la instancia de la clase de dominio correcta
    await expect(registerUserHandler.execute(command2))
      .rejects
      .toThrow(EmailAlreadyRegisteredError);

    const dbResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [uniqueEmail]
    );
    expect(dbResult.rows).toHaveLength(1);
  });
});