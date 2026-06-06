// src/modules/event/domain/value-objects/EventDate.ts

export class EventDate {
  private constructor(private readonly _value: Date) {}

  static create(fecha: Date): EventDate {
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha invalida');
    }

    // Normalizamos ambas fechas a medianoche (00:00:00) para comparar puramente días de calendario
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaAValidar = new Date(fecha.getTime());
    fechaAValidar.setHours(0, 0, 0, 0);

    if (fechaAValidar < hoy) {
      throw new Error('No se puede crear un evento en el pasado');
    }

    return new EventDate(fecha);
  }

  static reconstruct(fecha: Date): EventDate {
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha invalida al reconstruir');
    }
    return new EventDate(fecha);
  }

  /**
   * Getter defensivo: Retorna una nueva instancia de Date 
   * para evitar mutaciones externas por referencia.
   */
  get value(): Date {
    return new Date(this._value.getTime());
  }

  isToday(): boolean {
    const hoy = new Date();
    return this._value.toDateString() === hoy.toDateString();
  }

  daysUntilEvent(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaEvento = new Date(this._value.getTime());
    fechaEvento.setHours(0, 0, 0, 0);

    const diffMs = fechaEvento.getTime() - hoy.getTime();
    // Usamos Math.floor tras operar con fechas en formato limpio de medianoche
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}