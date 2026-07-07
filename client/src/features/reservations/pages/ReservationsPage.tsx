// client/src/features/reservations/pages/ReservationsPage.tsx

import { useReservations, usePagarReserva, useCancelarReserva } from '../hooks/useReservations';
import { Pagination } from '../../../shared/components/Pagination';
import { useQueryParams } from '../../../shared/hooks/useQueryParams';
import type { ReservationStatus } from '../types/Reservation';
import { ReservationFilters } from '../components/ReservationFilters';

export const ReservationsPage = () => {
  const { getReservationsParams, setParams } = useQueryParams();
  const params = getReservationsParams();

  const { reservas, cargando, total, recargar } = useReservations(params);
  const { pagarReserva, cargando: pagando } = usePagarReserva();
  const { cancelarReserva, cargando: cancelando } = useCancelarReserva();

  const totalPages = Math.max(1, Math.ceil(total / (params.limit || 10)));

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage });
  };

  const handleFilterChange = (filters: {
    status?: ReservationStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    setParams({ ...filters, page: 1 });
  };

  const handleResetFilters = () => {
    setParams({ page: 1, limit: 10 });
  };

  const handleConfirmarPago = async (reservaId: string) => {
    if (window.confirm('¿Confirmar el pago de esta reserva?')) {
      const response = await pagarReserva(reservaId);
      if (response.success) {
        recargar();
      }
    }
  };

  const handleCancelar = async (reservaId: string) => {
    if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
      const response = await cancelarReserva(reservaId);
      if (response.success) {
        recargar();
      }
    }
  };

  const getEstadoPill = (estado: ReservationStatus) => {
    switch (estado) {
      case 'CONFIRMADA':
        return 'success';
      case 'CANCELADA':
        return 'error';
      case 'EXPIRADA':
        return 'warning';
      case 'PENDIENTE_PAGO':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const getEstadoTexto = (estado: ReservationStatus) => {
    switch (estado) {
      case 'CONFIRMADA':
        return 'CONFIRMADA';
      case 'CANCELADA':
        return 'CANCELADA';
      case 'EXPIRADA':
        return 'EXPIRADA';
      case 'PENDIENTE_PAGO':
        return 'PENDIENTE DE PAGO';
      default:
        return estado;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="card">
      {/* Título de la página */}
      <h1 className="card-title">Mis Reservas</h1>

      {/* Filtros con acciones integradas */}
      <ReservationFilters
        onFilterChange={handleFilterChange}
        onRefresh={recargar}
        onReset={handleResetFilters}
        currentStatus={params.status}
        currentSortBy={params.sortBy}
        currentSortOrder={params.sortOrder}
      />

      {/* Estado de carga */}
      {cargando ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando reservas...</p>
        </div>
      ) : reservas.length === 0 ? (
        <div className="empty-state">
          <p className="empty">No hay reservas con los filtros seleccionados.</p>
          <p className="empty-subtitle">
            {params.status 
              ? `No hay reservas con estado "${params.status}". Intenta con otro filtro.`
              : 'Explora eventos y reserva tu entrada.'}
          </p>
          {params.status && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setParams({ status: undefined, page: 1 })}
            >
              Limpiar filtro
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="reservas-grid">
            {reservas.map((reserva) => {
              const estado = reserva.estado;
              const esPendiente = estado === 'PENDIENTE_PAGO';

              return (
                <div
                  key={reserva.id}
                  className="card-solid"
                  style={{
                    borderTop: `3px solid var(--${getEstadoPill(estado)}-color, #6c757d)`,
                  }}
                >
                  <div className="reserva-header">
                    <h3 className="reserva-title">
                      {reserva.eventoTitulo || 'Evento'}
                    </h3>
                    <div className={`pill-led ${getEstadoPill(estado)}`}>
                      <span className="led"></span>
                      {getEstadoTexto(estado)}
                    </div>
                  </div>

                  <div className="reserva-meta-row">
                    <div>
                      <div className="meta-block-title">Fecha del Evento</div>
                      <div className="meta-block-value">
                        <span className="icon-wrapper">🗓️</span>
                        <span>{formatDate(reserva.eventoFecha)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="meta-block-title">Entradas</div>
                      <div className="meta-block-value">
                        <span className="icon-wrapper">🎟️</span>
                        <span>
                          {reserva.cantidadTickets}{' '}
                          {reserva.cantidadTickets === 1 ? 'entrada' : 'entradas'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="meta-block-title">Código</div>
                      <div className="meta-block-value">
                        <span className="icon-wrapper">🎫</span>
                        <span className="ticket-code-text">
                          {reserva.codigoTicket || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {reserva.codigoTicket && (
                    <div className="ticket-code-box">
                      <div className="meta-block-title">Código Único de Entrada</div>
                      <div
                        className={`ticket-code-value ${
                          estado === 'CANCELADA' || estado === 'EXPIRADA'
                            ? 'ticket-cancelado'
                            : ''
                        }`}
                      >
                        {reserva.codigoTicket}
                      </div>
                    </div>
                  )}

                  {esPendiente && (
                    <div className="reserva-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleConfirmarPago(reserva.id)}
                        disabled={pagando}
                      >
                        {pagando ? 'Procesando...' : '✅ Pagar'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelar(reserva.id)}
                        disabled={cancelando}
                      >
                        {cancelando ? 'Cancelando...' : '❌ Cancelar'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={params.page || 1}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};