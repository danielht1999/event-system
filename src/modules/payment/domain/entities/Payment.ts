import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { ValidationError } from '@shared/domain/errors';

export type PaymentStatus =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'REEMBOLSADO';

export class Payment {
  private _domainEvents: IDomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly reservationId: string,
    public readonly usuarioId: string,   
    public readonly monto: number,
    public readonly moneda: string,
    private _estado: PaymentStatus,
    public readonly creadoEn: Date = new Date(),
    private _actualizadoEn: Date = new Date()
  ) {
    this.validate();
  }

  static create(props: {
    id: string;
    reservationId: string;
    usuarioId: string;                    
    monto: number;
    moneda: string;
  }): Payment {
    return new Payment(
      props.id,
      props.reservationId,
      props.usuarioId,
      props.monto,
      props.moneda,
      'PENDIENTE',
      new Date(),
      new Date()
    );
  }

  private validate(): void {
    if (this.monto <= 0) {
      throw new ValidationError(
        'El monto del pago debe ser mayor a cero'
      );
    }
    if (!this.moneda || this.moneda.trim() === '') {
      throw new ValidationError(
        'La moneda es requerida'
      );
    }
  }

  get estado(): PaymentStatus {
    return this._estado;
  }

  get actualizadoEn(): Date {
    return this._actualizadoEn;
  }

  public recordEvent(name: string, data: any): void {
    this._domainEvents.push({
      eventName: name,
      occurredOn: new Date(),
      data
    });
  }

  public pullDomainEvents(): IDomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  public aprobar(): void {
    if (this._estado !== 'PENDIENTE') {
      throw new ValidationError(
        'Solo un pago pendiente puede aprobarse'
      );
    }

    this._estado = 'APROBADO';
    this._actualizadoEn = new Date();

    this.recordEvent(
      DomainEventNames.PAYMENT.APPROVED,
      {
        paymentId: this.id,
        reservationId: this.reservationId,
        usuarioId: this.usuarioId,
        monto: this.monto,
        moneda: this.moneda
      }
    );
  }

  public rechazar(): void {
    if (this._estado !== 'PENDIENTE') {
      throw new ValidationError(
        'Solo un pago pendiente puede rechazarse'
      );
    }

    this._estado = 'RECHAZADO';
    this._actualizadoEn = new Date();
  }

  public reembolsar(): void {
    if (this._estado !== 'APROBADO') {
      throw new ValidationError(
        'Solo un pago aprobado puede reembolsarse'
      );
    }

    this._estado = 'REEMBOLSADO';
    this._actualizadoEn = new Date();

    this.recordEvent(
      DomainEventNames.PAYMENT.REFUNDED,
      {
        paymentId: this.id,
        reservationId: this.reservationId,
        usuarioId: this.usuarioId,
        monto: this.monto,
        moneda: this.moneda
      }
    );
  }
}