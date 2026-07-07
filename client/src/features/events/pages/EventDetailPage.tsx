// client/src/features/events/pages/EventDetailPage.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';
import { PurchaseModal } from '../../reservations/components/PurchaseModal';
import { useCrearReserva } from '../../reservations/hooks/useReservations';

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { evento, cargando, recargar } = useEvent(id ?? '');
  const { crearReserva, cargando: comprando } = useCrearReserva();
  
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ Calcular desde tickets - NO usar evento.precio
  const precioMinimo = evento?.tickets && evento.tickets.length > 0
    ? Math.min(...evento.tickets.map(t => t.precio))
    : 0;

  // ✅ Calcular desde tickets - NO usar evento.cuposDisponibles
  const cuposTotales = evento?.tickets
    ? evento.tickets.reduce((sum, t) => sum + t.cuposDisponibles, 0)
    : 0;

  const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'Fecha por confirmar';
    return new Date(fechaStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrecio = (precio: number) => {
    return precio === 0 ? 'Gratis' : `$${precio}`;
  };

  const handleComprar = () => {
    setModalVisible(true);
  };

  const handleConfirmarCompra = async (ticketTypeId: string, cantidadTickets: number) => {
    if (!evento) return;

    const response = await crearReserva({
      eventoId: evento.id,
      ticketTypeId,
      cantidadTickets,
    });

    if (!response.success) {
      throw new Error(response.message || 'No se pudo crear la reserva');
    }

    setModalVisible(false);
    recargar();
  };

  if (cargando) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="loading-text">Cargando evento...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="error-container">
        <h2>Evento no encontrado</h2>
        <p>El evento que buscas no existe o ha sido eliminado.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Volver a eventos
        </button>

        <div className="card">
          <div className="event-detail-header">
            <h1 className="event-detail-titulo">{evento.titulo}</h1>
            <span className={`pill-led ${evento.estado === 'PUBLICADA' ? 'success' : 'warning'}`}>
              <span className="led"></span>
              {evento.estado || 'BORRADOR'}
            </span>
          </div>

          <div className="event-detail-meta">
            <div className="event-detail-meta-item">
              <span className="event-detail-meta-icon">📍</span>
              <span>{evento.lugar}</span>
            </div>
            <div className="event-detail-meta-item">
              <span className="event-detail-meta-icon">📅</span>
              <span>{formatFecha(evento.fecha)}</span>
            </div>
            <div className="event-detail-meta-item">
              <span className="event-detail-meta-icon">💰</span>
              <span>Desde {formatPrecio(precioMinimo)}</span>
            </div>
            <div className="event-detail-meta-item">
              <span className="event-detail-meta-icon">🎟️</span>
              <span>{cuposTotales} cupos disponibles</span>
            </div>
          </div>

          {evento.descripcion && (
            <div className="event-detail-descripcion">
              <h3>Descripción</h3>
              <p>{evento.descripcion}</p>
            </div>
          )}

          <div className="event-detail-tickets">
            <h3>Tipos de entrada</h3>
            <div className="event-detail-tickets-grid">
              {evento.tickets.map((ticket) => (
                <div key={ticket.id} className="card-solid">
                  <div className="event-detail-ticket-header">
                    <span className="event-detail-ticket-nombre">{ticket.nombre}</span>
                    <span className={`pill-led ${ticket.cuposDisponibles > 0 ? 'success' : 'error'}`}>
                      <span className="led"></span>
                      {ticket.cuposDisponibles > 0 ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>
                  <div className="event-detail-ticket-body">
                    <div className="event-detail-ticket-precio">
                      {formatPrecio(ticket.precio)}
                    </div>
                    <div className="event-detail-ticket-cupos">
                      {ticket.cuposDisponibles} cupos disponibles
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleComprar}
            disabled={cuposTotales === 0 || evento.estado === 'CANCELADA'}
            style={{ width: '100%', marginTop: '16px' }}
          >
            {evento.estado === 'CANCELADA' 
              ? 'Evento Cancelado' 
              : cuposTotales > 0 
                ? 'Comprar Tickets →' 
                : 'Sin cupos disponibles'
            }
          </button>
        </div>
      </div>

      {modalVisible && evento && (
        <PurchaseModal
          evento={evento}
          cargando={comprando}
          onConfirmar={handleConfirmarCompra}
          onCerrar={() => setModalVisible(false)}
        />
      )}
    </>
  );
};