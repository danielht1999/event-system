// PROPS - Recibe los datos listos desde el padre (App)
interface Props {
  reservas: any[]
}

// COMPONENTE - Función pura que renderiza la pantalla basándose en sus props
function MisReservas({ reservas }: Props) {   

  // RENDERIZADO CONDICIONAL

  // SI no hay reservas aún, mostramos el mensaje informativo.
  // Nota: Al iniciar la app, si el fetch en App tarda unos milisegundos, 
  // caerá aquí brevemente hasta que el array se llene con los datos de la API.
  if (reservas.length === 0) {
    return <div className="sin-reservas">No tienes reservas aún</div>
  }

  // RENDERIZADO PRINCIPAL - Mostrar la lista de reservas actualizada
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