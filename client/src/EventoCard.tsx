interface Evento {
  id: string
  titulo: string
  lugar: string
  precio: number
}

interface Props {
  evento: Evento
}

function EventoCard({ evento }: Props) {
  return (
    <div className="evento-card">
      <h3>{evento.titulo}</h3>
      <p>📍 {evento.lugar}</p>
      <div className="precio">
        {evento.precio === 0 ? 'Gratis' : `$${evento.precio}`}
      </div>
    </div>
  )
}

export default EventoCard