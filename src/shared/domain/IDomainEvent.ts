// src/shared/domain/IDomainEvent.ts

export interface IDomainEvent {
  eventName: string;
  occurredOn: Date;
  data: any;
}