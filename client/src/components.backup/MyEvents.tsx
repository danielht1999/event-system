// client/src/components/MyEvents.tsx
interface Evento {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  lugar: string
  capacidad: number
  cuposDisponibles: number
  precio: number
  estado: string
}

interface Props {
  eventos: Evento[]
  onPublicarEvento: (eventoId: string) => void
  onCancelarEvento: (eventoId: string) => void
}

function MyEvents({ eventos, onPublicarEvento, onCancelarEvento }: Props) {
  if (!eventos || eventos.length === 0) {
    return (
      <div className="panel-box">
        <h2 className="panel-box-title">Mis Eventos</h2>
        <p className="empty">No tienes eventos creados.</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible'
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  return (
    <div className="panel-box">
      <h2 className="panel-box-title">Mis Eventos</h2>
      
      <div className="eventos-list">
        {eventos.map((evento) => (
          <div key={evento.id} className="managed-event-card">
            <h3 className="managed-event-title">{evento.titulo}</h3>
            
            <div className="data-grid">
  <div className="data-item">
    <div className="data-item-header">
      <span className="icon-wrapper">🗓️</span>
      <span className="data-label">Fecha</span>
    </div>
    <span className="data-value">{formatDate(evento.fecha)}</span>
  </div>
      <div className="data-item">
        <div className="data-item-header">
          <span className="icon-wrapper">📍</span>
          <span className="data-label">Lugar</span>
        </div>
        <span className="data-value">{evento.lugar}</span>
      </div>

      <div className="data-item">
        <div className="data-item-header">
          <span className="icon-wrapper">⚙️</span>
          <span className="data-label">Estado</span>
        </div>

        <div className={`pill-led ${evento.estado === 'PUBLICADO' ? 'success' : 'warning'}`}>
          <span className="led"></span>
          {evento.estado === 'PUBLICADO' ? 'PUBLICADO' : 'BORRADOR'}
        </div>
      </div>

      <div className="data-item">
        <div className="data-item-header">
          <span className="icon-wrapper">👥</span>
          <span className="data-label">Cupos</span>
        </div>
        <span className="data-value">
          {evento.cuposDisponibles} disponibles
        </span>
      </div>
    </div>
            <div className="event-actions">
              {evento.estado !== 'PUBLICADO' && (
                <button 
                  className="btn-publicar" 
                  onClick={() => onPublicarEvento(evento.id)}
                >
                  📢 Publicar
                </button>
              )}
              <button 
                className="btn-eliminar" 
                onClick={() => onCancelarEvento(evento.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyEvents