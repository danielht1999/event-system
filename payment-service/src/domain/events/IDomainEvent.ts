export interface IDomainEvent {
  readonly occurredAt: Date;
  readonly eventName: string;
}
