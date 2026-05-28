// src/modules/event/domain/value-objects/Capacity.test.ts
import { Capacity } from './Capacity';

describe('Capacity', () => {
  test('debería crear capacidad válida', () => {
    const capacity = new Capacity(100);
    expect(capacity.value).toBe(100);
  });

  test('debería lanzar error si capacidad es 0', () => {
    expect(() => new Capacity(0)).toThrow('La capacidad debe ser mayor a 0');
  });

  test('debería lanzar error si capacidad es negativa', () => {
    expect(() => new Capacity(-10)).toThrow('La capacidad debe ser mayor a 0');
  });

  test('debería lanzar error si capacidad supera 10000', () => {
    expect(() => new Capacity(15000)).toThrow('La capacidad no puede superar 10,000 personas');
  });

  test('debería verificar si hay espacio suficiente', () => {
    const capacity = new Capacity(100);
    expect(capacity.hasSpace(50, 30)).toBe(true);
    expect(capacity.hasSpace(90, 20)).toBe(false);
  });
});