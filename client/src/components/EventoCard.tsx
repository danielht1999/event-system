interface Evento {
  id: string
  titulo: string
  lugar: string
  precio: number
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
      <button 
        className="btn btn-primary"
        style={{ marginTop: '12px' }}
        onClick={() => onComprar(evento.id, evento.titulo)}
      >
        Comprar Ticket
      </button>
    </div>
  )
}

export default EventoCard