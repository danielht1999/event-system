// src/modules/event/domain/entities/Event.test.ts
import { Event } from './Event';
import { Capacity } from '../value-objects/Capacity';
import { EventDate } from '../value-objects/EventDate';

describe('Event', () => {
  let event: Event;
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 30);

  beforeEach(() => {
    event = new Event(
      '1',                                          // id
      'Conferencia DevOps',                         // titulo
      'La mejor conferencia de DevOps',            // descripcion
      EventDate.create(fechaFutura),              // fecha 
      'Centro de Convenciones',                    // lugar
      new Capacity(100),                           // capacidad
      50,                                           // precio
      'org-123',                                    // organizadorId
      0,                                            // reservasConfirmadas
      0,                                            // reservasPendientes
      'BORRADOR'                                   // estado 
    );
  });

  test('debería permitir reservar hasta 4 tickets', () => {
    const resultado = event.reservar(4);
    expect(resultado.exitosa).toBe(true);
  });

  test('no deberia permitir mas de 4 tickets por persona', () => {
    const resultado = event.reservar(5);
    expect(resultado.exitosa).toBe(false);
    expect(resultado.razon).toBe('Máximo 4 tickets por persona');
  });

  test('debería actualizar cupos disponibles después de reserva', () => {
    event.reservar(2);
    expect(event.cuposDisponibles).toBe(98);
  });

  test('no debería permitir reserva cuando no hay cupo', () => {
    for (let i = 0; i < 25; i++) {
      const result = event.reservar(4);
      expect(result.exitosa).toBe(true);
    }
    
    expect(event.cuposDisponibles).toBe(0);
    
    const resultadoFinal = event.reservar(1);
    expect(resultadoFinal.exitosa).toBe(false);
    expect(resultadoFinal.razon).toBe('No hay suficiente capacidad');
  });

  test('debería permitir reservas múltiples y confirmarlas', () => {
    event.reservar(2);
    event.reservar(3);
    expect(event.cuposDisponibles).toBe(95);
    
    event.confirmarReserva(2);
    expect(event.cuposDisponibles).toBe(95);
  });
});