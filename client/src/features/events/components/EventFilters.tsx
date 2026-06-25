// client/src/features/events/components/EventFilters.tsx

interface EventFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
  currentStatus?: string;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
}

export const EventFilters = ({
  onFilterChange,
  currentStatus,
  currentSortBy,
  currentSortOrder,
}: EventFiltersProps) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
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
    <div className="event-filters">
      <div className="filter-group">
        <label htmlFor="status-filter">Estado</label>
        <select
          id="status-filter"
          value={currentStatus || ''}
          onChange={handleStatusChange}
        >
          <option value="">Todos los estados</option>
          <option value="PUBLICADA">Publicados</option>
          <option value="BORRADOR">Borradores</option>
          <option value="CANCELADA">Cancelados</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort-filter">Ordenar por</label>
        <select
          id="sort-filter"
          value={currentSortBy ? `${currentSortBy}-${currentSortOrder || 'asc'}` : ''}
          onChange={handleSortChange}
        >
          <option value="">Sin ordenar</option>
          <option value="fecha-asc">Fecha (mas antiguo)</option>
          <option value="fecha-desc">Fecha (mas reciente)</option>
          <option value="titulo-asc">Titulo (A-Z)</option>
          <option value="titulo-desc">Titulo (Z-A)</option>
          <option value="precio-asc">Precio (menor)</option>
          <option value="precio-desc">Precio (mayor)</option>
        </select>
      </div>
    </div>
  );
};