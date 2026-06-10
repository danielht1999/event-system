// src/modules/event/domain/entities/Event.test.ts
import { Event } from './Event';
import { Capacity } from '../value-objects/Capacity';
import { EventDate } from '../value-objects/EventDate';
import { ValidationError } from '@shared/domain/errors';
import { 
  EventNotPublishedError, 
  EventCapacityExceededError,
  InvalidReservationQuantityError
} from '../errors'; // Ajusta la ruta relativa hacia tu barril de errores de Event

describe('Event', () => {
  let event: Event;
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 30);

  beforeEach(() => {
    event = new Event(
      '1',                                          // id
      'Conferencia DevOps',                         // titulo
      'La mejor conferencia de DevOps',             // descripcion
      EventDate.create(fechaFutura),                // fecha 
      'Centro de Convenciones',                     // lugar
      new Capacity(100),                            // capacidad
      50,                                           // precio
      'org-123',                                    // organizadorId
      0,                                            // reservasConfirmadas
      0,                                            // reservasPendientes
      'BORRADOR'                                    // estado 
    );
  });

  test('debería cambiar de estado al publicarse con éxito', () => {
    event.publicar();
    expect(event.estado).toBe('PUBLICADA');
  });

  test('no debería permitir reservar si el evento está en BORRADOR', () => {
    // CORRECCIÓN: Lanza el error semántico de estado de publicación
    expect(() => {
      event.reservar(2);
    }).toThrow(EventNotPublishedError);
  });

  test('debería permitir reservar hasta 4 tickets si está publicado', () => {
    event.publicar(); 
    
    expect(() => event.reservar(4)).not.toThrow();
    expect(event.reservasPendientes).toBe(4);
  });

  test('no debería permitir más de 4 tickets por persona', () => {
    event.publicar();

    // CORRECCIÓN: Lanza el error específico por exceder el límite unitario
    expect(() => {
      event.reservar(5);
    }).toThrow(InvalidReservationQuantityError);
  });

  test('debería actualizar cupos disponibles después de reserva', () => {
    event.publicar();
    
    event.reservar(2);
    expect(event.cuposDisponibles).toBe(98);
  });

  test('no debería permitir reserva cuando no hay cupo disponible', () => {
    event.publicar();

    // Llenamos la capacidad total (25 iteraciones * 4 tickets = 100 cupos)
    for (let i = 0; i < 25; i++) {
      event.reservar(4);
    }
    
    expect(event.cuposDisponibles).toBe(0);
    
    // CORRECCIÓN: Al estar publicado pero lleno, arroja la excepción de aforo
    expect(() => {
      event.reservar(1);
    }).toThrow(EventCapacityExceededError);
  });

  test('debería permitir reservas múltiples y confirmarlas balanceando los estados', () => {
    event.publicar();

    event.reservar(2);
    event.reservar(3);
    expect(event.cuposDisponibles).toBe(95);
    expect(event.reservasPendientes).toBe(5);
    
    event.confirmarReserva(2);
    expect(event.cuposDisponibles).toBe(95); 
    expect(event.reservasPendientes).toBe(3);
    expect(event.reservasConfirmadas).toBe(2);
  });

  test('no debería permitir confirmar más reservas de las que están pendientes', () => {
    event.publicar();
    event.reservar(2);

    // CORRECCIÓN: Lanza un ValidationError o la regla semántica correspondiente a la invariante
    expect(() => {
      event.confirmarReserva(3);
    }).toThrow(ValidationError);
  });
});