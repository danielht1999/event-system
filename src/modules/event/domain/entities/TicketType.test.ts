// src/modules/event/domain/entities/TicketType.test.ts
import { TicketType } from './TicketType';
import { ValidationError } from '@shared/domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
// Nota: Si creas errores específicos en tu barril de errores, puedes importarlos aquí. 
// Por ahora usamos ValidationError según el comportamiento de la entidad provista.

describe('TicketType', () => {
  let ticketType: TicketType;

  beforeEach(() => {
    ticketType = new TicketType(
      'ticket-123',                 // id
      'event-456',                 // eventId
      'Entrada General',           // nombre
      150,                         // precio
      100,                         // capacidadMaxima
      0,                           // reservasPendientes
      0,                           // reservasConfirmadas
      'ACTIVO',                    // estado
      new Date()                   // creadoEn
    );
  });

  test('debería crear un ticket válido con los datos del constructor', () => {
    expect(ticketType.id).toBe('ticket-123');
    expect(ticketType.estado).toBe('ACTIVO');
    expect(ticketType.cuposDisponibles).toBe(100);
  });

  test('no debería permitir un precio negativo', () => {
    expect(() => {
      new TicketType('1', 'e-1', 'Test', -50, 100);
    }).toThrow(ValidationError);
  });

  test('no debería permitir una capacidad máxima igual o menor a cero', () => {
    expect(() => {
      new TicketType('1', 'e-1', 'Test', 50, 0);
    }).toThrow(ValidationError);
  });

  test('no debería permitir reservas pendientes negativas', () => {
    expect(() => {
      new TicketType('1', 'e-1', 'Test', 50, 100, -1);
    }).toThrow(ValidationError);
  });

  test('no debería permitir reservas confirmadas negativas', () => {
    expect(() => {
      new TicketType('1', 'e-1', 'Test', 50, 100, 0, -1);
    }).toThrow(ValidationError);
  });

  test('no debería permitir que la suma de reservas exceda la capacidad máxima', () => {
    expect(() => {
      new TicketType(
        '1', 'e-1', 'Test', 50, 
        10,                        // capacidad máxima
        6,                         // reservasPendientes
        5                          // reservasConfirmadas (6 + 5 = 11 > 10)
      );
    }).toThrow(ValidationError);
  });

  test('debería calcular correctamente los cupos disponibles de forma dinámica', () => {
    const ticketDinamico = new TicketType('1', 'e-1', 'Test', 50, 100, 20, 30);
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
    // Dejamos solo 2 cupos disponibles
    const ticketAjustado = new TicketType('1', 'e-1', 'Test', 50, 10, 8, 0);
    
    expect(() => {
      ticketAjustado.reservar(3);
    }).toThrow(ValidationError);
  });

  test('debería transferir cupos de pendientes a confirmadas al confirmar una reserva', () => {
    // Iniciamos con 10 pendientes
    const ticketConPendientes = new TicketType('1', 'e-1', 'Test', 50, 100, 10, 0);
    
    ticketConPendientes.confirmarReserva(4);
    expect(ticketConPendientes.reservasPendientes).toBe(6);
    expect(ticketConPendientes.reservasConfirmadas).toBe(4);
    expect(ticketConPendientes.cuposDisponibles).toBe(90); // El aforo total ocupado sigue siendo 10
  });

  test('no debería permitir confirmar más reservas de las pendientes existentes', () => {
    const ticketConPendientes = new TicketType('1', 'e-1', 'Test', 50, 100, 5, 0);
    
    expect(() => {
      ticketConPendientes.confirmarReserva(6);
    }).toThrow(ValidationError);
  });

  test('debería restar del inventario pendiente al liberar cupos no pagados', () => {
    const ticketConPendientes = new TicketType('1', 'e-1', 'Test', 50, 100, 10, 0);
    
    ticketConPendientes.liberarPendientes(4);
    expect(ticketConPendientes.reservasPendientes).toBe(6);
    expect(ticketConPendientes.cuposDisponibles).toBe(94);
  });

  test('debería restar del inventario confirmado al procesar devoluciones o cancelaciones', () => {
    const ticketConConfirmadas = new TicketType('1', 'e-1', 'Test', 50, 100, 0, 10);
    
    ticketConConfirmadas.liberarConfirmadas(4);
    expect(ticketConConfirmadas.reservasConfirmadas).toBe(6);
    expect(ticketConConfirmadas.cuposDisponibles).toBe(94);
  });

  test('debería transicionar a AGOTADO y disparar evento de dominio cuando el aforo se llena', () => {
    const ticketPequeño = new TicketType('ticket-123', 'event-456', 'VIP', 50, 5);
    
    ticketPequeño.reservar(5);
    
    expect(ticketPequeño.estado).toBe('AGOTADO');
    expect(ticketPequeño.estaLleno()).toBe(true);

    const eventos = ticketPequeño.pullDomainEvents();
    expect(eventos).toHaveLength(1);
    expect(eventos[0].eventName).toBe(DomainEventNames.TICKET_TYPE.SOLD_OUT);
    expect(eventos[0].data).toEqual({
      ticketTypeId: 'ticket-123',
      eventId: 'event-456'
    });
  });

  test('debería regresar automáticamente a ACTIVO si el estado era AGOTADO y se liberan cupos', () => {
    // Instanciamos un ticket al límite de su capacidad
    const ticketAgotado = new TicketType('1', 'e-1', 'Test', 50, 10, 10, 0, 'AGOTADO');
    
    expect(ticketAgotado.estado).toBe('AGOTADO');
    
    ticketAgotado.liberarPendientes(2);
    expect(ticketAgotado.estado).toBe('ACTIVO');
    expect(ticketAgotado.cuposDisponibles).toBe(2);
  });
});