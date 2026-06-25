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

  // ✅ Siempre mostrar el header y los filtros
  return (
    <div className="main-panel">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <h1 className="panel-title" style={{ marginBottom: 0 }}>
          Mis Reservas
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={recargar}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            🔄 Actualizar
          </button>
          <button
            onClick={() => setParams({ page: 1, limit: 10 })}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Resetear filtros
          </button>
        </div>
      </div>

      {/* ✅ Filtros SIEMPRE visibles */}
      <ReservationFilters
        onFilterChange={handleFilterChange}
        currentStatus={params.status}
        currentSortBy={params.sortBy}
        currentSortOrder={params.sortOrder}
      />

      {/* ✅ Estado de carga */}
      {cargando ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Cargando reservas...</p>
        </div>
      ) : reservas.length === 0 ? (
        // ✅ Mensaje vacío dentro del grid, no como return temprano
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p className="empty">No hay reservas con los filtros seleccionados.</p>
          <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {params.status 
              ? `No hay reservas con estado "${params.status}". Intenta con otro filtro.`
              : 'Explora eventos y reserva tu entrada.'}
          </p>
          {params.status && (
            <button
              onClick={() => setParams({ status: undefined, page: 1 })}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
            >
              Limpiar filtro
            </button>
          )}
        </div>
      ) : (
        // ✅ Grid de reservas
        <>
          <div className="reservas-grid">
            {reservas.map((reserva) => {
              const estado = reserva.estado;
              const esPendiente = estado === 'PENDIENTE_PAGO';

              return (
                <div
                  key={reserva.id}
                  className="reserva-card"
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
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
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
                        className="btn-pagar"
                        onClick={() => handleConfirmarPago(reserva.id)}
                        disabled={pagando}
                      >
                        {pagando ? 'Procesando...' : '✅ Pagar'}
                      </button>
                      <button
                        className="btn-cancelar"
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