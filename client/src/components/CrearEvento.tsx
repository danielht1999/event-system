import { useState } from 'react'

interface Props {
  token: string
  onEventoCreado: () => void
}

function CrearEvento({ token, onEventoCreado }: Props) {

  const [titulo, setTitulo] = useState('')  
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState('')
  const [lugar, setLugar] = useState('')    
  const [capacidad, setCapacidad] = useState('')
  const [precio, setPrecio] = useState('')      
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/eventos', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ titulo, descripcion, fecha, lugar, capacidadTotal: parseInt(capacidad), precio: parseFloat(precio)           }) 
      })

      const data = await response.json()

      if (data.success) {
        onEventoCreado()
        setExito(true) 
        setTitulo('');
        setDescripcion('');
        setFecha('');
        setLugar('');
        setCapacidad('');
        setPrecio('');
         // Oculta el mensaje después de 3 segundos
        setTimeout(() => setExito(false), 3000)
      } else {
        console.log('Error detalle:', data)
        setError(data.message + ' - ' + JSON.stringify(data.details))
      }
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }
  return (
    <div className="card">
      <h2>Crear Evento</h2>
      {exito && <p style={{ color: 'green' }}>Evento creado exitosamente</p>} 
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" placeholder="Título" value={titulo}
            onChange={e => setTitulo(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <textarea placeholder="Descripción" value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input type="datetime-local" placeholder="Fecha" value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input type="text" placeholder="Lugar" value={lugar}
            onChange={e => setLugar(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input type="number" placeholder="Capacidad" value={capacidad}
            onChange={e => setCapacidad(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input type="number" step="0.01" placeholder="Precio" value={precio}
            onChange={e => setPrecio(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando ? 'Cargando...' : 'Crear Evento'}
        </button>
      </form>
    </div>
)
}

export default CrearEvento