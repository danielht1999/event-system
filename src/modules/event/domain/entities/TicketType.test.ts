// src/modules/event/domain/entities/TicketType.test.ts

import { TicketType } from './TicketType';
import { Capacity } from '../value-objects/Capacity';
import { ValidationError } from '@shared/domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';

describe('TicketType', () => {
  let ticketType: TicketType;

  beforeEach(() => {
    ticketType = TicketType.create(
      'ticket-123',
      'event-456',
      'Entrada General',
      150,
      100
    );
  });

  test('debería crear un ticket válido con los datos del constructor', () => {
    expect(ticketType.id).toBe('ticket-123');
    expect(ticketType.estado).toBe('ACTIVO');
    expect(ticketType.cuposDisponibles).toBe(100);
  });

  test('no debería permitir un precio negativo', () => {
    expect(() => {
      TicketType.create('1', 'e-1', 'Test', -50, 100);
    }).toThrow(ValidationError);
  });

  test('no debería permitir una capacidad máxima igual o menor a cero', () => {
    expect(() => {
      TicketType.create('1', 'e-1', 'Test', 50, 0);
    }).toThrow(ValidationError);
  });

  test('no debería permitir reservas pendientes negativas al reconstruir', () => {
    expect(() => {
      const capacidad = new Capacity(100);
      TicketType.reconstruct(
        '1',
        'e-1',
        'Test',
        50,
        capacidad,
        -1,
        0,
        'ACTIVO',
        new Date()
      );
    }).toThrow(ValidationError);
  });

  test('no debería permitir reservas confirmadas negativas al reconstruir', () => {
    expect(() => {
      const capacidad = new Capacity(100);
      TicketType.reconstruct(
        '1',
        'e-1',
        'Test',
        50,
        capacidad,
        0,
        -1,
        'ACTIVO',
        new Date()
      );
    }).toThrow(ValidationError);
  });

  test('no debería permitir que la suma de reservas exceda la capacidad máxima al reconstruir', () => {
    expect(() => {
      const capacidad = new Capacity(10);
      TicketType.reconstruct(
        '1',
        'e-1',
        'Test',
        50,
        capacidad,
        6,
        5,
        'ACTIVO',
        new Date()
      );
    }).toThrow(ValidationError);
  });

  test('debería calcular correctamente los cupos disponibles de forma dinámica', () => {
    const capacidad = new Capacity(100);
    const ticketDinamico = TicketType.reconstruct(
      '1',
      'e-1',
      'Test',
      50,
      capacidad,
      20,
      30,
      'ACTIVO',
      new Date()
    );
    expect(ticketDinamico.cuposDisponibles).toBe(50);
  });

  test('debería incrementar las reservas pendientes al reservar con éxito', () => {
    ticketType.reservar(5);
    expect(ticketType.reservasPendientes).toBe(5);
    expect(ticketType.cuposDisponibles).toBe(95);
  });

  test('no debería permitir reservar si el tipo de ticket está DESACTIVADO', () => {
    ticketType.desactivar();
    expect(() => {
      ticketType.reservar(2);
    }).toThrow(ValidationError);
  });

  test('no debería permitir reservar una cantidad menor o igual a cero', () => {
    expect(() => {
      ticketType.reservar(0);
    }).toThrow(ValidationError);
  });

  test('no debería permitir reservar si la cantidad supera los cupos disponibles', () => {
    const capacidad = new Capacity(10);
    const ticketAjustado = TicketType.reconstruct(
      '1',
      'e-1',
      'Test',
      50,
      capacidad,
      8,
      0,
      'ACTIVO',
      new Date()
    );
    
    expect(() => {
      ticketAjustado.reservar(3);
    }).toThrow(ValidationError);
  });

  test('debería transferir cupos de pendientes a confirmadas al confirmar una reserva', () => {
    const capacidad = new Capacity(100);
    const ticketConPendientes = TicketType.reconstruct(
      '1',
      'e-1',
      'Test',
      50,
      capacidad,
      10,
      0,
      'ACTIVO',
      new Date()
    );
    
    ticketConPendientes.confirmarReserva(4);
    expect(ticketConPendientes.reservasPendientes).toBe(6);
    expect(ticketConPendientes.reservasConfirmadas).toBe(4);
    expect(ticketConPendientes.cuposDisponibles).toBe(90);
  });

  test('no debería permitir confirmar más reservas de las pendientes existentes', () => {
    const capacidad = new Capacity(100);
    const ticketConPendientes = TicketType.reconstruct(
      '1',
      'e-1',
      'Test',
      50,
      capacidad,
      5,
      0,
      'ACTIVO',
      new Date()
    );
    
    expect(() => {
      ticketConPendientes.confirmarReserva(6);
    }).toThrow(ValidationError);
  });

  test('debería restar del inventario pendiente al liberar cupos no pagados', () => {
    const capacidad = new Capacity(100);
    const ticketConPendientes = TicketType.reconstruct(
      '1',
      'e-1',
      'Test',
      50,
      capacidad,
      10,
      0,
      'ACTIVO',
      new Date()
    );
    
    ticketConPendientes.liberarPendientes(4);
    expect(ticketConPendientes.reservasPendientes).toBe(6);
    expect(ticketConPendientes.cuposDisponibles).toBe(94);
  });

  test('debería restar del inventario confirmado al procesar devoluciones o cancelaciones', () => {
    const capacidad = new Capacity(100);
    const ticketConConfirmadas = TicketType.reconstruct(
      '1',
      'e-1',
      'Test',
      50,
      capacidad,
      0,
      10,
      'ACTIVO',
      new Date()
    );
    
    ticketConConfirmadas.liberarConfirmadas(4);
    expect(ticketConConfirmadas.reservasConfirmadas).toBe(6);
    expect(ticketConConfirmadas.cuposDisponibles).toBe(94);
  });

  test('debería transicionar a AGOTADO y disparar evento de dominio cuando el aforo se llena', () => {
    const ticketPequeño = TicketType.create(
      'ticket-123',
      'event-456',
      'VIP',
      50,
      5
    );
    
    // Limpiar eventos de creación
    ticketPequeño.pullDomainEvents();
    
    ticketPequeño.reservar(5);
    
    expect(ticketPequeño.estado).toBe('AGOTADO');
    expect(ticketPequeño.estaLleno()).toBe(true);

    const eventos = ticketPequeño.pullDomainEvents();
    expect(eventos.length).toBe(1); // Solo SOLD_OUT
    
    const soldOutEvent = eventos.find(e => e.eventName === DomainEventNames.TICKET_TYPE.SOLD_OUT);
    expect(soldOutEvent).toBeDefined();
    
    // ✅ CORREGIDO: Payload completo del evento SOLD_OUT
    expect(soldOutEvent?.data).toEqual({
      ticketTypeId: 'ticket-123',
      eventId: 'event-456',
      nombre: 'VIP',
      precio: 50,
      capacidadMaxima: 5,
      reservasPendientes: 5,
      reservasConfirmadas: 0,
      estado: 'AGOTADO'
    });
  });

  test('debería regresar automáticamente a ACTIVO si el estado era AGOTADO y se liberan cupos', () => {
    const capacidad = new Capacity(10);
    const ticketAgotado = TicketType.reconstruct(
      '1',
      'e-1',
      'Test',
      50,
      capacidad,
      10,
      0,
      'AGOTADO',
      new Date()
    );
    
    expect(ticketAgotado.estado).toBe('AGOTADO');
    
    ticketAgotado.liberarPendientes(2);
    expect(ticketAgotado.estado).toBe('ACTIVO');
    expect(ticketAgotado.cuposDisponibles).toBe(2);
  });
});