import { Event } from '../entities/Event';

/**
 * DTO para la actualización parcial de datos descriptivos de un evento.
 */
export interface EventUpdateData {
  titulo?: string;
  descripcion?: string;
  lugar?: string;
}

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

  /**
   * Actualiza parcialmente campos planos de texto en la base de datos de forma directa.
   */
  updateData(id: string, data: EventUpdateData, transactionContext?: unknown): Promise<Event | null>;

  findAll(transactionContext?: unknown): Promise<Event[]>;

  findByOrganizerId(organizerId: string, transactionContext?: unknown): Promise<Event[]>;

  delete(id: string, transactionContext?: unknown): Promise<boolean>;

  exists(id: string, transactionContext?: unknown): Promise<boolean>;
}