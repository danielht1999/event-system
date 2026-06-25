// client/src/features/reservations/components/ReservationFilters.tsx

import type { ReservationStatus } from '../types/Reservation';

interface ReservationFiltersProps {
  onFilterChange: (filters: {
    status?: ReservationStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
  currentStatus?: ReservationStatus;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
}

export const ReservationFilters = ({
  onFilterChange,
  currentStatus,
  currentSortBy,
  currentSortOrder,
}: ReservationFiltersProps) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ReservationStatus | '';
    onFilterChange({ status: value || undefined });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
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

  return (
    <div className="reservation-filters">
      <div className="filter-group">
        <label>Estado</label>
        <select
          value={currentStatus || ''}
          onChange={handleStatusChange}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE_PAGO">Pendientes de pago</option>
          <option value="CONFIRMADA">Confirmadas</option>
          <option value="CANCELADA">Canceladas</option>
          <option value="EXPIRADA">Expiradas</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Ordenar por</label>
        <select
          value={currentSortBy ? `${currentSortBy}-${currentSortOrder || 'asc'}` : ''}
          onChange={handleSortChange}
        >
          <option value="">Sin ordenar</option>
          <option value="fecha-asc">Fecha (más antiguo)</option>
          <option value="fecha-desc">Fecha (más reciente)</option>
          <option value="estado-asc">Estado (A-Z)</option>
          <option value="estado-desc">Estado (Z-A)</option>
        </select>
      </div>
    </div>
  );
};