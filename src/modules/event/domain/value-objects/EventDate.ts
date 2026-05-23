// src/modules/event/domain/value-objects/EventDate.ts

export class EventDate {
  private constructor(private readonly _value: Date) {}

  static create(fecha: Date): EventDate {
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha invalida');
    }
    if (fecha < new Date()) {
      throw new Error('No se puede crear un evento en el pasado');
    }
    return new EventDate(fecha);
  }

  static reconstruct(fecha: Date): EventDate {
    return new EventDate(fecha);
  }

  get value(): Date {
    return this._value;
  }

  isToday(): boolean {
    const hoy = new Date();
    return this._value.toDateString() === hoy.toDateString();
  }

  daysUntilEvent(): number {
    const ahora = new Date();
    const diff = this._value.getTime() - ahora.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}