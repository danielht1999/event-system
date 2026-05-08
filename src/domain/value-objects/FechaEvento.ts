// src/domain/value-objects/FechaEvento.ts
export class FechaEvento {
  private readonly _value: Date;

  constructor(fecha: Date) {
    if (fecha < new Date()) {
      throw new Error('No se puede crear un evento en el pasado');
    }
    this._value = fecha;
  }

  get value(): Date {
    return this._value;
  }

  esHoy(): boolean {
    const hoy = new Date();
    return this._value.toDateString() === hoy.toDateString();
  }

  faltaParaEvento(): number {
    const ahora = new Date();
    const diff = this._value.getTime() - ahora.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}