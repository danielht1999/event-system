// src/modules/event/domain/entities/Event.test.ts

import { Event } from './Event';
import { EventNotInDraftError } from '../errors';

describe('Event Aggregate', () => {
  let event: Event;
  let fechaFutura: Date;

  beforeEach(() => {
    fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 30);

    event = Event.create(
      'event-123',
      'Conferencia DevOps 2026',
      'La mejor conferencia de DevOps de la región',
      fechaFutura,
      'Centro de Convenciones',
      500, // capacidadTotal
      'organizador-999'
    );
  });

  test('debería crearse correctamente en estado BORRADOR', () => {
    expect(event.id).toBe('event-123');
    expect(event.estado).toBe('BORRADOR');
    expect(event.titulo).toBe('Conferencia DevOps 2026');
    expect(event.organizadorId).toBe('organizador-999');
    expect(event.capacidadTotal).toBe(500);
    
    const domainEvents = event.pullDomainEvents();
    expect(domainEvents).toHaveLength(1);
    expect(domainEvents[0].eventName).toBe('event.created');
  });

  test('debería reconstruirse correctamente desde el estado histórico sin registrar eventos', () => {
    const eventoReconstruido = Event.reconstruct(
      'historial-1',
      'Evento Pasado',
      'Descripción antigua',
      fechaFutura,
      'Teatro Principal',
      300,
      'organizador-999',
      'PUBLICADA',
      new Date()
    );

    expect(eventoReconstruido.estado).toBe('PUBLICADA');
    expect(eventoReconstruido.pullDomainEvents()).toHaveLength(0);
  });

  test('debería cambiar de estado a PUBLICADA con éxito', () => {
    event.publicar();
    expect(event.estado).toBe('PUBLICADA');
    
    const domainEvents = event.pullDomainEvents();
    expect(domainEvents.some(e => e.eventName === 'event.status_updated')).toBe(true);
  });

  test('debería permitir cancelarse desde cualquier estado', () => {
    event.cancelar();
    expect(event.estado).toBe('CANCELADA');
  });

  test('no debería fallar si se intenta cancelar un evento que ya está CANCELADO', () => {
    event.cancelar();
    expect(() => event.cancelar()).not.toThrow();
  });

  test('debería permitir modificar sus detalles si está en estado BORRADOR', () => {
    event.cambiarDetalles({
      titulo: 'Nuevo Título DevOps',
      lugar: 'Hotel Hilton'
    });

    expect(event.titulo).toBe('Nuevo Título DevOps');
    expect(event.lugar).toBe('Hotel Hilton');
    
    const domainEvents = event.pullDomainEvents();
    expect(domainEvents.some(e => e.eventName === 'event.updated')).toBe(true);
  });

  test('no debería permitir modificar sus detalles si ya no está en BORRADOR', () => {
    event.publicar();

    expect(() => {
      event.cambiarDetalles({ titulo: 'Hackeo de título' });
    }).toThrow(EventNotInDraftError);
  });

  test('debería validar con éxito si la suma de aforos de los tickets no rompe el Value Object Capacity', () => {
    // ✅ CORREGIDO: 200 + 100 + 100 = 400 ≤ 500 (capacidadTotal)
    expect(() => {
      event.validarAforoTotal([200, 100], 100);
    }).not.toThrow();
  });

  test('debería explotar si la suma acumulada de aforos viola los límites de Capacity', () => {
    // ✅ CORREGIDO: 9500 + 600 = 10100 > 500 (capacidadTotal)
    // O usar valores que realmente excedan la capacidad
    expect(() => {
      event.validarAforoTotal([400, 200], 100);
    }).toThrow();
  });
});