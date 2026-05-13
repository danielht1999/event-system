import { Evento } from '../../../src/domain/entities/Evento';
import { Capacidad } from '../../../src/domain/value-objects/Capacidad';
import { FechaEvento } from '../../../src/domain/value-objects/FechaEvento';

describe('Evento', () => {
  let evento: Evento;
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 30);

  beforeEach(() => {
    evento = new Evento(
    '1',                                          // id
    'Conferencia DevOps',                         // titulo
    'La mejor conferencia de DevOps',            // descripcion
    FechaEvento.crear(fechaFutura),              // fecha 
    'Centro de Convenciones',                    // lugar
    new Capacidad(100),                           // capacidad
    50,                                           // precio
    'org-123',                                    // organizadorId
    0,                                            // reservasConfirmadas
    0,                                            // reservasPendientes
    'BORRADOR'                                   // estado 
  );
  });

  test('debería permitir reservar hasta 4 tickets', () => {
    const resultado = evento.reservar(4);
    expect(resultado.exitosa).toBe(true);
  });

  test('no deberia permitir mas de 4 tickets por persona', () => {
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