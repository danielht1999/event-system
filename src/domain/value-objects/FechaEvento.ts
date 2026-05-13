// src/domain/value-objects/FechaEvento.ts

export class FechaEvento {
  // 1. Constructor privado - controlas cómo se crean las instancias
  private constructor(private readonly _value: Date) {}

  // 2. Factory method para creación NUEVA (con validación)
  static crear(fecha: Date): FechaEvento {
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha invalida');
    }
    if (fecha < new Date()) {
      throw new Error('No se puede crear un evento en el pasado');
    }
     return new FechaEvento(fecha);
   }

  // 3. Factory method para RECONSTRUIR desde BD (sin validación)
  static reconstruir(fecha: Date): FechaEvento {
    return new FechaEvento(fecha);
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