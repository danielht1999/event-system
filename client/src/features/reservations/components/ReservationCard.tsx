import type  { Reservation } from '../types/Reservation';

interface ReservationCardProps {
  reservacion: Reservation;
  onConfirmarPago?: (id: string) => void;
  onCancelSuccess?: () => void; // Al cancelar, le avisa a la página que haga "recargar"
}

// Helpers puros de mapeo movidos fuera del ciclo de renderizado para mayor claridad
const getEstadoPill = (estado: string): string => {
  switch (estado) {
    case 'CONFIRMADA': return 'success';
    case 'CANCELADA': return 'error';
    case 'PENDIENTE_PAGO': return 'warning';
    default: return 'warning';
  }
};

const getEstadoTexto = (estado: string): string => {
  return estado === 'PENDIENTE_PAGO' ? 'PENDIENTE DE PAGO' : estado;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Fecha no disponible';
  return new Date(dateString).toLocaleDateString('es-ES');
};

export const ReservationCard = ({ reservacion, onConfirmarPago, onCancelSuccess }: ReservationCardProps) => {
  const { id, eventoTitulo, eventoFecha, cantidadTickets, estado, codigoTicket } = reservacion;
  const statusClass = getEstadoPill(estado);

  const handleCancelar = async () => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta reservación?')) {
      // Aquí puedes invocar directamente a tu servicio/hook o delegar al padre
      if (onCancelSuccess) onCancelSuccess();
    }
  };

  return (
    <div 
      className="reserva-card"
      style={{ borderTop: `3px solid var(--${statusClass}-color)` }}
    >
      <div className="reserva-header">
        <h3 className="reserva-title">{eventoTitulo || 'Evento'}</h3>
        <div className={`pill-led ${statusClass}`}>
          <span className="led"></span>
          {getEstadoTexto(estado)}
        </div>
      </div>
      
      <div className="reserva-meta-row">
        <div>
          <div className="meta-block-title">Fecha del Evento</div>
          <div className="meta-block-value">
            <span className="icon-wrapper">🗓️</span>
            <span>{formatDate(eventoFecha)}</span>
          </div>
        </div>
        <div>
          <div className="meta-block-title">Entradas</div>
          <div className="meta-block-value">
            <span className="icon-wrapper">🎟️</span>
            <span>{cantidadTickets} {cantidadTickets === 1 ? 'entrada' : 'entradas'}</span>
          </div>
        </div>
      </div>

      <div className="ticket-code-box">
        <div className="meta-block-title">Código Único de Entrada</div>
        <div className={`ticket-code-value ${estado === 'CANCELADA' ? 'ticket-cancelado' : ''}`}>
          {codigoTicket}
        </div>
      </div>

      {estado === 'PENDIENTE_PAGO' && (
        <div className="reserva-actions">
          {onConfirmarPago && (
            <button 
              className="btn-pagar" 
              onClick={() => onConfirmarPago(id)}
            >
              ✅ Pagar
            </button>
          )}
          <button 
            className="btn-cancelar" 
            onClick={handleCancelar}
          >
            ❌ Cancelar
          </button>
        </div>
      )}
    </div>
  );
};