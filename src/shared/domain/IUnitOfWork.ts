import { IDomainEvent } from './IDomainEvent';

export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  collectEvents(events: IDomainEvent[]): void;
  getTransactionContext(): unknown;
}