import { Evento } from '../../../src/domain/entities/Evento';
import { Capacidad } from '../../../src/domain/value-objects/Capacidad';
import { FechaEvento } from '../../../src/domain/value-objects/FechaEvento';

describe('Evento', () => {
  let evento: Evento;
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 30);

  beforeEach(() => {
    evento = new Evento(
      '1',
      'org-123',
      'Conferencia DevOps',
      'La mejor conferencia de DevOps',
      'Centro de Convenciones',
      new FechaEvento(fechaFutura),
      new Capacidad(100),
      50,
      'PUBLICADO'
    );
  });

  test('debería permitir reservar hasta 4 tickets', () => {
    const resultado = evento.reservar(4);
    expect(resultado.exitosa).toBe(true);
  });

  test('no debería permitir más de 4 tickets por persona', () => {
    const resultado = evento.reservar(5);
    expect(resultado.exitosa).toBe(false);
    expect(resultado.razon).toBe('Máximo 4 tickets por persona');
  });

  test('debería actualizar cupos disponibles después de reserva', () => {
    evento.reservar(2);
    expect(evento.cuposDisponibles).toBe(98);
  });

  test('no debería permitir reserva cuando no hay cupo', () => {
    for (let i = 0; i < 25; i++) {
      const result = evento.reservar(4);
      expect(result.exitosa).toBe(true);
    }
    
    expect(evento.cuposDisponibles).toBe(0);
    
    const resultadoFinal = evento.reservar(1);
    expect(resultadoFinal.exitosa).toBe(false);
    expect(resultadoFinal.razon).toBe('No hay suficiente capacidad');
  });

  test('debería permitir reservas múltiples y confirmarlas', () => {
    evento.reservar(2);
    evento.reservar(3);
    expect(evento.cuposDisponibles).toBe(95);
    
    evento.confirmarReserva(2);
    expect(evento.cuposDisponibles).toBe(95);
  });
});