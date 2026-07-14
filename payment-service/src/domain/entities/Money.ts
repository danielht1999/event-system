/**
 * Value object Money 
 * Internamente SIEMPRE en centavos enteros — nunca pesos con decimales, nunca float
 * salvo en el borde de fromPesos/toPesos.
 */
import { InvalidMoneyError } from '../errors/InvalidMoneyError';

export class Money {
  private constructor(
    private readonly _amountCents: number,
    private readonly _currency: string,
  ) {
    if (!Number.isInteger(_amountCents) || _amountCents < 0) {
      throw new InvalidMoneyError('Money: amountCents debe ser un entero >= 0');
    }
    if (!_currency || _currency.trim().length === 0) {
      throw new InvalidMoneyError('Money: currency es requerida');
    }
  }

  static fromCents(amountCents: number, currency: string): Money {
    return new Money(amountCents, currency);
  }

  static fromPesos(pesos: number, currency: string): Money {
    return new Money(Math.round(pesos * 100), currency);
  }

  get amountCents(): number {
    return this._amountCents;
  }

  get currency(): string {
    return this._currency;
  }

  toPesos(): number {
    return this._amountCents / 100;
  }

  equals(other: Money): boolean {
    return this._amountCents === other._amountCents && this._currency === other._currency;
  }
}