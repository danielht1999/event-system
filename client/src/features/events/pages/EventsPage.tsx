// client/src/features/events/pages/EventsPage.tsx

import { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { EventFilters } from '../components/EventFilters';
import { Pagination } from '../../../shared/components/Pagination';
import { PurchaseModal } from '../../reservations/components/PurchaseModal';
import { useCrearReserva } from '../../reservations/hooks/useReservations';
import { useQueryParams } from '../../../shared/hooks/useQueryParams';
import { eventApi } from '../services/eventApi';
import type { Evento } from '../types/Event';

export const EventsPage = () => {
  const { getEventsParams, setParams } = useQueryParams();
  const params = getEventsParams();

  const { eventos, cargando, total, recargar } = useEvents(params);
  const { crearReserva, cargando: comprando } = useCrearReserva();

  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

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

  const handleComprar = async (evento: Evento) => {
    // Si el evento ya tiene tickets, usarlo directamente
    if (evento.tickets && evento.tickets.length > 0) {
      setEventoSeleccionado(evento);
      return;
    }

    // Si no tiene tickets (viene del listado), cargarlos
    setCargandoDetalle(true);
    try {
      const response = await eventApi.getEvento(evento.id);
      if (response.success && response.data) {
        setEventoSeleccionado(response.data);
      } else {
        console.error('Error al cargar detalles del evento');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleCerrarModal = () => {
    setEventoSeleccionado(null);
  };

  const handleConfirmarCompra = async (ticketTypeId: string, cantidadTickets: number) => {
    if (!eventoSeleccionado) return;

    const payload = {
      eventoId: eventoSeleccionado.id,
      ticketTypeId,
      cantidadTickets,
    };

    console.log('📦 Enviando reserva:', payload);

    const response = await crearReserva({
      eventoId: eventoSeleccionado.id,
      ticketTypeId,
      cantidadTickets,
    });

    if (!response.success) {
      throw new Error(response.message || 'No se pudo crear la reserva');
    }

    handleCerrarModal();
    recargar();
  };

  const handleResetFilters = () => {
    setParams({ page: 1, limit: 10 });
  };

  if (cargando && eventos.length === 0) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="loading-text">Cargando eventos...</p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="filters-header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 className="card-title" style={{ marginBottom: 0 }}>
              Próximos Eventos
            </h1>
            <span className="badge badge-info">{total} eventos</span>
          </div>
        </div>

        <EventFilters
          onFilterChange={handleFilterChange}
          onRefresh={recargar}
          onReset={handleResetFilters}
          currentStatus={params.status}
          currentSortBy={params.sortBy}
          currentSortOrder={params.sortOrder}
        />

        {eventos.length === 0 ? (
          <div className="empty">
            <p>No hay eventos disponibles.</p>
          </div>
        ) : (
          <section className="eventos-grid">
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

      {eventoSeleccionado && (
        <PurchaseModal
          evento={eventoSeleccionado}
          cargando={comprando || cargandoDetalle}
          onConfirmar={handleConfirmarCompra}
          onCerrar={handleCerrarModal}
        />
      )}
    </>
  );
};