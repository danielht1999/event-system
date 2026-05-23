// src/modules/event/domain/value-objects/Capacity.ts
export class Capacity {
  private readonly _value: number;

  constructor(capacidad: number) {
    if (capacidad <= 0) {
      throw new Error('La capacidad debe ser mayor a 0');
    }
    if (capacidad > 10000) {
      throw new Error('La capacidad no puede superar 10,000 personas');
    }
    this._value = capacidad;
  }

  get value(): number {
    return this._value;
  }

  hasSpace(reservasActuales: number, cantidadReservar: number): boolean {
    return reservasActuales + cantidadReservar <= this._value;
  }
}