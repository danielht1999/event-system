import { Pool, PoolClient } from 'pg';
import { IUnitOfWork } from '@shared/domain/IUnitOfWork';
import { IDomainEvent } from '@shared/domain/IDomainEvent';
import { IDomainEventDispatcher } from '@shared/domain/IDomainEventDispatcher';

export class PostgresUnitOfWork implements IUnitOfWork {
  private client: PoolClient | null = null;
  private pendingEvents: IDomainEvent[] = [];

  constructor(
    private readonly pool: Pool,
    private readonly dispatcher: IDomainEventDispatcher //Inyectamos la abstracción de mensajería
  ) {}

  async begin(): Promise<void> {
    this.client = await this.pool.connect();
    await this.client.query('BEGIN');
  }

  async commit(): Promise<void> {
    if (!this.client) {
      throw new Error('UnitOfWork no iniciado');
    }

    await this.client.query('COMMIT');

    //Delegamos de forma asíncrona la publicación al dispatcher independiente
    await this.dispatcher.dispatch(this.pendingEvents);

    this.cleanup();
  }

  async rollback(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.query('ROLLBACK');
    this.cleanup();
  }

  collectEvents(events: IDomainEvent[]): void {
    this.pendingEvents.push(...events);
  }

  getTransactionContext(): PoolClient {
    if (!this.client) {
      throw new Error('UnitOfWork no iniciado');
    }
    return this.client;
  }

  private cleanup(): void {
    this.pendingEvents = [];
    this.client?.release();
    this.client = null;
  }
}