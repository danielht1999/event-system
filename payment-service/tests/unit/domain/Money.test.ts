import { Money } from '../../../src/domain/entities/Money';
import { InvalidMoneyError } from '../../../src/domain/errors';

describe('Money', () => {
  it('fromPesos convierte a centavos redondeando', () => {
    const money = Money.fromPesos(150.5, 'MXN');
    expect(money.amountCents).toBe(15050);
  });

  it('toPesos es el inverso de fromPesos', () => {
    const money = Money.fromCents(15050, 'MXN');
    expect(money.toPesos()).toBe(150.5);
  });

  it('rechaza montos negativos', () => {
    expect(() => Money.fromCents(-1, 'MXN')).toThrow(InvalidMoneyError);
  });

  it('rechaza montos no enteros', () => {
    expect(() => Money.fromCents(1.5, 'MXN')).toThrow(InvalidMoneyError);
  });

  it('rechaza currency vacía', () => {
    expect(() => Money.fromCents(100, '')).toThrow(InvalidMoneyError);
  });

  it('equals compara monto y moneda', () => {
    const a = Money.fromCents(100, 'MXN');
    const b = Money.fromCents(100, 'MXN');
    const c = Money.fromCents(100, 'USD');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});