import { Event } from '../entities/Event';

export interface IEventRepository {
  /**
   * Persiste el agregado Event completo. 
   * Acepta un contexto transaccional opcional.
   */
  save(event: Event, transactionContext?: unknown): Promise<Event>;

  /**
   * Lectura simple por ID único.
   */
  findById(id: string, transactionContext?: unknown): Promise<Event | null>;

  /**
   * Lectura con bloqueo pesimista (FOR UPDATE).
   * REQUIERE contexto transaccional obligatorio.
   */
  findByIdForUpdate(id: string, transactionContext: unknown): Promise<Event | null>;

  delete(id: string, transactionContext?: unknown): Promise<boolean>;

  exists(id: string, transactionContext?: unknown): Promise<boolean>;
}