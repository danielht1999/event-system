import { v4 as uuidv4 } from 'uuid';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { User } from '../../../src/modules/auth/domain/entities/User';

describe('PostgresUserRepository (Integration Test)', () => {
  let repository: PostgresUserRepository;

  beforeEach(() => {
    repository = new PostgresUserRepository();
  });

  function buildUser(): { user: User; passwordHash: string } {
    const user = new User(
      uuidv4(),
      `test-${uuidv4()}@mail.com`,
      'Test User',
      'ASISTENTE'
    );

    return {
      user,
      passwordHash: 'hashed-password-123'
    };
  }

  describe('create()', () => {
    test('debe crear un usuario en la base de datos', async () => {
      const { user, passwordHash } = buildUser();

      const created = await repository.create(user, passwordHash);

      expect(created).not.toBeNull();
      expect(created.id).toBe(user.id);
      expect(created.email).toBe(user.email);
      expect(created.nombre).toBe(user.nombre);
      expect(created.rol).toBe('ASISTENTE');
    });

    test('debe despachar eventos del usuario', async () => {
      const { user, passwordHash } = buildUser();

      user.cambiarRol('ORGANIZADOR');

      const created = await repository.create(user, passwordHash);

      expect(created.id).toBe(user.id);
    });
  });

  describe('findByEmail()', () => {
    test('debe encontrar un usuario existente', async () => {
      const { user, passwordHash } = buildUser();

      await repository.create(user, passwordHash);

      const found = await repository.findByEmail(user.email);

      expect(found).not.toBeNull();
      expect(found?.email).toBe(user.email);
    });

    test('debe retornar null si no existe', async () => {
      const found = await repository.findByEmail('no-existe@mail.com');

      expect(found).toBeNull();
    });
  });

  describe('findById()', () => {
    test('debe encontrar usuario por id', async () => {
      const { user, passwordHash } = buildUser();

      await repository.create(user, passwordHash);

      const found = await repository.findById(user.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);
    });

    test('debe retornar null si no existe', async () => {
      const found = await repository.findById(uuidv4());

      expect(found).toBeNull();
    });
  });

  describe('emailExists()', () => {
    test('debe retornar true si email existe', async () => {
      const { user, passwordHash } = buildUser();

      await repository.create(user, passwordHash);

      const exists = await repository.emailExists(user.email);

      expect(exists).toBe(true);
    });

    test('debe retornar false si email no existe', async () => {
      const exists = await repository.emailExists('fake@mail.com');

      expect(exists).toBe(false);
    });
  });

  describe('findByEmailWithPassword()', () => {
    test('debe retornar usuario y hash de password', async () => {
      const { user, passwordHash } = buildUser();

      await repository.create(user, passwordHash);

      const result = await repository.findByEmailWithPassword(user.email);

      expect(result).not.toBeNull();
      expect(result?.user.email).toBe(user.email);
      expect(result?.passwordHash).toBe(passwordHash);
    });

    test('debe retornar null si no existe', async () => {
      const result = await repository.findByEmailWithPassword('no@mail.com');

      expect(result).toBeNull();
    });
  });

 describe('save()', () => {
  test('debe actualizar usuario existente', async () => {
    const { user, passwordHash } = buildUser();

    await repository.create(user, passwordHash);

    user.cambiarRol('ORGANIZADOR');

    const updated = await repository.save(user);

    expect(updated.rol).toBe('ORGANIZADOR');
  });

  test('debe fallar si el usuario no existe', async () => {
    const { user } = buildUser();

    await expect(repository.save(user))
      .rejects
      .toThrow(/UserWithIdNotFound/);
  });
});
});