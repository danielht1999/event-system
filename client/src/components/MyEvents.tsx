// PROPS - Recibe los datos listos desde el padre (App)
interface Props {
  eventos: any[]
  onPublicarEvento: (eventoId: string) => void
  onCancelarEvento: (eventoId: string) => void
}

function MyEvents({ eventos, onPublicarEvento, onCancelarEvento }: Props) {   
  if (eventos.length === 0) {
    return <div className="sin-reservas">No tienes eventos aun</div>
  }
  return (
    <div className="mis-eventos">
      <h2>Mis Eventos</h2>
      <div className="eventos-lista">
        {eventos.map((evento) => (
          <div key={evento.id} className="evento-card">
            <h3>{evento.titulo}</h3>
            <div className="evento-detalles">
              <p>
                <strong>Fecha:</strong> {new Date(evento.fecha).toLocaleDateString()}
              </p>
              <p>
                <strong>Lugar:</strong> {evento.lugar}
              </p>
              <p>
                <strong>Estado:</strong> 
                <span className={`estado ${evento.estado.toLowerCase()}`}>
                  {evento.estado}
                </span>
              </p>
              <p>
                <strong>Cupos disponibles:</strong> 
                <code className="codigo-ticket">{evento.cuposDisponibles}</code>
              </p>
            </div>
            {evento.estado === 'BORRADOR' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={() => onPublicarEvento(evento.id)}>
                  Publicar
                </button>
                <button className="btn btn-danger" onClick={() => onCancelarEvento(evento.id)}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyEvents