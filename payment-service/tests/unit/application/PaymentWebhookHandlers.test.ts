import { ConfirmPaymentHandler } from '../../../src/application/commands/ConfirmPaymentHandler';
import { ConfirmPaymentCommand } from '../../../src/application/commands/ConfirmPaymentCommand';
import { FailPaymentHandler } from '../../../src/application/commands/FailPaymentHandler';
import { FailPaymentCommand } from '../../../src/application/commands/FailPaymentCommand';
import { PaymentNotFoundError } from '../../../src/domain/errors';
import { PaymentEventTypes } from '../../../src/domain/events/PaymentEventTypes';
import { Payment } from '../../../src/domain/entities/Payment';
import { Money } from '../../../src/domain/entities/Money';
import { InMemoryPaymentRepository } from '../../support/InMemoryPaymentRepository';
import { FakeUnitOfWork, FakeOutboxStore } from '../../support/fakes';

function pendingPaymentWithProviderRef(providerReference = 'pi_abc') {
  return Payment.create({
    id: 'pay_1',
    reservationId: 'res_1',
    usuarioId: 'user_1',
    money: Money.fromCents(15000, 'MXN'),
    idempotencyKey: 'reservation:res_1',
    providerReference,
  });
}

describe('ConfirmPaymentHandler', () => {
  it('aprueba el pago y escribe exactamente 1 evento payment.confirmed al outbox', async () => {
    const repo = new InMemoryPaymentRepository();
    await repo.save(pendingPaymentWithProviderRef());
    const outbox = new FakeOutboxStore();
    const handler = new ConfirmPaymentHandler(new FakeUnitOfWork(), repo, outbox);

    await handler.execute(new ConfirmPaymentCommand('pi_abc'));

    const payment = await repo.findByProviderReference('pi_abc');
    expect(payment!.estado).toBe('APROBADO');
    expect(outbox.appended).toHaveLength(1);
    expect(outbox.appended[0].eventType).toBe(PaymentEventTypes.PAYMENT_CONFIRMED);
    expect(outbox.appended[0].payload).toMatchObject({ paymentId: 'pay_1', reservationId: 'res_1' });
  });

  it('lanza PaymentNotFoundError si no existe ningún Payment con ese providerReference', async () => {
    const repo = new InMemoryPaymentRepository();
    const handler = new ConfirmPaymentHandler(new FakeUnitOfWork(), repo, new FakeOutboxStore());

    await expect(handler.execute(new ConfirmPaymentCommand('pi_inexistente'))).rejects.toThrow(
      PaymentNotFoundError,
    );
  });

  it('idempotente: reentrega del webhook sobre un pago ya APROBADO no reprocesa ni duplica el evento', async () => {
    const repo = new InMemoryPaymentRepository();
    await repo.save(pendingPaymentWithProviderRef());
    const outbox = new FakeOutboxStore();
    const handler = new ConfirmPaymentHandler(new FakeUnitOfWork(), repo, outbox);

    await handler.execute(new ConfirmPaymentCommand('pi_abc'));
    await handler.execute(new ConfirmPaymentCommand('pi_abc')); // reentrega

    expect(outbox.appended).toHaveLength(1);
  });
});

describe('FailPaymentHandler', () => {
  it('rechaza el pago y escribe exactamente 1 evento payment.failed al outbox', async () => {
    const repo = new InMemoryPaymentRepository();
    await repo.save(pendingPaymentWithProviderRef());
    const outbox = new FakeOutboxStore();
    const handler = new FailPaymentHandler(new FakeUnitOfWork(), repo, outbox);

    await handler.execute(new FailPaymentCommand('pi_abc', 'card_declined'));

    const payment = await repo.findByProviderReference('pi_abc');
    expect(payment!.estado).toBe('RECHAZADO');
    expect(outbox.appended).toHaveLength(1);
    expect(outbox.appended[0].eventType).toBe(PaymentEventTypes.PAYMENT_FAILED);
  });

  it('idempotente: reentrega sobre un pago ya RECHAZADO no reprocesa', async () => {
    const repo = new InMemoryPaymentRepository();
    await repo.save(pendingPaymentWithProviderRef());
    const outbox = new FakeOutboxStore();
    const handler = new FailPaymentHandler(new FakeUnitOfWork(), repo, outbox);

    await handler.execute(new FailPaymentCommand('pi_abc', 'card_declined'));
    await handler.execute(new FailPaymentCommand('pi_abc', 'card_declined'));

    expect(outbox.appended).toHaveLength(1);
  });

  it('no-op si el pago ya fue APROBADO (nunca pisa un estado terminal distinto)', async () => {
    const repo = new InMemoryPaymentRepository();
    const payment = pendingPaymentWithProviderRef();
    payment.aprobar('pi_abc');
    payment.pullDomainEvents();
    await repo.save(payment);

    const outbox = new FakeOutboxStore();
    const handler = new FailPaymentHandler(new FakeUnitOfWork(), repo, outbox);
    await handler.execute(new FailPaymentCommand('pi_abc', 'card_declined'));

    const reloaded = await repo.findByProviderReference('pi_abc');
    expect(reloaded!.estado).toBe('APROBADO');
    expect(outbox.appended).toHaveLength(0);
  });
});