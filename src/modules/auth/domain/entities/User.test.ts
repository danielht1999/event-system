import { User } from './User';
import { Email } from '../value-objects/Email';
import { DomainEventNames } from '@shared/domain/DomainEventNames';

describe('User', () => {
  function buildUser() {
    return new User(
      'user-1',
      'test@example.com',
      'Daniel',
      'ASISTENTE'
    );
  }

  describe('creación', () => {
    test('debe crear un usuario válido', () => {
      const user = buildUser();

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.nombre).toBe('Daniel');
      expect(user.rol).toBe('ASISTENTE');
    });

    test('debe normalizar email automáticamente', () => {
      const user = new User(
        'user-1',
        '  TEST@EXAMPLE.COM ',
        'Daniel',
        'ASISTENTE'
      );

      expect(user.email).toBe(
        'test@example.com'
      );
    });

    test('debe exponer el Email Value Object', () => {
      const user = buildUser();

      expect(user.emailVO).toBeInstanceOf(
        Email
      );

      expect(user.emailVO.value).toBe(
        'test@example.com'
      );
    });
  });

  describe('roles', () => {
    test('debe reconocer un asistente', () => {
      const user = buildUser();

      expect(user.esAsistente()).toBe(true);
      expect(user.esOrganizador()).toBe(false);
    });

    test('debe reconocer un organizador', () => {
      const user = new User(
        'user-1',
        'test@example.com',
        'Daniel',
        'ORGANIZADOR'
      );

      expect(user.esOrganizador()).toBe(true);
      expect(user.esAsistente()).toBe(false);
    });
  });

  describe('cambiarRol()', () => {
    test('debe cambiar de ASISTENTE a ORGANIZADOR', () => {
      const user = buildUser();

      user.cambiarRol('ORGANIZADOR');

      expect(user.rol).toBe(
        'ORGANIZADOR'
      );
    });

    test('debe registrar evento de dominio', () => {
      const user = buildUser();

      user.cambiarRol('ORGANIZADOR');

      const events = user.pullDomainEvents();

      expect(events).toHaveLength(1);

      expect(events[0].eventName).toBe(
        DomainEventNames.AUTH.USER_ROLE_CHANGED
      );

      expect(events[0].data).toEqual({
        userId: user.id,
        rolAnterior: 'ASISTENTE',
        nuevoRol: 'ORGANIZADOR'
      });
    });

    test('no debe generar evento si el rol es el mismo', () => {
      const user = buildUser();

      user.cambiarRol('ASISTENTE');

      const events = user.pullDomainEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('actualizarPerfil()', () => {
    test('debe actualizar nombre', () => {
      const user = buildUser();

      user.actualizarPerfil(
        'Nuevo Nombre',
        new Email('test@example.com')
      );

      expect(user.nombre).toBe(
        'Nuevo Nombre'
      );
    });

    test('debe actualizar email', () => {
      const user = buildUser();

      user.actualizarPerfil(
        'Daniel',
        new Email('nuevo@example.com')
      );

      expect(user.email).toBe(
        'nuevo@example.com'
      );
    });

    test('debe registrar evento de dominio', () => {
      const user = buildUser();

      user.actualizarPerfil(
        'Nuevo Nombre',
        new Email('nuevo@example.com')
      );

      const events = user.pullDomainEvents();

      expect(events).toHaveLength(1);

      expect(events[0].eventName).toBe(
        DomainEventNames.AUTH.USER_PROFILE_UPDATED
      );

      expect(events[0].data).toEqual({
        userId: user.id,
        nombre: 'Nuevo Nombre',
        email: 'nuevo@example.com'
      });
    });
  });

  describe('eventos de dominio', () => {
    test('pullDomainEvents debe vaciar la colección', () => {
      const user = buildUser();

      user.cambiarRol('ORGANIZADOR');

      expect(
        user.pullDomainEvents()
      ).toHaveLength(1);

      expect(
        user.pullDomainEvents()
      ).toHaveLength(0);
    });

    test('recordEvent debe agregar eventos manualmente', () => {
      const user = buildUser();

      user.recordEvent(
        'CustomEvent',
        { test: true }
      );

      const events = user.pullDomainEvents();

      expect(events).toHaveLength(1);

      expect(events[0].eventName).toBe(
        'CustomEvent'
      );
    });
  });
});