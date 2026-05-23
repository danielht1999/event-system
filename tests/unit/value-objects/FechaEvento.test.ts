import { EventDate } from '../../../src/modules/event/domain/value-objects/EventDate';

describe('FechaEvento', () => {
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 30);

  const fechaPasada = new Date();
  fechaPasada.setDate(fechaPasada.getDate() - 30);

  describe('crear()', () => {
    test('fecha futura válida', () => {
      const fecha = EventDate.create(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.value).toEqual(fechaFutura);

      expect(fecha.value.getTime()).toBeGreaterThan(Date.now());
    });

    test('fecha pasada', () => {
      expect(() => EventDate.create(fechaPasada)).toThrow('No se puede crear un evento en el pasado');
    });

    test('fecha inválida', () => {
      const fechaInvalida = new Date('2025-13-45');

      expect(() => EventDate.create(fechaInvalida)).toThrow('Fecha invalida');
    });
  });

  describe('reconstruir()', () => {
    test('fecha pasada', () => {
      const fecha = EventDate.reconstruct(fechaPasada);

      expect(fecha).toBeDefined();
      expect(fecha.value).toEqual(fechaPasada);
    });

    test('fecha futura', () => {
      const fecha = EventDate.reconstruct(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.value.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('esHoy()', () => {
    test('fecha de hoy', () => {
      const fecha = EventDate.reconstruct(new Date());

      expect(fecha).toBeDefined();
      expect(fecha.isToday()).toBe(true);
    });

    test('fecha futura', () => {
      const fecha = EventDate.create(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.isToday()).toBe(false);
    });
  });

  describe('faltaParaEvento()', () => {
    test('evento en 30 días', () => {
      const fecha = EventDate.create(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.daysUntilEvent()).toEqual(30);
    });

    test('evento en 1 día ', () => {
      const fechaManana = new Date();
      fechaManana.setDate(fechaManana.getDate() + 1);
      const fecha = EventDate.create(fechaManana);

      expect(fecha).toBeDefined();
      expect(fecha.daysUntilEvent()).toEqual(1);
    });
    
  });
});