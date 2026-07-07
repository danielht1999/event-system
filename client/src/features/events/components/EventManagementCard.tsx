// client/src/features/events/components/EventManagementCard.tsx

import type { EventManagementDTO } from '../types/Event';

interface EventManagementCardProps {
  evento: EventManagementDTO;
  onPublicar: (id: string) => void;
  onCancelar: (id: string) => void;
}

export const EventManagementCard = ({ evento, onPublicar, onCancelar }: EventManagementCardProps) => {
  const precioMinimo = Math.min(...evento.tickets.map(t => t.precio));
  const cuposTotales = evento.tickets.reduce((sum, t) => sum + t.cuposDisponibles, 0);
  const capacidadTotal = evento.tickets.reduce((sum, t) => sum + t.capacidadMaxima, 0);

  const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'Fecha no disponible';
    return new Date(fechaStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card-solid">
      {/* Título */}
      <div className="card-title">{evento.titulo}</div>

      {/* Grid de información básica */}
      <div className="data-grid">
        <div className="data-item">
          <span className="data-label">Lugar</span>
          <span className="data-value">{evento.lugar}</span>
        </div>
        <div className="data-item">
          <span className="data-label">Fecha</span>
          <span className="data-value">{formatFecha(evento.fecha)}</span>
        </div>
        <div className="data-item">
          <span className="data-label">Estado</span>
          <span className={`pill-led ${evento.estado === 'PUBLICADA' ? 'success' : 'warning'}`}>
            <span className="led"></span>
            {evento.estado || 'BORRADOR'}
          </span>
        </div>
        <div className="data-item">
          <span className="data-label">Precio desde</span>
          <span className="data-value">${precioMinimo}</span>
        </div>
        <div className="data-item">
          <span className="data-label">Capacidad total</span>
          <span className="data-value">{capacidadTotal}</span>
        </div>
        <div className="data-item">
          <span className="data-label">Cupos disponibles</span>
          <span className="data-value">{cuposTotales}</span>
        </div>
      </div>

      {/* Descripción */}
      {evento.descripcion && (
        <div className="data-item" style={{ gridColumn: '1 / -1' }}>
          <span className="data-label">Descripción</span>
          <span className="data-value">{evento.descripcion}</span>
        </div>
      )}

      {/* ============================================ */}
      {/* TICKETS - Lista completa de tipos de entrada */}
      {/* ============================================ */}
      <div style={{ marginTop: '16px' }}>
        <span className="data-label" style={{ display: 'block', marginBottom: '10px' }}>
          Tipos de entrada ({evento.tickets.length})
        </span>
        <div 
          className="event-detail-tickets-grid" 
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}
        >
          {evento.tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className="card-solid" 
              style={{ 
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border-glow)'
              }}
            >
              {/* Header: Nombre + Estado */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {ticket.nombre}
                </span>
                <span className={`pill-led ${ticket.cuposDisponibles > 0 ? 'success' : 'error'}`} style={{ fontSize: '0.65rem', padding: '2px 10px' }}>
                  <span className="led" style={{ width: '6px', height: '6px' }}></span>
                  {ticket.cuposDisponibles > 0 ? 'Disponible' : 'Agotado'}
                </span>
              </div>

              {/* Body: Precio + Cupos */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <span style={{ 
                  color: 'var(--success-color)', 
                  fontWeight: 700, 
                  fontSize: '1.1rem' 
                }}>
                  ${ticket.precio}
                </span>
                <span style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.8rem' 
                }}>
                  {ticket.cuposDisponibles} / {ticket.capacidadMaxima} cupos
                </span>
              </div>

              {/* Reservas (si hay datos) */}
              {(ticket.reservasPendientes > 0 || ticket.reservasConfirmadas > 0) && (
                <div style={{ 
                  marginTop: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-glow)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>⏳ {ticket.reservasPendientes} pendientes</span>
                  <span>✅ {ticket.reservasConfirmadas} confirmadas</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* ACCIONES */}
      {/* ============================================ */}
      <div className="event-actions" style={{ marginTop: '16px' }}>
        {evento.estado !== 'PUBLICADA' && (
          <button className="btn btn-primary btn-sm" onClick={() => onPublicar(evento.id)}>
            Publicar
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => onCancelar(evento.id)}>
          Cancelar
        </button>
      </div>
    </div>
  );
};