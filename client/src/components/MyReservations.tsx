interface Props {
  reservas: any[]
  onConfirmarPago: (reservaId: string) => void
  onCancelar: (reservaId: string) => void
}

function MisReservas({ reservas, onConfirmarPago, onCancelar }: Props) {   
  if (reservas.length === 0) {
    return (
      <div className="sin-reservas-container">
        <div className="sin-reservas-icono">
          <span className="icono-migracion">🎟️</span>
        </div>
        <h3>No tienes reservas aún</h3>
        <p>Explora la cartelera de eventos y asegura tu lugar en los mejores eventos.</p>
      </div>
    )
  }

  return (
    <div className="mis-reservas-section">
      <h2 className="section-title-clean">Mis Reservas</h2>
      <div className="reservas-grid-layout">
        {reservas.map((reserva) => (
          <div key={reserva.id} className="reserva-card-premium">
            <div className="reserva-card-header">
              <h3>{reserva.eventoTitulo}</h3>
              <span className={`badge-estado ${reserva.estado.toLowerCase()}`}>
                {reserva.estado === 'PENDIENTE_PAGO' ? '⏳ Pendiente de Pago' : `✓ ${reserva.estado}`}
              </span>
            </div>

            <div className="reserva-card-body">
              <div className="meta-group">
                <span className="meta-label">Fecha del Evento</span>
                <span className="meta-value">
                  <span className="icono-migracion">📅</span> {new Date(reserva.eventoFecha).toLocaleDateString()}
                </span>
              </div>
              
              <div className="meta-group">
                <span className="meta-label">Entradas</span>
                <span className="meta-value">
                  <span className="icono-migracion">🎟️</span> {reserva.cantidadTickets} {reserva.cantidadTickets === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>

              <div className="meta-group full-width">
                <span className="meta-label">Código Único de Entrada</span>
                <code className="codigo-ticket-styled">{reserva.codigoTicket || 'Generando código...'}</code>
              </div>
            </div>

            {reserva.estado === 'PENDIENTE_PAGO' && (
              <div className="reserva-card-actions">
                <button className="btn-action btn-pay" onClick={() => onConfirmarPago(reserva.id)}>
                  <span className="icono-migracion">💳</span> Proceder al Pago
                </button>
                <button className="btn-action btn-cancel" onClick={() => onCancelar(reserva.id)}>
                  Cancelar Reserva
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MisReservas