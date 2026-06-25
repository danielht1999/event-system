// src/modules/auth/domain/entities/User.test.ts

import { User } from './User';
import { Email } from '../value-objects/Email';
import { DomainEventNames } from '@shared/domain/DomainEventNames';

describe('User', () => {
  function buildUser() {
    return User.create({
      id: 'user-1',
      email: 'test@example.com',
      nombre: 'Daniel',
      rol: 'ASISTENTE',
      passwordHash: 'hashed_password'
    });
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
      const user = User.create({
        id: 'user-1',
        email: '  TEST@EXAMPLE.COM ',
        nombre: 'Daniel',
        rol: 'ASISTENTE',
        passwordHash: 'hashed_password'
      });

      expect(user.email).toBe('test@example.com');
    });

    test('debe exponer el Email Value Object', () => {
      const user = buildUser();

      expect(user.emailVO).toBeInstanceOf(Email);
      expect(user.emailVO.value).toBe('test@example.com');
    });
  });

  describe('roles', () => {
    test('debe reconocer un asistente', () => {
      const user = buildUser();

      expect(user.esAsistente()).toBe(true);
      expect(user.esOrganizador()).toBe(false);
    });

    test('debe reconocer un organizador', () => {
      const user = User.create({
        id: 'user-1',
        email: 'test@example.com',
        nombre: 'Daniel',
        rol: 'ORGANIZADOR',
        passwordHash: 'hashed_password'
      });

      expect(user.esOrganizador()).toBe(true);
      expect(user.esAsistente()).toBe(false);
    });
  });

  describe('cambiarRol()', () => {
    test('debe cambiar de ASISTENTE a ORGANIZADOR', () => {
      const user = buildUser();

      // ✅ Limpiar eventos de creación antes de probar
      user.pullDomainEvents();

      user.cambiarRol('ORGANIZADOR');

      expect(user.rol).toBe('ORGANIZADOR');
    });

    test('debe registrar evento de dominio', () => {
      const user = buildUser();

      // ✅ Limpiar eventos de creación
      user.pullDomainEvents();

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

      // ✅ Limpiar eventos de creación
      user.pullDomainEvents();

      user.cambiarRol('ASISTENTE');

      const events = user.pullDomainEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('actualizarPerfil()', () => {
    test('debe actualizar nombre', () => {
      const user = buildUser();

      // ✅ Limpiar eventos de creación
      user.pullDomainEvents();

      user.actualizarPerfil(
        'Nuevo Nombre',
        new Email('test@example.com')
      );

      expect(user.nombre).toBe('Nuevo Nombre');
    });

    test('debe actualizar email', () => {
      const user = buildUser();

      // ✅ Limpiar eventos de creación
      user.pullDomainEvents();

      user.actualizarPerfil(
        'Daniel',
        new Email('nuevo@example.com')
      );

      expect(user.email).toBe('nuevo@example.com');
    });

    test('debe registrar evento de dominio', () => {
      const user = buildUser();

      // ✅ Limpiar eventos de creación
      user.pullDomainEvents();

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

      // ✅ Limpiar eventos de creación
      user.pullDomainEvents();

      user.cambiarRol('ORGANIZADOR');

      expect(user.pullDomainEvents()).toHaveLength(1);
      expect(user.pullDomainEvents()).toHaveLength(0);
    });

    test('recordEvent debe agregar eventos manualmente', () => {
      const user = buildUser();

      // ✅ Limpiar eventos de creación
      user.pullDomainEvents();

      user.recordEvent('CustomEvent', { test: true });

      const events = user.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('CustomEvent');
    });
  });
});