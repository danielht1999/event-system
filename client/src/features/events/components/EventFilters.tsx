// client/src/features/events/components/EventFilters.tsx

import { BaseFilter } from '../../../shared/components/BaseFilter';
import type { FilterGroup } from '../../../shared/components/BaseFilter';

interface EventFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
  onRefresh: () => void;
  onReset: () => void;
  currentStatus?: string;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
}

export const EventFilters = ({
  onFilterChange,
  onRefresh,
  onReset,
  currentStatus,
  currentSortBy,
  currentSortOrder,
}: EventFiltersProps) => {
  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value || undefined });
  };

  const handleSortChange = (value: string) => {
    if (!value) {
      onFilterChange({ sortBy: undefined, sortOrder: undefined });
      return;
    }
    const [sortBy, sortOrder] = value.split('-');
    onFilterChange({
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
  };

  // Contar filtros activos
  const filtrosActivos = [currentStatus, currentSortBy].filter(Boolean).length;

  // Construir grupos con los filtros + acciones como un grupo más
  const groups: FilterGroup[] = [
    {
      id: 'status-filter',
      label: 'Estado',
      value: currentStatus,
      options: [
        { value: '', label: 'Todos los estados' },
        { value: 'PUBLICADA', label: 'Publicados' },
        { value: 'BORRADOR', label: 'Borradores' },
        { value: 'CANCELADA', label: 'Cancelados' },
      ],
      onChange: handleStatusChange,
    },
    {
      id: 'sort-filter',
      label: 'Ordenar por',
      value: currentSortBy ? `${currentSortBy}-${currentSortOrder || 'asc'}` : '',
      options: [
        { value: '', label: 'Sin ordenar' },
        { value: 'fecha-asc', label: 'Fecha (más antiguo)' },
        { value: 'fecha-desc', label: 'Fecha (más reciente)' },
        { value: 'titulo-asc', label: 'Título (A-Z)' },
        { value: 'titulo-desc', label: 'Título (Z-A)' },
        { value: 'precio-asc', label: 'Precio (menor)' },
        { value: 'precio-desc', label: 'Precio (mayor)' },
      ],
      onChange: handleSortChange,
    },
  ];

  return (
    <BaseFilter groups={groups} className="filters">
      {/* Badge de filtros activos - inline con los filtros */}
      {filtrosActivos > 0 && (
        <span className="badge badge-pulse">
          {filtrosActivos} filtro{filtrosActivos > 1 ? 's' : ''} activo
        </span>
      )}

      {/* Botones de acción - como un filtro más */}
      <div className="filter-group">
        <label>&nbsp;</label>
        <div className="filter-actions-buttons">
          <button
            className="btn-filter-action"
            onClick={onRefresh}
            title="Actualizar lista de eventos"
          >
            ↻ Actualizar
          </button>
          <button
            className="btn-filter-action btn-filter-reset"
            onClick={onReset}
            title="Resetear todos los filtros"
          >
            ✕ Resetear
          </button>
        </div>
      </div>
    </BaseFilter>
  );
};