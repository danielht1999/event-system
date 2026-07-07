// client/src/features/reservations/components/ReservationFilters.tsx

import { BaseFilter } from '../../../shared/components/BaseFilter';
import type { FilterGroup } from '../../../shared/components/BaseFilter';
import type { ReservationStatus } from '../types/Reservation';

interface ReservationFiltersProps {
  onFilterChange: (filters: {
    status?: ReservationStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
  onRefresh: () => void;
  onReset: () => void;
  currentStatus?: ReservationStatus;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
}

export const ReservationFilters = ({
  onFilterChange,
  onRefresh,
  onReset,
  currentStatus,
  currentSortBy,
  currentSortOrder,
}: ReservationFiltersProps) => {
  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value as ReservationStatus || undefined });
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

  const groups: FilterGroup[] = [
    {
      id: 'status-filter',
      label: 'Estado',
      value: currentStatus,
      options: [
        { value: '', label: 'Todos los estados' },
        { value: 'PENDIENTE_PAGO', label: 'Pendientes de pago' },
        { value: 'CONFIRMADA', label: 'Confirmadas' },
        { value: 'CANCELADA', label: 'Canceladas' },
        { value: 'EXPIRADA', label: 'Expiradas' },
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
        { value: 'estado-asc', label: 'Estado (A-Z)' },
        { value: 'estado-desc', label: 'Estado (Z-A)' },
      ],
      onChange: handleSortChange,
    },
  ];

  return (
    <BaseFilter groups={groups} className="filters">
      {/* Badge de filtros activos */}
      {/* Botones de acción */}
      <div className="filter-group">
        <label>&nbsp;</label>
        <div className="filter-actions-buttons">
          <button
            className="btn-filter-action"
            onClick={onRefresh}
            title="Actualizar lista de reservas"
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