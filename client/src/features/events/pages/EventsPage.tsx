// client/src/features/events/pages/EventsPage.tsx

import { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { EventFilters } from '../components/EventFilters';
import { Pagination } from '../../../shared/components/Pagination';
import { PurchaseModal } from '../../reservations/components/PurchaseModal';
import { useCrearReserva } from '../../reservations/hooks/useReservations';
import { useQueryParams } from '../../../shared/hooks/useQueryParams';

export const EventsPage = () => {
  const { getEventsParams, setParams } = useQueryParams();
  const params = getEventsParams();

  const { eventos, cargando, total, recargar } = useEvents(params);
  const { crearReserva, cargando: comprando } = useCrearReserva();

  const [eventoSeleccionado, setEventoSeleccionado] = useState<{
    eventoId: string;
    ticketTypeId: string;
    titulo: string;
  } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / (params.limit || 10)));

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage });
  };

  const handleFilterChange = (filters: {
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    setParams({ ...filters, page: 1 });
  };

  const handleComprar = (
    eventoId: string,
    ticketTypeId: string,
    eventoTitulo: string
  ) => {
    setEventoSeleccionado({
      eventoId: eventoId,
      ticketTypeId: ticketTypeId,
      titulo: eventoTitulo,
    });
  };

  const handleCerrarModal = () => {
    setEventoSeleccionado(null);
  };

  const handleConfirmarCompra = async (cantidadTickets: number) => {
    if (!eventoSeleccionado) return;

    const response = await crearReserva({
      eventoId: eventoSeleccionado.eventoId,
      ticketTypeId: eventoSeleccionado.ticketTypeId,
      cantidadTickets,
    });

    if (!response.success) {
      throw new Error(response.message || 'No se pudo crear la reserva');
    }

    handleCerrarModal();
    recargar();
  };

  if (cargando && eventos.length === 0) {
    return <div className="loading">Cargando eventos...</div>;
  }

  const selectedTicket = eventoSeleccionado
    ? eventos
        .flatMap((e) => e.tickets || [])
        .find((t) => t.id === eventoSeleccionado.ticketTypeId)
    : null;

  const selectedEvent = eventoSeleccionado
    ? eventos.find((e) => e.tickets?.some((t) => t.id === eventoSeleccionado.ticketTypeId))
    : null;

  return (
    <>
      <div className="page-container">
        <header className="page-header">
          <h1 className="page-title">Proximos Eventos</h1>
          <div className="page-actions">
            <button className="btn-action" onClick={recargar}>
              Actualizar lista
            </button>
            <button
              className="btn-secondary"
              onClick={() => setParams({ page: 1, limit: 10 })}
            >
              Resetear filtros
            </button>
          </div>
        </header>

        <EventFilters
          onFilterChange={handleFilterChange}
          currentStatus={params.status}
          currentSortBy={params.sortBy}
          currentSortOrder={params.sortOrder}
        />

        {eventos.length === 0 ? (
          <div className="empty-state">
            <p>No hay eventos disponibles.</p>
          </div>
        ) : (
          <section className="events-grid">
            {eventos.map((evento) => (
              <EventCard
                key={evento.id}
                evento={evento}
                onComprar={handleComprar}
              />
            ))}
          </section>
        )}

        <Pagination
          currentPage={params.page || 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {eventoSeleccionado && selectedTicket && selectedEvent && (
        <PurchaseModal
          eventoTitulo={selectedEvent.titulo}
          ticketTypeNombre={selectedTicket.nombre}
          ticketTypePrecio={selectedTicket.precio}
          cargando={comprando}
          onConfirmar={handleConfirmarCompra}
          onCerrar={handleCerrarModal}
        />
      )}
    </>
  );
};