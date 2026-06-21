// src/modules/payment/domain/entities/Payment.test.ts
import { v4 as uuidv4 } from 'uuid';
import { Payment } from './Payment';
import { ValidationError } from '@shared/domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';

describe('Payment', () => {
  const reservationId = uuidv4();
  const usuarioId = uuidv4();          // Agregado para cumplir con el contrato actual
  const moneda = 'USD';                // Agregado para cumplir con el contrato actual

  describe('create()', () => {
    test('debe crear un pago pendiente', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,                     // Inyección requerida
        monto: 500,
        moneda                         // Inyección requerida
      });

      expect(payment.estado).toBe('PENDIENTE');
      expect(payment.monto).toBe(500);
      expect(payment.moneda).toBe('USD');
      expect(payment.reservationId).toBe(reservationId);
      expect(payment.usuarioId).toBe(usuarioId);
    });

    test('no debe permitir montos negativos', () => {
      expect(() =>
        Payment.create({
          id: uuidv4(),
          reservationId,
          usuarioId,
          monto: -1,
          moneda
        })
      ).toThrow(ValidationError);
    });

    test('no debe permitir monto cero', () => {
      expect(() =>
        Payment.create({
          id: uuidv4(),
          reservationId,
          usuarioId,
          monto: 0,
          moneda
        })
      ).toThrow(ValidationError);
    });

    test('no debe permitir crear un pago sin especificar la moneda', () => {
      expect(() =>
        new Payment(uuidv4(), reservationId, usuarioId, 500, '', 'PENDIENTE')
      ).toThrow(ValidationError);
    });
  });

  describe('aprobar()', () => {
    test('debe aprobar un pago pendiente', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.aprobar();

      expect(payment.estado).toBe('APROBADO');
    });

    test('debe generar evento de dominio con la carga de datos completa', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.aprobar();

      const events = payment.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe(DomainEventNames.PAYMENT.APPROVED);
      expect(events[0].data).toEqual({
        paymentId: payment.id,
        reservationId: payment.reservationId,
        usuarioId: payment.usuarioId,   // Verificación de integridad estructural
        monto: 500,
        moneda: 'USD'
      });
    });

    test('no debe aprobar dos veces', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.aprobar();

      expect(() => payment.aprobar()).toThrow(ValidationError);
    });
  });

  describe('rechazar()', () => {
    test('debe rechazar un pago pendiente', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.rechazar();

      expect(payment.estado).toBe('RECHAZADO');
    });

    test('no debe rechazar un pago aprobado', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.aprobar();

      expect(() => payment.rechazar()).toThrow(ValidationError);
    });
  });

  describe('reembolsar()', () => {
    test('debe reembolsar un pago aprobado', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.aprobar();
      payment.reembolsar();

      expect(payment.estado).toBe('REEMBOLSADO');
    });

    test('debe generar evento de dominio al reembolsar', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.aprobar();
      payment.pullDomainEvents(); // Limpiamos el evento de aprobación previo

      payment.reembolsar();

      const events = payment.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe(DomainEventNames.PAYMENT.REFUNDED);
      expect(events[0].data).toEqual({
        paymentId: payment.id,
        reservationId: payment.reservationId,
        usuarioId: payment.usuarioId,
        monto: 500,
        moneda: 'USD'
      });
    });

    test('no debe reembolsar un pago pendiente', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      expect(() => payment.reembolsar()).toThrow(ValidationError);
    });

    test('no debe reembolsar un pago rechazado', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.rechazar();

      expect(() => payment.reembolsar()).toThrow(ValidationError);
    });
  });

  describe('pullDomainEvents()', () => {
    test('debe vaciar los eventos después de extraerlos', () => {
      const payment = Payment.create({
        id: uuidv4(),
        reservationId,
        usuarioId,
        monto: 500,
        moneda
      });

      payment.aprobar();

      expect(payment.pullDomainEvents()).toHaveLength(1);
      expect(payment.pullDomainEvents()).toHaveLength(0);
    });
  });
});