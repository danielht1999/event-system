import { Payment } from '../../../src/domain/entities/Payment';
import { Money } from '../../../src/domain/entities/Money';
import { InvalidPaymentStateError, NotImplementedError } from '../../../src/domain/errors';
import { DomainEventNames } from '../../../src/domain/events/DomainEventNames';

function newPendingPayment(): Payment {
  return Payment.create({
    id: 'pay_1',
    reservationId: 'res_1',
    usuarioId: 'user_1',
    money: Money.fromCents(15000, 'MXN'),
    idempotencyKey: 'reservation:res_1',
  });
}

describe('Payment', () => {
  it('nace en estado PENDIENTE y sin eventos de dominio', () => {
    const payment = newPendingPayment();
    expect(payment.estado).toBe('PENDIENTE');
    expect(payment.pullDomainEvents()).toHaveLength(0);
  });

  it('aprobar() PENDIENTE→APROBADO emite PAYMENT.APPROVED', () => {
    const payment = newPendingPayment();
    payment.aprobar('pi_123');

    expect(payment.estado).toBe('APROBADO');
    expect(payment.providerReference).toBe('pi_123');

    const events = payment.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe(DomainEventNames.PAYMENT.APPROVED);
  });

  it('rechazar() PENDIENTE→RECHAZADO emite PAYMENT.REJECTED (corrige el gap del monolito)', () => {
    const payment = newPendingPayment();
    payment.rechazar('card_declined');

    expect(payment.estado).toBe('RECHAZADO');
    const events = payment.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe(DomainEventNames.PAYMENT.REJECTED);
  });

  it('no permite aprobar un pago que no está PENDIENTE', () => {
    const payment = newPendingPayment();
    payment.aprobar('pi_123');
    expect(() => payment.aprobar('pi_456')).toThrow(InvalidPaymentStateError);
  });

  it('no permite rechazar un pago que no está PENDIENTE', () => {
    const payment = newPendingPayment();
    payment.rechazar('card_declined');
    expect(() => payment.rechazar('unknown')).toThrow(InvalidPaymentStateError);
  });

  it('no permite aprobar un pago ya rechazado', () => {
    const payment = newPendingPayment();
    payment.rechazar('card_declined');
    expect(() => payment.aprobar('pi_123')).toThrow(InvalidPaymentStateError);
  });

  it('reembolsar() sobre un pago no aprobado lanza InvalidPaymentStateError', () => {
    const payment = newPendingPayment();
    expect(() => payment.reembolsar()).toThrow(InvalidPaymentStateError);
  });

  it('reembolsar() sobre un pago aprobado lanza NotImplementedError (regla 10, no atajos temporales)', () => {
    const payment = newPendingPayment();
    payment.aprobar('pi_123');
    expect(() => payment.reembolsar()).toThrow(NotImplementedError);
  });

  it('pullDomainEvents() vacía la lista tras leerla', () => {
    const payment = newPendingPayment();
    payment.aprobar('pi_123');
    expect(payment.pullDomainEvents()).toHaveLength(1);
    expect(payment.pullDomainEvents()).toHaveLength(0);
  });

  it('providerReference se puede fijar desde la creación (para que el webhook lo encuentre)', () => {
    const payment = Payment.create({
      id: 'pay_2',
      reservationId: 'res_2',
      usuarioId: 'user_1',
      money: Money.fromCents(1000, 'MXN'),
      idempotencyKey: 'reservation:res_2',
      providerReference: 'pi_preasignado',
    });
    expect(payment.providerReference).toBe('pi_preasignado');
    expect(payment.estado).toBe('PENDIENTE');
  });
});