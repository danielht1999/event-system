// src/modules/event/domain/entities/Event.test.ts

import { Event } from './Event';
import { EventNotInDraftError } from '../errors';
import { DomainError } from '../../../../shared/domain/errors/DomainError';

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
      'organizador-999'
    );
  });

  test('debería crearse correctamente en estado BORRADOR', () => {
    expect(event.id).toBe('event-123');
    expect(event.estado).toBe('BORRADOR');
    expect(event.titulo).toBe('Conferencia DevOps 2026');
    expect(event.organizadorId).toBe('organizador-999');
    
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
    expect(() => {
      event.validarAforoTotal([500, 400], 100);
    }).not.toThrow();
  });

  test('debería explotar si la suma acumulada de aforos viola los límites de Capacity', () => {
  expect(() => {
    event.validarAforoTotal([9500], 600);
  }).toThrow(); // Jest simplemente confirmará que algo falló
});
});