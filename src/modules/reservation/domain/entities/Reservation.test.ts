// src/modules/reservation/domain/entities/Reservation.test.ts

import { Reservation } from './Reservation';
import { ValidationError } from '@shared/domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import {
  ReservationNotPendingError,
  ReservationAlreadyCancelledError,
  ReservationCheckedInError
} from '../errors';

describe('Reservation', () => {
  let reservation: Reservation;

  beforeEach(() => {
    reservation = new Reservation(
      'res-1',
      'evento-1',
      'ticket-type-99',
      'usuario-1',
      2,
      'PENDIENTE_PAGO',
      'TICKET-12345'
    );
  });

  // =========================================================================
  // SECCIÓN: CREACIÓN E INVARIANTES
  // =========================================================================
  describe('creación', () => {
    test('debería crear reserva válida', () => {
      expect(reservation.estado).toBe('PENDIENTE_PAGO');
      expect(reservation.cantidadTickets).toBe(2);
      expect(reservation.ticketTypeId).toBe('ticket-type-99');
    });

    test('deberia asignar fecha de reserva automáticamente', () => {
      const antes = new Date();
      const nuevaReserva = new Reservation(
        'res-2',
        'evento-1',
        'ticket-type-99',
        'usuario-1',
        2,
        'PENDIENTE_PAGO',
        'TICKET-12349'
      );
      const despues = new Date();
      
      expect(nuevaReserva.reservadoEn.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(nuevaReserva.reservadoEn.getTime()).toBeLessThanOrEqual(despues.getTime());
    });

    test('no deberia permitir cantidad menor o igual a cero', () => {
      expect(() => new Reservation(
        'res-3',
        'evento-1',
        'ticket-type-99',
        'usuario-1',
        0,
        'PENDIENTE_PAGO',
        'TICKET-12346'
      )).toThrow(ValidationError);
    });

    test('no deberia permitir mas de 4 tickets', () => {
      expect(() => new Reservation(
        'res-4',
        'evento-1',
        'ticket-type-99',
        'usuario-1',
        5,
        'PENDIENTE_PAGO',
        'TICKET-12347'
      )).toThrow(ValidationError);
    });

    test('deberia tener código de ticket único', () => {
      const reserva1 = new Reservation(
        'res-5', 'evento-1', 'ticket-type-99', 'usuario-1', 2, 'PENDIENTE_PAGO', 'TICKET-UNICO-1'
      );
      const reserva2 = new Reservation(
        'res-6', 'evento-1', 'ticket-type-99', 'usuario-2', 1, 'PENDIENTE_PAGO', 'TICKET-UNICO-2'
      );
      
      expect(reserva1.codigoTicket).not.toBe(reserva2.codigoTicket);
    });

    test('deberia mantener la integridad de los datos', () => {
      const reservationOriginal = new Reservation(
        'res-7',
        'evento-1',
        'ticket-type-99',
        'usuario-1',
        3,
        'PENDIENTE_PAGO',
        'TICKET-12352'
      );
      
      expect(reservationOriginal.id).toBe('res-7');
      expect(reservationOriginal.eventId).toBe('evento-1');
      expect(reservationOriginal.ticketTypeId).toBe('ticket-type-99');
      expect(reservationOriginal.usuarioId).toBe('usuario-1');
      expect(reservationOriginal.cantidadTickets).toBe(3);
      expect(reservationOriginal.codigoTicket).toBe('TICKET-12352');
    });

    test('debería emitir evento RESERVATION.CREATED mediante el Factory .create()', () => {
      const factoryReserva = Reservation.create({
        id: 'res-factory',
        eventId: 'evento-1',
        ticketTypeId: 'ticket-type-99',
        usuarioId: 'usuario-1',
        cantidadTickets: 3,
        codigoTicket: 'TICKET-FACTORY'
      });

      const eventos = factoryReserva.pullDomainEvents();
      expect(eventos).toHaveLength(1);
      expect(eventos[0].eventName).toBe(DomainEventNames.RESERVATION.CREATED);
      expect(eventos[0].data).toEqual({
        reservationId: 'res-factory',
        eventId: 'evento-1',
        ticketTypeId: 'ticket-type-99',
        cantidadTickets: 3
      });
    });
  });

  // =========================================================================
  // SECCIÓN: CONFIRMAR PAGO
  // =========================================================================
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
      expect(() => reservation.confirmarPago()).toThrow(ReservationNotPendingError);
    });

    test('no deberia confirmar pago si esta cancelada', () => {
      reservation.cancelar();
      expect(() => reservation.confirmarPago()).toThrow(ReservationNotPendingError);
    });

    test('no deberia confirmar pago si esta expirada', () => {
      const reservationExpirada = new Reservation(
        'res-8', 'evento-1', 'ticket-type-99', 'usuario-1', 2, 'EXPIRADA', 'TICKET-12348'
      );
      expect(() => reservationExpirada.confirmarPago()).toThrow(ReservationNotPendingError);
    });

    test('no deberia confirmar pago si ya hizo check-in', () => {
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      expect(() => reservation.confirmarPago()).toThrow(ReservationNotPendingError);
    });
  });

  // =========================================================================
  // SECCIÓN: CANCELAR
  // =========================================================================
  describe('cancelar', () => {
    test('deberia cancelar reserva', () => {
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
    });

    test('deberia lanzar error al intentar cancelar una reserva ya cancelada', () => {
      reservation.cancelar();
      expect(() => reservation.cancelar()).toThrow(ReservationAlreadyCancelledError);
    });

    test('no deberia cancelar una reserva con check-in', () => {
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      expect(() => reservation.cancelar()).toThrow(ReservationCheckedInError);
    });

    test('deberia poder cancelar una reserva confirmada', () => {
      reservation.confirmarPago();
      reservation.cancelar();
      expect(reservation.estado).toBe('CANCELADA');
    });

    // ✅ CORREGIDO: Una reserva expirada NO se puede cancelar
    test('NO deberia poder cancelar una reserva expirada', () => {
      const reservationExpirada = new Reservation(
        'res-9', 'evento-1', 'ticket-type-99', 'usuario-1', 2, 'EXPIRADA', 'TICKET-12353'
      );
      expect(() => reservationExpirada.cancelar()).toThrow(ReservationAlreadyCancelledError);
    });
  });

  // =========================================================================
  // SECCIÓN: CHECK-IN
  // =========================================================================
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

    test('no deberia hacer check-in sin confirmar pago (si está pendiente)', () => {
      expect(() => reservation.hacerCheckIn()).toThrow(ReservationNotPendingError);
    });

    test('no deberia hacer check-in si esta cancelada', () => {
      reservation.cancelar();
      expect(() => reservation.hacerCheckIn()).toThrow(ReservationAlreadyCancelledError);
    });

    test('no deberia hacer check-in si esta expirada', () => {
      const reservationExpirada = new Reservation(
        'res-10', 'evento-1', 'ticket-type-99', 'usuario-1', 2, 'EXPIRADA', 'TICKET-12354'
      );
      expect(() => reservationExpirada.hacerCheckIn()).toThrow(ReservationNotPendingError);
    });

    test('no deberia hacer check-in dos veces', () => {
      reservation.confirmarPago();
      reservation.hacerCheckIn();
      expect(() => reservation.hacerCheckIn()).toThrow(ReservationNotPendingError);
    });
  });

  // =========================================================================
  // SECCIÓN: TRANSICIONES Y EVENTOS DE DOMINIO
  // =========================================================================
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
      expect(() => reservation.confirmarPago()).toThrow(ReservationNotPendingError);
      expect(() => reservation.hacerCheckIn()).toThrow(ReservationAlreadyCancelledError);
    });

    test('debería calcular correctamente la bandera `debeLiberarCupos` en el evento de cancelación', () => {
      reservation.cancelar();
      
      const eventos = reservation.pullDomainEvents();
      expect(eventos).toHaveLength(1);
      expect(eventos[0].eventName).toBe(DomainEventNames.RESERVATION.CANCELLED);
      expect(eventos[0].data.debeLiberarCupos).toBe(true); 
    });
  });
});