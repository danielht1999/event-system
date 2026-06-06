// src/modules/event/domain/repositories/IEventRepository.ts
import { Event } from '../entities/Event';

/**
 * Representa la estructura de datos planos permitidos para la edición
 * de un evento. Al ser un mantenimiento puramente de datos, no dispara
 * lógica de negocio ni eventos de dominio.
 */
export interface EventUpdateData {
  titulo?: string;
  descripcion?: string;
  lugar?: string;
}

export interface IEventRepository {
  /**
   * Inserta o actualiza un Evento (Upsert). 
   * Es el ÚNICO método encargado de despachar Eventos de Dominio (ej. EventCancelled).
   */
  save(event: Event): Promise<Event>;

  /**
   * Busca un evento por su ID de manera limpia (Lectura).
   */
  findById(id: string): Promise<Event | null>;

  /**
   * Bloquea la fila en la Base de Datos (SELECT ... FOR UPDATE).
   * Crucial para transacciones concurrentes como la reserva y confirmación de tickets.
   */
  findByIdForUpdate(id: string): Promise<Event | null>;

  findAll(): Promise<Event[]>;
  findByOrganizerId(organizerId: string): Promise<Event[]>;

  /**
   * Modificación exclusiva de datos planos (mantenimiento). 
   * Utiliza una interfaz explícita externa para sortear las propiedades privadas del Dominio.
   */
  updateData(id: string, data: EventUpdateData): Promise<Event | null>; 

  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}