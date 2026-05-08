// src/domain/value-objects/Capacidad.ts
export class Capacidad {
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

  hayEspacio(reservasActuales: number, cantidadReservar: number): boolean {
    return reservasActuales + cantidadReservar <= this._value;
  }
}
