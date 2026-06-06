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
    expect(() => {
      event.reservar(2);
    }).toThrow('No hay suficiente capacidad disponible o el evento no está publicado');
  });

  test('debería permitir reservar hasta 4 tickets si está publicado', () => {
    event.publicar(); // Cambiamos el estado a PUBLICADA para permitir operaciones
    
    expect(() => event.reservar(4)).not.toThrow();
    expect(event.reservasPendientes).toBe(4);
  });

  test('no debería permitir más de 4 tickets por persona', () => {
    event.publicar();

    expect(() => {
      event.reservar(5);
    }).toThrow('Máximo 4 tickets por persona');
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
    
    // El cupo número 101 debe disparar la excepción tajante de negocio
    expect(() => {
      event.reservar(1);
    }).toThrow('No hay suficiente capacidad disponible o el evento no está publicado');
  });

  test('debería permitir reservas múltiples y confirmarlas balanceando los estados', () => {
    event.publicar();

    event.reservar(2);
    event.reservar(3);
    expect(event.cuposDisponibles).toBe(95);
    expect(event.reservasPendientes).toBe(5);
    
    event.confirmarReserva(2);
    // Los cupos disponibles se mantienen igual porque pasaron de pendientes a confirmados
    expect(event.cuposDisponibles).toBe(95); 
    expect(event.reservasPendientes).toBe(3);
    expect(event.reservasConfirmadas).toBe(2);
  });

  test('no debería permitir confirmar más reservas de las que están pendientes', () => {
    event.publicar();
    event.reservar(2);

    expect(() => {
      event.confirmarReserva(3);
    }).toThrow('No puedes confirmar más reservas de las que están pendientes');
  });
});