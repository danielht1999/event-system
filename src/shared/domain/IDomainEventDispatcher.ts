import { IDomainEvent } from './IDomainEvent';

export interface IDomainEventDispatcher {
  dispatch(events: IDomainEvent[]): Promise<void>;
}