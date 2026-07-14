import { CreatePaymentHandler } from '../../../src/application/commands/CreatePaymentHandler';
import { CreatePaymentCommand } from '../../../src/application/commands/CreatePaymentCommand';
import { IdempotencyConflictError } from '../../../src/domain/errors';
import { InMemoryPaymentRepository } from '../../support/InMemoryPaymentRepository';
import { FakeUnitOfWork, FakePaymentGateway } from '../../support/fakes';

function buildHandler() {
  const repo = new InMemoryPaymentRepository();
  const gateway = new FakePaymentGateway();
  const handler = new CreatePaymentHandler(new FakeUnitOfWork(), repo, gateway);
  return { repo, gateway, handler };
}

const baseCommand = () =>
  new CreatePaymentCommand('res_1', 'user_1', 15000, 'MXN', 'reservation:res_1');

describe('CreatePaymentHandler', () => {
  it('crea un Payment PENDIENTE y devuelve paymentId + clientSecret', async () => {
    const { handler, repo } = buildHandler();
    const result = await handler.execute(baseCommand());

    expect(result.status).toBe('PENDIENTE');
    expect(result.clientSecret).toContain('secret');
    expect(repo.count()).toBe(1);
  });

  it('nunca recalcula el monto: usa amountCents tal cual llega (regla de oro #6)', async () => {
    const { handler, gateway } = buildHandler();
    await handler.execute(new CreatePaymentCommand('res_1', 'user_1', 99999, 'MXN', 'reservation:res_1'));

    expect(gateway.calls[0].money.amountCents).toBe(99999);
  });

  it('idempotencia: mismo Idempotency-Key + mismo body → mismo paymentId, no crea un segundo Payment', async () => {
    const { handler, repo, gateway } = buildHandler();
    const first = await handler.execute(baseCommand());
    const second = await handler.execute(baseCommand());

    expect(second.paymentId).toBe(first.paymentId);
    expect(repo.count()).toBe(1);
    expect(gateway.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('idempotencia: mismo Idempotency-Key + body distinto → 409 IdempotencyConflictError', async () => {
    const { handler } = buildHandler();
    await handler.execute(baseCommand());

    const conflicting = new CreatePaymentCommand('res_1', 'user_1', 1, 'MXN', 'reservation:res_1');
    await expect(handler.execute(conflicting)).rejects.toThrow(IdempotencyConflictError);
  });

  it('idempotencia: mismo key sobre un Payment ya resuelto (no PENDIENTE) → 409', async () => {
    const { handler, repo } = buildHandler();
    const result = await handler.execute(baseCommand());
    const payment = await repo.findById(result.paymentId);
    payment!.aprobar(payment!.providerReference!);
    await repo.save(payment!);

    await expect(handler.execute(baseCommand())).rejects.toThrow(IdempotencyConflictError);
  });
});