import { useState, useEffect } from 'react'
import EventoCard from './components/EventoCard'
import Login from './components/Login'
import Register from './components/Register'
import CrearEvento from './components/CrearEvento'
import MyReservations from './components/MyReservations'
import ComprarModal from './components/ComprarModal'
import MyEvents from './components/MyEvents'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface Evento {
  id: string
  titulo: string
  lugar: string
  precio: number
  cuposDisponibles: number
}

interface User {
  id: string
  nombre: string
  email: string
  rol: string
}

// ============================================================================
// COMPONENTE PRINCIPAL APP
// ============================================================================

function App() {
  
  // --------------------------------------------------------------------------
  // 1. ESTADO GLOBAL DE LA APLICACIÓN
  // --------------------------------------------------------------------------
  
  const [eventos, setEventos] = useState<Evento[]>([])      // Lista de eventos de la API
  const [cargando, setCargando] = useState(true)           // Spinner mientras carga eventos
  const [comprando, setComprando] = useState(false)        // Loader exclusivo para el botón del modal
  const [token, setToken] = useState<string | null>(null)  // JWT del usuario logueado
  const [user, setUser] = useState<User | null>(null)      // Datos del usuario logueado
  const [mostrarRegistro, setMostrarRegistro] = useState(false) // Alterna login/registro
  const [eventoSeleccionado, setEventoSeleccionado] = useState<{id: string, titulo: string} | null>(null) // Estado del modal de compra
  const [reservas, setReservas] = useState<any[]>([])      // Lista de reservas del usuario
  const [misEventos, setMisEventos] = useState<any[]>([])      

  

  // --------------------------------------------------------------------------
  // 2. FUNCIONES DE CARGA DE DATOS (API CALLS)
  // --------------------------------------------------------------------------
  
  /**
   * Carga las reservas del usuario actual desde la API
   */
  const cargarReservas = () => {
    if (!token) return
    fetch('/api/v1/reservas/mis-reservas', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setReservas(data.data)
      })
      .catch(err => console.error('Error al cargar reservas:', err))
  }

  /**
   * Recarga la lista de eventos desde la API
   */
  const recargarEventos = () => {
    fetch('/api/v1/eventos')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEventos(data.data)
      })
  }

  const cargarMisEventos = () =>{
    fetch('/api/v1/eventos/mis-eventos',{
    headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMisEventos(data.data)
      })
  }

  // --------------------------------------------------------------------------
  // 3. MANEJADORES DE AUTENTICACIÓN
  // --------------------------------------------------------------------------
  
  /**
   * Guarda token y datos del usuario al hacer login o registro
   */
  const handleLogin = (nuevoToken: string, nuevoUser: User) => {
    setToken(nuevoToken)
    setUser(nuevoUser)
    localStorage.setItem('token', nuevoToken)
    localStorage.setItem('user', JSON.stringify(nuevoUser))
  }

  /**
   * Limpia la sesión al cerrar sesión
   */
  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // --------------------------------------------------------------------------
  // 4. MANEJADORES DE COMPRA Y RESERVAS
  // --------------------------------------------------------------------------
  
  /**
   * Abre el modal de compra para un evento específico
   */
  const handleAbrirModal = (eventoId: string, eventoTitulo: string) => {
    if (!token) {
      // Sin sesión → sube al login
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setEventoSeleccionado({ id: eventoId, titulo: eventoTitulo })
  }

  /**
   * Confirma la compra de tickets desde el modal
   */
  const handleConfirmarCompra = async (cantidad: number) => {
    if (!eventoSeleccionado || !token) return

    setComprando(true) // Activa el estado de carga en el botón del modal
    try {
      const response = await fetch('/api/v1/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventoId: eventoSeleccionado.id,
          cantidadTickets: cantidad
        })
      })

      const data = await response.json()

      if (data.success) {
        setEventoSeleccionado(null) // Cierra el modal de inmediato
        cargarReservas()            // Recarga el listado al instante
      } else {
        alert(data.message)
      }
    } catch {
      alert('Error al crear reserva')
    } finally {
      setComprando(false) // Libera el botón pase lo que pase
    }
  }

  /**
   * Confirma el pago de una reserva pendiente
   */
  const handleConfirmarPago = async (reservaId: string) => {
    try {
      const response = await fetch(`/api/v1/reservas/${reservaId}/pagar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        cargarReservas()
      } else {
        alert(data.message)
      }
    } catch {
      alert('Error al confirmar pago')
    }
  }

  /**
   * Cancela una reserva existente
   */
  const handleCancelarReserva = async (reservaId: string) => {
    try {
      const response = await fetch(`/api/v1/reservas/${reservaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        cargarReservas()
      } else {
        alert(data.message)
      }
    } catch {
      alert('Error al cancelar reserva')
    }
  }

  const handlePublicarEvento = async (eventoId: string) => {
    if (!token) return
    try {
      const response = await fetch(`/api/v1/eventos/${eventoId}/publicar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        recargarEventos()    // actualiza lista pública
        cargarMisEventos()   // actualiza lista del organizador
      } else {
        alert(data.message)
      }
    } catch {
      alert('Error al publicar evento')
    } 
  }

  const handleCancelarEvento = async (eventoId: string) => {
    if (!token) return
    try {
      const response = await fetch(`/api/v1/eventos/${eventoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success) {
        recargarEventos()    // actualiza lista pública
        cargarMisEventos()   // actualiza lista del organizador
      } else {
        alert(data.message)
      }
    } catch {
      alert('Error al cancelar evento')
    } 
  }




  // --------------------------------------------------------------------------
  // 5. EFECTOS SECUNDARIOS (useEffect)
  // --------------------------------------------------------------------------
  
  /**
   * Restaura la sesión desde localStorage al iniciar la app
   */
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token')
    const userGuardado = localStorage.getItem('user')
    if (tokenGuardado && userGuardado) {
      setToken(tokenGuardado)
      setUser(JSON.parse(userGuardado))
    }
  }, [])

  /**
   * Carga la lista de eventos desde la API al iniciar la app
   */
  useEffect(() => {
    fetch('/api/v1/eventos')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEventos(data.data)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  /**
   * Carga las reservas cuando el token cambia (login/restauración/cierre)
   */
  useEffect(() => {
    if (token) {
      cargarReservas()
    } else {
      setReservas([]) // Limpia el estado al cerrar sesión
    }
  }, [token])
  
  //Carga los eventos del organizador cuando el token o rol cambian
  useEffect(() => {
  if (token && user?.rol === 'ORGANIZADOR') {
    cargarMisEventos()
  } else {
    setMisEventos([])
  }
  }, [token, user])

  // --------------------------------------------------------------------------
  // 6. RENDERIZADO (JSX)
  // --------------------------------------------------------------------------
  
  return (
    <div className="app">

      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="container header-content">
          <h1>Sistema de Eventos</h1>
          {token && user && (
            <div className="header-user">
              <span>Hola, {user.nombre}</span>
              <button onClick={handleLogout} className="btn btn-outline">
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <div className="container">

          {/* ===== SECCIÓN DE AUTENTICACIÓN ===== */}
          {!token && (
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
              {mostrarRegistro ? (
                <Register onLogin={handleLogin} />
              ) : (
                <Login onLogin={handleLogin} />
              )}
              <p className="form-toggle">
                {mostrarRegistro ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                <button onClick={() => setMostrarRegistro(!mostrarRegistro)}>
                  {mostrarRegistro ? 'Inicia sesión' : 'Regístrate'}
                </button>
              </p>
            </div>
          )}

          {/* ===== CREAR EVENTO (solo para ORGANIZADOR) ===== */}
          {token && user?.rol === 'ORGANIZADOR' && (
            <CrearEvento token={token} onEventoCreado={recargarEventos} />
          )}

          {/* ===== EVENTOS CREADOS (solo para ORGANIZADOR) ===== */}
          {token && user?.rol === 'ORGANIZADOR' && (
            <MyEvents eventos={misEventos} 
            onPublicarEvento={handlePublicarEvento} 
            onCancelarEvento={handleCancelarEvento} />
          )}
          
          {/* ===== MIS RESERVAS (solo usuarios autenticados) ===== */}
          {token && (
            <MyReservations 
              reservas={reservas}
              onConfirmarPago={handleConfirmarPago}
              onCancelar={handleCancelarReserva} 
            />
          )}

          {/* ===== LISTA DE EVENTOS DISPONIBLES ===== */}
          <h2 className="section-title">Eventos disponibles</h2>
          {cargando ? (
            <p className="empty">Cargando eventos...</p>
          ) : eventos.length === 0 ? (
            <p className="empty">No hay eventos disponibles</p>
          ) : (
            <div className="eventos-grid">
              {eventos.map(evento => (
                <EventoCard
                  key={evento.id}
                  evento={evento}
                  onComprar={handleAbrirModal}
                />
              ))}
            </div>
          )}

          {/* ===== MODAL DE COMPRA ===== */}
          {eventoSeleccionado && (
            <ComprarModal
              eventoTitulo={eventoSeleccionado.titulo}
              cargando={comprando}
              onConfirmar={handleConfirmarCompra}
              onCerrar={() => setEventoSeleccionado(null)}
            />
          )}

        </div>
      </main>

    </div>
  )
}

export default App