// src/modules/event/domain/value-objects/Capacity.ts
import { ValidationError } from '@shared/domain/errors';

export class Capacity {
  // Usamos 'public readonly' en el constructor para ahorrarnos la propiedad privada y el getter plano
  constructor(public readonly value: number) {
    if (value <= 0) {
      throw new ValidationError('La capacidad debe ser mayor a 0');
    }
    if (value > 10000) {
      throw new ValidationError('La capacidad no puede superar 10,000 personas');
    }
  }

  /**
   * Evalúa si hay espacio suficiente basándose en la ocupación actual
   */
  public hasSpace(reservasActuales: number, cantidadReservar: number): boolean {
    return reservasActuales + cantidadReservar <= this.value;
  }

  /**
   * Calcula los cupos que quedan disponibles de forma centralizada.
   * Evita que la entidad Event u otros servicios dupliquen la resta (capacidad - ocupados) por ahí fuera.
   */
  public seatsLeft(reservasActuales: number): number {
    const restantes = this.value - reservasActuales;
    return restantes < 0 ? 0 : restantes;
  }
}