import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { IDomainEventDispatcher } from '@shared/domain/IDomainEventDispatcher';
import { domainEventBus } from './DomainEventBus';

export class InMemoryDomainEventDispatcher implements IDomainEventDispatcher {
  async dispatch(events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      domainEventBus.publish(event.eventName, event);
    }
  }
}