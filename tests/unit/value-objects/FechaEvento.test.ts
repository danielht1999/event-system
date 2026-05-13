import { FechaEvento } from '../../../src/domain/value-objects/FechaEvento';

describe('FechaEvento', () => {
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 30);

  const fechaPasada = new Date();
  fechaPasada.setDate(fechaPasada.getDate() - 30);

  describe('crear()', () => {
    test('fecha futura válida', () => {
      const fecha = FechaEvento.crear(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.value).toEqual(fechaFutura);

      expect(fecha.value.getTime()).toBeGreaterThan(Date.now());
    });

    test('fecha pasada', () => {
      expect(() => FechaEvento.crear(fechaPasada)).toThrow('No se puede crear un evento en el pasado');
    });

    test('fecha inválida', () => {
      const fechaInvalida = new Date('2025-13-45');

      expect(() => FechaEvento.crear(fechaInvalida)).toThrow('Fecha invalida');
    });
  });

  describe('reconstruir()', () => {
    test('fecha pasada', () => {
      const fecha = FechaEvento.reconstruir(fechaPasada);

      expect(fecha).toBeDefined();
      expect(fecha.value).toEqual(fechaPasada);
    });

    test('fecha futura', () => {
      const fecha = FechaEvento.reconstruir(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.value.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('esHoy()', () => {
    test('fecha de hoy', () => {
      const fecha = FechaEvento.reconstruir(new Date());

      expect(fecha).toBeDefined();
      expect(fecha.esHoy()).toBe(true);
    });

    test('fecha futura', () => {
      const fecha = FechaEvento.crear(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.esHoy()).toBe(false);
    });
  });

  describe('faltaParaEvento()', () => {
    test('evento en 30 días', () => {
      const fecha = FechaEvento.crear(fechaFutura);

      expect(fecha).toBeDefined();
      expect(fecha.faltaParaEvento()).toEqual(30);
    });

    test('evento en 1 día ', () => {
      const fechaManana = new Date();
      fechaManana.setDate(fechaManana.getDate() + 1);
      const fecha = FechaEvento.crear(fechaManana);

      expect(fecha).toBeDefined();
      expect(fecha.faltaParaEvento()).toEqual(1);
    });
    
  });
});