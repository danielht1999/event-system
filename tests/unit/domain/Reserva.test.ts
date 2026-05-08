// tests/unit/domain/Reserva.test.ts
import { Reserva } from '../../../src/domain/entities/Reserva';

describe('Reserva', () => {
  let reserva: Reserva;

  beforeEach(() => {
    reserva = new Reserva(
      '1',
      'evento-1',
      'usuario-1',
      2,
      'PENDIENTE_PAGO',
      'TICKET-12345'
    );
  });

  test('debería crear reserva válida', () => {
    expect(reserva.estado).toBe('PENDIENTE_PAGO');
    expect(reserva.cantidadTickets).toBe(2);
  });

  test('no debería permitir cantidad negativa', () => {
    expect(() => new Reserva(
      '2',
      'evento-1',
      'usuario-1',
      -1,
      'PENDIENTE_PAGO',
      'TICKET-12346'
    )).toThrow('La cantidad de tickets debe ser mayor a 0');
  });

  test('no debería permitir más de 4 tickets', () => {
    expect(() => new Reserva(
      '3',
      'evento-1',
      'usuario-1',
      5,
      'PENDIENTE_PAGO',
      'TICKET-12347'
    )).toThrow('No se pueden reservar más de 4 tickets por persona');
  });

  test('debería confirmar pago', () => {
    reserva.confirmarPago();
    expect(reserva.estado).toBe('CONFIRMADA');
    expect(reserva.pagadoEn).toBeDefined();
  });

  test('no debería confirmar pago si ya está confirmada', () => {
    reserva.confirmarPago();
    expect(() => reserva.confirmarPago()).toThrow('Solo se pueden confirmar reservas en estado pendiente');
  });

  test('debería cancelar reserva', () => {
    reserva.cancelar();
    expect(reserva.estado).toBe('CANCELADA');
  });

  test('debería hacer check-in', () => {
    reserva.confirmarPago();
    reserva.hacerCheckIn();
    expect(reserva.estado).toBe('CHECKED_IN');
    expect(reserva.checkedInEn).toBeDefined();
  });

  test('no debería hacer check-in sin confirmar pago', () => {
    expect(() => reserva.hacerCheckIn()).toThrow('Solo se puede hacer check-in de reservas confirmadas');
  });
});