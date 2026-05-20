import { useState, useEffect } from 'react'
// useState: Para crear estados (reservas, cargando, error)
// useEffect: Para ejecutar código cuando el componente se monta

//INTERFACE - Definimos la forma de los datos (TypeScript)
interface Reserva {
  id: string           
  eventoTitulo: string      
  eventoFecha: string            
  cantidadTickets: number   
  estado: string           
  codigoTicket: string      
}


//PROPS - Lo que recibe el componente desde el padre (App)
interface Props {
  token: string  
}

//COMPONENTE - Función principal que renderiza la pantalla
function MisReservas({ token }: Props) {
  // reservas: Array donde se guardan las reservas del usuario
  // setReservas: Función para actualizar ese array
  const [reservas, setReservas] = useState<Reserva[]>([])    
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  
  //useEffect - Se ejecuta AL PRINCIPIO (cuando el componente se monta)
  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const response = await fetch('/api/v1/reservas/mis-reservas', {
          method: 'GET',           
          headers: {
            'Authorization': `Bearer ${token}`, // Autenticación (obligatorio)
            'Content-Type': 'application/json'   // Tipo de datos que esperamos
          }
        })
        // CONVERTIR respuesta a JSON
        const data = await response.json()
        if (data.success) {
          setReservas(data.data)
        } else {
          setError(data.message || 'Error al cargar reservas')
        }
      } catch (error) {
        setError('Error al conectar con el servidor')
      } finally {
        setCargando(false)
      }
    }
    if (token) {
      fetchReservas()  // Si hay token, llamamos a la API
    }
  }, [token]) // El array [token] significa: "vuelve a ejecutar si token cambia"

  //RENDERIZADO CONDICIONAL - Mostrar diferentes cosas según el estado

  //SI está cargando → muestra "Cargando..."
  if (cargando) {
    return <div className="cargando">Cargando reservas...</div>
  }

  //SI hay error → muestra el mensaje de error
  if (error) {
    return <div className="error">{error}</div>
  }

  //SI no hay reservas → mensaje informativo
  if (reservas.length === 0) {
    return <div className="sin-reservas">No tienes reservas aún</div>
  }

  // 8. RENDERIZADO PRINCIPAL - Mostrar la lista de reservas
  return (
    <div className="mis-reservas">
      <h2>Mis Reservas</h2>
      <div className="reservas-lista">
        {reservas.map((reserva) => (
          <div key={reserva.id} className="reserva-card">
            <h3>{reserva.eventoTitulo}</h3>
            <div className="reserva-detalles">
              <p>
                <strong>Fecha:</strong> {new Date(reserva.eventoFecha).toLocaleDateString()}
              </p>
              <p>
                <strong>Cantidad de tickets:</strong> {reserva.cantidadTickets}
              </p>
              <p>
                <strong>Estado:</strong> 
                <span className={`estado ${reserva.estado.toLowerCase()}`}>
                  {reserva.estado}
                </span>
              </p>
              <p>
                <strong>Código del ticket:</strong> 
                <code className="codigo-ticket">{reserva.codigoTicket}</code>
              </p>
              
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default MisReservas