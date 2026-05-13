// tests/unit/domain/Reserva.test.ts
import { Reserva } from '../../../src/domain/entities/Reserva';

describe('Reserva', () => {
  let reserva: Reserva;

  beforeEach(() => {
    reserva = new Reserva(
      '1',
      'evento-1',
      'usuario-1',
      2,
      'PENDIENTE_PAGO',
      'TICKET-12345'
    );
  });

  describe('creación', () => {
    test('debería crear reserva válida', () => {
      expect(reserva.estado).toBe('PENDIENTE_PAGO');
      expect(reserva.cantidadTickets).toBe(2);
    });

    test('deberia asignar fecha de reserva automáticamente', () => {
      const antes = new Date();
      const nuevaReserva = new Reserva(
        '5',
        'evento-1',
        'usuario-1',
        2,
        'PENDIENTE_PAGO',
        'TICKET-12349'
      );
      const despues = new Date();
      
      expect(nuevaReserva.reservadoEn.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(nuevaReserva.reservadoEn.getTime()).toBeLessThanOrEqual(despues.getTime());
    });

    test('no deberia permitir cantidad negativa', () => {
      expect(() => new Reserva(
        '2',
        'evento-1',
        'usuario-1',
        -1,
        'PENDIENTE_PAGO',
        'TICKET-12346'
      )).toThrow('La cantidad de tickets debe ser mayor a 0');
    });

    test('no deberia permitir mas de 4 tickets', () => {
      expect(() => new Reserva(
        '3',
        'evento-1',
        'usuario-1',
        5,
        'PENDIENTE_PAGO',
        'TICKET-12347'
      )).toThrow('No se pueden reservar mas de 4 tickets por persona');
    });

    test('deberia tener código de ticket único', () => {
      const reserva1 = new Reserva(
        '1',
        'evento-1',
        'usuario-1',
        2,
        'PENDIENTE_PAGO',
        'TICKET-UNICO-1'
      );
      const reserva2 = new Reserva(
        '2',
        'evento-1',
        'usuario-2',
        1,
        'PENDIENTE_PAGO',
        'TICKET-UNICO-2'
      );
      
      expect(reserva1.codigoTicket).not.toBe(reserva2.codigoTicket);
    });

    test('deberia mantener la integridad de los datos', () => {
      const reservaOriginal = new Reserva(
        '8',
        'evento-1',
        'usuario-1',
        3,
        'PENDIENTE_PAGO',
        'TICKET-12352'
      );
      
      expect(reservaOriginal.id).toBe('8');
      expect(reservaOriginal.eventoId).toBe('evento-1');
      expect(reservaOriginal.usuarioId).toBe('usuario-1');
      expect(reservaOriginal.cantidadTickets).toBe(3);
      expect(reservaOriginal.codigoTicket).toBe('TICKET-12352');
    });
  });

  describe('confirmar pago', () => {
    test('debería confirmar pago', () => {
      reserva.confirmarPago();
      expect(reserva.estado).toBe('CONFIRMADA');
      expect(reserva.pagadoEn).toBeDefined();
    });

    test('deberia asignar fecha de pago al confirmar', () => {
      const antes = new Date();
      reserva.confirmarPago();
      const despues = new Date();
      
      expect(reserva.pagadoEn!.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(reserva.pagadoEn!.getTime()).toBeLessThanOrEqual(despues.getTime());
    });

    test('no deberia confirmar pago si ya esta confirmada', () => {
      reserva.confirmarPago();
      expect(() => reserva.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });

    test('no deberia confirmar pago si esta cancelada', () => {
      reserva.cancelar();
      expect(() => reserva.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });

    test('no deberia confirmar pago si esta expirada', () => {
      const reservaExpirada = new Reserva(
        '4',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12348'
      );
      expect(() => reservaExpirada.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });

    test('no deberia confirmar pago si ya hizo check-in', () => {
      reserva.confirmarPago();
      reserva.hacerCheckIn();
      expect(() => reserva.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });
  });

  describe('cancelar', () => {
    test('deberia cancelar reserva', () => {
      reserva.cancelar();
      expect(reserva.estado).toBe('CANCELADA');
    });

    test('deberia permitir cancelar una reserva ya cancelada (idempotencia)', () => {
      reserva.cancelar();
      // No debe lanzar error
      expect(() => reserva.cancelar()).not.toThrow();
      expect(reserva.estado).toBe('CANCELADA');
    });

    test('no deberia cancelar una reserva con check-in', () => {
      reserva.confirmarPago();
      reserva.hacerCheckIn();
      expect(() => reserva.cancelar()).toThrow('No se puede cancelar una reserva ya utilizada');
    });

    test('deberia poder cancelar una reserva confirmada', () => {
      reserva.confirmarPago();
      reserva.cancelar();
      expect(reserva.estado).toBe('CANCELADA');
    });

    test('deberia poder cancelar una reserva expirada', () => {
      const reservaExpirada = new Reserva(
        '9',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12353'
      );
      reservaExpirada.cancelar();
      expect(reservaExpirada.estado).toBe('CANCELADA');
    });
  });

  describe('hacer check-in', () => {
    test('deberia hacer check-in', () => {
      reserva.confirmarPago();
      reserva.hacerCheckIn();
      expect(reserva.estado).toBe('CHECKED_IN');
      expect(reserva.checkedInEn).toBeDefined();
    });

    test('deberia asignar fecha de check-in', () => {
      const antes = new Date();
      reserva.confirmarPago();
      reserva.hacerCheckIn();
      const despues = new Date();
      
      expect(reserva.checkedInEn!.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(reserva.checkedInEn!.getTime()).toBeLessThanOrEqual(despues.getTime());
    });

    test('no deberia hacer check-in sin confirmar pago', () => {
      expect(() => reserva.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in si esta pendiente', () => {
      expect(() => reserva.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in si esta cancelada', () => {
      reserva.cancelar();
      expect(() => reserva.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in si esta expirada', () => {
      const reservaExpirada = new Reserva(
        '10',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12354'
      );
      expect(() => reservaExpirada.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in dos veces', () => {
      reserva.confirmarPago();
      reserva.hacerCheckIn();
      expect(() => reserva.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });
  });

  describe('transiciones de estado', () => {
    test('flujo completo: pendiente -> confirmada -> check-in', () => {
      expect(reserva.estado).toBe('PENDIENTE_PAGO');
      
      reserva.confirmarPago();
      expect(reserva.estado).toBe('CONFIRMADA');
      expect(reserva.pagadoEn).toBeDefined();
      
      reserva.hacerCheckIn();
      expect(reserva.estado).toBe('CHECKED_IN');
      expect(reserva.checkedInEn).toBeDefined();
    });
    
    test('flujo alternativo: pendiente -> cancelada', () => {
      expect(reserva.estado).toBe('PENDIENTE_PAGO');
      
      reserva.cancelar();
      expect(reserva.estado).toBe('CANCELADA');
      expect(() => reserva.confirmarPago()).toThrow();
      expect(() => reserva.hacerCheckIn()).toThrow();
    });

    test('flujo alternativo: pendiente -> confirmada -> cancelada', () => {
      reserva.confirmarPago();
      expect(reserva.estado).toBe('CONFIRMADA');
      
      reserva.cancelar();
      expect(reserva.estado).toBe('CANCELADA');
      expect(() => reserva.hacerCheckIn()).toThrow();
    });

    test('no se puede hacer check-in despues de cancelar', () => {
      reserva.confirmarPago();
      reserva.cancelar();
      expect(() => reserva.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('estado expirada no permite confirmar pago', () => {
      const reservaExpirada = new Reserva(
        '11',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12355'
      );
      expect(() => reservaExpirada.confirmarPago()).toThrow();
      expect(() => reservaExpirada.hacerCheckIn()).toThrow();
    });

    test('cancelar reserva cancelada no cambia el estado', () => {
      reserva.cancelar();
      expect(reserva.estado).toBe('CANCELADA');
      
      reserva.cancelar();
      expect(reserva.estado).toBe('CANCELADA');
    });
  });
});