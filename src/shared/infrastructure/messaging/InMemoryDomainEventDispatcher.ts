// src/shared/infrastructure/messaging/InMemoryDomainEventDispatcher.ts

import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { DomainEventName } from '@shared/domain/DomainEventNames';
import { domainEventBus } from './DomainEventBus';
import { IDomainEventDispatcher } from '@shared/domain/IDomainEventDispatcher';

export class InMemoryDomainEventDispatcher implements IDomainEventDispatcher {
  public async dispatch(events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      domainEventBus.publish(
        event.eventName as DomainEventName,
        event as IDomainEvent<any>
      );
    }
  }
}