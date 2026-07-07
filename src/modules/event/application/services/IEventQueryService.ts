// src/modules/event/application/services/IEventQueryService.ts

import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { GetEventsQuery } from '../queries/GetEventsQuery';

// ============================================
// DTO PARA EL LISTADO DE EVENTOS
// ============================================

export interface EventoListDTO {
  id: string;
  titulo: string;
  lugar: string;
  fecha: string;
  estado: string;
  precioMinimo: number;  
  cuposDisponibles: number; 
}

// ============================================
// DTO PARA EL DETALLE DE EVENTO
// ============================================

export interface TicketTypeDTO {
  id: string;
  nombre: string;
  precio: number;
  capacidadMaxima: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  cuposDisponibles: number;
  estado: string;
}

export interface EventoDetalleDTO {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  organizadorId: string;
  estado: string;
  tickets: TicketTypeDTO[];
}

export interface EventoManagementDTO {
    id: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    lugar: string;
    organizadorId: string;
    estado: string;
    tickets: TicketTypeDTO[];
}

// ============================================
// INTERFAZ DEL SERVICIO DE CONSULTAS
// ============================================

export interface IEventQueryService {
  /**
   * Busca eventos aplicando filtros dinámicos basados en GetEventsQuery.
   * Devuelve datos optimizados para el listado (sin tickets anidados).
   */
  find(query: GetEventsQuery): Promise<PaginatedResult<EventoListDTO>>;

  /**
   * Obtiene un evento por su ID con todos sus tickets.
   * Devuelve datos completos para la página de detalle.
   */
  findById(id: string): Promise<EventoDetalleDTO | null>;
  
/**
   * Obtiene evetos del organizador por su ID con todos sus tickets.
   * Devuelve datos completos para la página de detalle.
   */
findManagement( organizerId: string, query: GetEventsQuery ): Promise<PaginatedResult<EventoManagementDTO>>;
}
