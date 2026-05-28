// src/modules/reservation/domain/entities/Reservation.test.ts
import { Reservation } from './Reservation';

describe('Reservation', () => {
  let reservation: Reservation;

  beforeEach(() => {
    reservation = new Reservation(
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
      expect(reservation.estado).toBe('PENDIENTE_PAGO');
      expect(reservation.cantidadTickets).toBe(2);
    });

    test('deberia asignar fecha de reserva automáticamente', () => {
      const antes = new Date();
      const nuevaReserva = new Reservation(
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
      expect(() => new Reservation(
        '2',
        'evento-1',
        'usuario-1',
        -1,
        'PENDIENTE_PAGO',
        'TICKET-12346'
      )).toThrow('La cantidad de tickets debe ser mayor a 0');
    });

    test('no deberia permitir mas de 4 tickets', () => {
      expect(() => new Reservation(
        '3',
        'evento-1',
        'usuario-1',
        5,
        'PENDIENTE_PAGO',
        'TICKET-12347'
      )).toThrow('No se pueden reservar mas de 4 tickets por persona');
    });

    test('deberia tener código de ticket único', () => {
      const reserva1 = new Reservation(
        '1',
        'evento-1',
        'usuario-1',
        2,
        'PENDIENTE_PAGO',
        'TICKET-UNICO-1'
      );
      const reserva2 = new Reservation(
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
      const reservationOriginal = new Reservation(
        '8',
        'evento-1',
        'usuario-1',
        3,
        'PENDIENTE_PAGO',
        'TICKET-12352'
      );
      
      expect(reservationOriginal.id).toBe('8');
      expect(reservationOriginal.eventoId).toBe('evento-1');
      expect(reservationOriginal.usuarioId).toBe('usuario-1');
      expect(reservationOriginal.cantidadTickets).toBe(3);
      expect(reservationOriginal.codigoTicket).toBe('TICKET-12352');
    });
  });

  describe('confirmar pago', () => {
    test('debería confirmar pago', () => {
      reservation.confirmarPago();
      expect(reservation.estado).toBe('CONFIRMADA');
      expect(reservation.pagadoEn).toBeDefined();
    });

    test('deberia asignar fecha de pago al confirmar', () => {
      const antes = new Date();
      reservation.confirmarPago();
      const despues = new Date();
      
      expect(reservation.pagadoEn!.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(reservation.pagadoEn!.getTime()).toBeLessThanOrEqual(despues.getTime());
    });

    test('no deberia confirmar pago si ya esta confirmada', () => {
      reservation.confirmarPago();
      expect(() => reservation.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });

    test('no deberia confirmar pago si esta cancelada', () => {
      reservation.cancelar();
      expect(() => reservation.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });

    test('no deberia confirmar pago si esta expirada', () => {
      const reservationExpirada = new Reservation(
        '4',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12348'
      );
      expect(() => reservationExpirada.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });

    test('no deberia confirmar pago si ya hizo check-in', () => {
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      expect(() => reservation.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
    });
  });

  describe('cancelar', () => {
    test('deberia cancelar reserva', () => {
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
    });

    test('deberia permitir cancelar una reserva ya cancelada (idempotencia)', () => {
      reservation.cancelar();
      // No debe lanzar error
      expect(() => reservation.cancelar()).not.toThrow();
      expect(reservation.estado).toBe('CANCELADA');
    });

    test('no deberia cancelar una reserva con check-in', () => {
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      expect(() => reservation.cancelar()).toThrow('No se puede cancelar una reserva ya utilizada');
    });

    test('deberia poder cancelar una reserva confirmada', () => {
      reservation.confirmarPago();
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
    });

    test('deberia poder cancelar una reserva expirada', () => {
      const reservationExpirada = new Reservation(
        '9',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12353'
      );
      reservationExpirada.cancelar();
      expect(reservationExpirada.estado).toBe('CANCELADA');
    });
  });

  describe('hacer check-in', () => {
    test('deberia hacer check-in', () => {
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      expect(reservation.estado).toBe('CHECKED_IN');
      expect(reservation.checkedInEn).toBeDefined();
    });

    test('deberia asignar fecha de check-in', () => {
      const antes = new Date();
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      const despues = new Date();
      
      expect(reservation.checkedInEn!.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(reservation.checkedInEn!.getTime()).toBeLessThanOrEqual(despues.getTime());
    });

    test('no deberia hacer check-in sin confirmar pago', () => {
      expect(() => reservation.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in si esta pendiente', () => {
      expect(() => reservation.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in si esta cancelada', () => {
      reservation.cancelar();
      expect(() => reservation.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in si esta expirada', () => {
      const reservationExpirada = new Reservation(
        '10',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12354'
      );
      expect(() => reservationExpirada.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('no deberia hacer check-in dos veces', () => {
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      expect(() => reservation.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });
  });

  describe('transiciones de estado', () => {
    test('flujo completo: pendiente -> confirmada -> check-in', () => {
      expect(reservation.estado).toBe('PENDIENTE_PAGO');
      
      reservation.confirmarPago();
      expect(reservation.estado).toBe('CONFIRMADA');
      expect(reservation.pagadoEn).toBeDefined();
      
      reservation.hacerCheckIn();
      expect(reservation.estado).toBe('CHECKED_IN');
      expect(reservation.checkedInEn).toBeDefined();
    });
    
    test('flujo alternativo: pendiente -> cancelada', () => {
      expect(reservation.estado).toBe('PENDIENTE_PAGO');
      
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
      expect(() => reservation.confirmarPago()).toThrow();
      expect(() => reservation.hacerCheckIn()).toThrow();
    });

    test('flujo alternativo: pendiente -> confirmada -> cancelada', () => {
      reservation.confirmarPago();
      expect(reservation.estado).toBe('CONFIRMADA');
      
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
      expect(() => reservation.hacerCheckIn()).toThrow();
    });

    test('no se puede hacer check-in despues de cancelar', () => {
      reservation.confirmarPago();
      reservation.cancelar();
      expect(() => reservation.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
    });

    test('estado expirada no permite confirmar pago', () => {
      const reservationExpirada = new Reservation(
        '11',
        'evento-1',
        'usuario-1',
        2,
        'EXPIRADA',
        'TICKET-12355'
      );
      expect(() => reservationExpirada.confirmarPago()).toThrow();
      expect(() => reservationExpirada.hacerCheckIn()).toThrow();
    });

    test('cancelar reserva cancelada no cambia el estado', () => {
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
      
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
    });
  });
});