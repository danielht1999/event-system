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
      <h3>{evento.titulo}</h3>
      <p>📍 {evento.lugar}</p>
      <div className="precio">
        {evento.precio === 0 ? 'Gratis' : `$${evento.precio}`}
      </div>
      <p>{evento.cuposDisponibles} cupos disponibles</p>
      <button
        className="btn btn-primary"
        style={{ marginTop: '12px' }}
        onClick={() => onComprar(evento.id, evento.titulo)}
        disabled={evento.cuposDisponibles === 0}
      >
        {evento.cuposDisponibles === 0 ? 'Sin cupos' : 'Comprar Ticket'}
      </button>
    </div>
  )
}

export default EventoCard