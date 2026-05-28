// src/modules/auth/domain/value-objects/Email.test.ts
import { Email } from './Email';

describe('Email', () => {
  test('debería crear un email válido', () => {
    const email = new Email('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  test('debería convertir email a minúsculas', () => {
    const email = new Email('TEST@Example.COM');
    expect(email.value).toBe('test@example.com');
  });

  test('debería lanzar error con email inválido - sin @', () => {
    expect(() => new Email('emailinvalido')).toThrow('Email inválido');
  });

  test('debería lanzar error con email inválido - sin dominio', () => {
    expect(() => new Email('test@')).toThrow('Email inválido');
  });

  test('debería comparar dos emails iguales', () => {
    const email1 = new Email('test@example.com');
    const email2 = new Email('test@example.com');
    expect(email1.equals(email2)).toBe(true);
  });

  test('debería detectar emails diferentes', () => {
    const email1 = new Email('test1@example.com');
    const email2 = new Email('test2@example.com');
    expect(email1.equals(email2)).toBe(false);
  });
});