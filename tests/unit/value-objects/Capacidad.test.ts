import { Capacity } from '../../../src/modules/event/domain/value-objects/Capacity';

describe('Capacidad', () => {
  test('debería crear capacidad válida', () => {
    const capacidad = new Capacity(100);
    expect(capacidad.value).toBe(100);
  });

  test('debería lanzar error si capacidad es 0', () => {
    expect(() => new Capacity(0)).toThrow('La capacidad debe ser mayor a 0');
  });

  test('debería lanzar error si capacidad es negativa', () => {
    expect(() => new Capacity(-10)).toThrow('La capacidad debe ser mayor a 0');
  });

  test('debería lanzar error si capacidad supera 10000', () => {
    // Cambiar el mensaje esperado para que coincida con tu código
    expect(() => new Capacity(15000)).toThrow('La capacidad no puede superar 10,000 personas');
  });

  test('debería verificar si hay espacio suficiente', () => {
    const capacidad = new Capacity(100);
    expect(capacidad.hasSpace(50, 30)).toBe(true);
    expect(capacidad.hasSpace(90, 20)).toBe(false);
  });
});
