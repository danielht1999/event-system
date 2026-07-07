interface Evento {
  id: string
  titulo: string
  lugar: string
  precio: number
  cuposDisponibles: number
}

interface Props {
  evento: Evento
  onComprar: (eventoId: string, eventoTitulo: string) => void
}

function EventoCard({ evento, onComprar }: Props) {
  return (
    <div className="evento-card">

      {/* Título */}
      <h3 className="evento-title">
        {evento.titulo}
      </h3>

      {/* Lugar */}
      <div className="evento-meta">
        <span>📍</span>
        <span>{evento.lugar}</span>
      </div>

      {/* Precio */}
      <div className="evento-precio">
        {evento.precio === 0
          ? 'Gratis'
          : `$${evento.precio}`}
      </div>

      {/* Cupos */}
      <div className="evento-cupos">
        {evento.cuposDisponibles > 0 ? (
          <div className="pill-led success">
            <span className="led"></span>
            {evento.cuposDisponibles} CUPOS DISPONIBLES
          </div>
        ) : (
          <div className="pill-led error">
            <span className="led"></span>
            SIN CUPOS
          </div>
        )}
      </div>

      {/* Botón */}
      <button
        className="btn-primary"
        style={{ marginTop: '12px' }}
        onClick={() => onComprar(evento.id, evento.titulo)}
        disabled={evento.cuposDisponibles === 0}
      >
        {evento.cuposDisponibles === 0
          ? 'Sin cupos'
          : 'Comprar Ticket'}
      </button>

    </div>
  )
}

export default EventoCard