// client/src/shared/hooks/useQueryParams.ts

import { useSearchParams } from 'react-router-dom';

// ============================================================
// TIPOS ALINEADOS CON EL BACKEND
// ============================================================

export type SortOrder = 'asc' | 'desc';

/**
 * Parámetros de paginación (globales)
 * ALINEADOS con: Pagination.normalize() en el backend
 */
export interface PaginationParams {
  page?: number;   // default: 1, min: 1
  limit?: number;  // default: 20, min: 1, max: 100
}

/**
 * Parámetros de ordenamiento (globales)
 * ALINEADOS con: SortOptions en el backend
 */
export interface SortParams {
  sortBy?: string;      // Depende del feature (ej: 'fecha', 'titulo', 'precio')
  sortOrder?: SortOrder; // 'asc' | 'desc'
}

/**
 * Parámetros específicos de EVENTS
 * ALINEADOS con: EVENT_QUERY_CAPABILITIES
 */
export interface EventsQueryParams extends PaginationParams, SortParams {
  status?: 'PUBLICADA' | 'BORRADOR' | 'CANCELADA';
  owner?: 'me';
}

/**
 * Parámetros específicos de RESERVATIONS
 * ALINEADOS con: RESERVATION_QUERY_CAPABILITIES
 */
export interface ReservationsQueryParams extends PaginationParams, SortParams {
  status?: 'PENDIENTE_PAGO' | 'CONFIRMADA' | 'CANCELADA';
  eventId?: string;
  userId?: string;
}

/**
 * Parámetros específicos de USERS
 * ALINEADOS con: USER_QUERY_CAPABILITIES (asumiendo que existe)
 */
export interface UsersQueryParams extends PaginationParams, SortParams {
  search?: string;
  status?: string;
}

// ============================================================
// QUERY CAPABILITIES POR FEATURE
// ============================================================

export const QUERY_CAPABILITIES = {
  events: {
    pagination: true,
    sorting: true,
    ownerFilter: true,
    statusFilter: true,
    allowedSortFields: ['fecha', 'titulo', 'precio', 'lugar'] as const,
    allowedStatuses: ['PUBLICADA', 'BORRADOR', 'CANCELADA'] as const,
  },
  reservations: {
    pagination: true,
    sorting: true,
    statusFilter: true,
    eventIdFilter: true,
    userIdFilter: true,
    allowedSortFields: ['fecha', 'estado', 'total'] as const,
    allowedStatuses: ['PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA'] as const,
  },
  users: {
    pagination: true,
    sorting: true,
    searchFilter: true,
    statusFilter: true,
    allowedSortFields: ['nombre', 'email', 'rol'] as const,
  },
} as const;

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export const useQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Obtener parámetros genéricos de la URL
   * ✅ Sin índice de firma, usando Record<string, string | number>
   */
  const getRawParams = (): Record<string, string | number> => {
    const params: Record<string, string | number> = {};
    searchParams.forEach((value, key) => {
      if (key === 'page' || key === 'limit') {
        params[key] = parseInt(value, 10);
      } else {
        params[key] = value;
      }
    });
    return params;
  };

  /**
   * Obtener parámetros específicos de EVENTS
   */
  const getEventsParams = (): EventsQueryParams => {
    const params: EventsQueryParams = {};
    searchParams.forEach((value, key) => {
      if (key === 'page') params.page = parseInt(value, 10);
      else if (key === 'limit') params.limit = parseInt(value, 10);
      else if (key === 'sortBy') params.sortBy = value;
      else if (key === 'sortOrder') params.sortOrder = value as SortOrder;
      else if (key === 'status') params.status = value as EventsQueryParams['status'];
      else if (key === 'owner') params.owner = value as 'me';
    });
    return {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params,
    };
  };

  /**
   * Obtener parámetros específicos de RESERVATIONS
   */
  const getReservationsParams = (): ReservationsQueryParams => {
    const params: ReservationsQueryParams = {};
    searchParams.forEach((value, key) => {
      if (key === 'page') params.page = parseInt(value, 10);
      else if (key === 'limit') params.limit = parseInt(value, 10);
      else if (key === 'sortBy') params.sortBy = value;
      else if (key === 'sortOrder') params.sortOrder = value as SortOrder;
      else if (key === 'status') params.status = value as ReservationsQueryParams['status'];
      else if (key === 'eventId') params.eventId = value;
      else if (key === 'userId') params.userId = value;
    });
    return {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params,
    };
  };

  /**
   * Establecer parámetros en la URL
   */
  const setParams = (params: Record<string, string | number | undefined>) => {
    const filteredParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filteredParams[key] = String(value);
      }
    });
    setSearchParams(filteredParams);
  };

  /**
   * Resetear todos los parámetros
   */
  const resetParams = () => {
    setSearchParams({});
  };

  // ============================================================
  // VALIDACIÓN ALINEADA CON EL BACKEND
  // ============================================================

  /**
   * Validar paginación contra Pagination.normalize() del backend
   */
  const validatePagination = (page?: number, limit?: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (page !== undefined && page < 1) {
      errors.push('page debe ser >= 1');
    }
    if (limit !== undefined) {
      if (limit < 1) errors.push('limit debe ser >= 1');
      if (limit > 100) errors.push('limit debe ser <= 100');
    }

    return { valid: errors.length === 0, errors };
  };

  /**
   * Validar sorting contra los campos permitidos del feature
   */
  const validateSorting = (
    feature: keyof typeof QUERY_CAPABILITIES,
    sortBy?: string,
    sortOrder?: SortOrder
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const capabilities = QUERY_CAPABILITIES[feature];

    if (sortBy && capabilities.sorting) {
      const allowed = capabilities.allowedSortFields as readonly string[];
      if (!allowed.includes(sortBy as any)) {
        errors.push(
          `sortBy debe ser uno de: ${allowed.join(', ')}. Recibido: ${sortBy}`
        );
      }
    }

    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      errors.push('sortOrder debe ser "asc" o "desc"');
    }

    return { valid: errors.length === 0, errors };
  };

  return {
    // Getters
    getRawParams,
    getEventsParams,
    getReservationsParams,

    // Setters
    setParams,
    resetParams,

    // Validadores
    validatePagination,
    validateSorting,

    // Capacidades
    capabilities: QUERY_CAPABILITIES,
  };
};