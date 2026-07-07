// client/src/components/MyReservations.tsx
interface Reserva {
  id: string
  eventoId: string
  eventoTitulo: string
  eventoFecha: string
  cantidadTickets: number
  estado: string
  codigoTicket: string
}

interface Props {
  reservas: Reserva[]
  onConfirmarPago: (reservaId: string) => void
  onCancelar: (reservaId: string) => void
}

function MyReservations({ reservas, onConfirmarPago, onCancelar }: Props) {
  if (!reservas || reservas.length === 0) {
    return (
      <div className="main-panel">
        <h1 className="panel-title">Mis Reservas</h1>
        <p className="empty">No tienes reservas activas.</p>
      </div>
    )
  }

  const getEstadoPill = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA':
        return 'success'
      case 'CANCELADA':
        return 'error'
      case 'PENDIENTE_PAGO':
        return 'warning'
      default:
        return 'warning'
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA':
        return 'CONFIRMADA'
      case 'CANCELADA':
        return 'CANCELADA'
      case 'PENDIENTE_PAGO':
        return 'PENDIENTE DE PAGO'
      default:
        return estado
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible'
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  return (
    <div className="main-panel">
      <h1 className="panel-title">Mis Reservas</h1>
      
      <div className="reservas-grid">
        {reservas.map((reserva) => (
          <div 
            key={reserva.id} 
            className="reserva-card"
            style={{ borderTop: `3px solid var(--${getEstadoPill(reserva.estado)}-color)` }}
          >
            <div className="reserva-header">
              <h3 className="reserva-title">{reserva.eventoTitulo || 'Evento'}</h3>
              <div className={`pill-led ${getEstadoPill(reserva.estado)}`}>
                <span className="led"></span>
                {getEstadoTexto(reserva.estado)}
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
                  <span>{reserva.cantidadTickets} {reserva.cantidadTickets === 1 ? 'entrada' : 'entradas'}</span>
                </div>
              </div>
            </div>

            <div className="ticket-code-box">
              <div className="meta-block-title">Código Único de Entrada</div>
              <div 
                className={`ticket-code-value ${
                  reserva.estado === 'CANCELADA' ? 'ticket-cancelado' : ''
                }`}
              >
                {reserva.codigoTicket}
              </div>
            </div>

            {reserva.estado === 'PENDIENTE_PAGO' && (
              <div className="reserva-actions">
                <button 
                  className="btn-pagar" 
                  onClick={() => onConfirmarPago(reserva.id)}
                >
                  ✅ Pagar
                </button>
                <button 
                  className="btn-cancelar" 
                  onClick={() => onCancelar(reserva.id)}
                >
                  ❌ Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyReservations