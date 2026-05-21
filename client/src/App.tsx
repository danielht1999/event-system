import { useState, useEffect } from 'react'
import EventoCard from './components/EventoCard'
import Login from './components/Login'
import Register from './components/Register'
import CrearEvento from './components/CrearEvento'
import MyReservations from './components/MyReservations'
import ComprarModal from './components/ComprarModal'

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

function App() {
  // ── Estado global de la app ──────────────────────────────
  const [eventos, setEventos] = useState<Evento[]>([])      // lista de eventos de la API
  const [cargando, setCargando] = useState(true)            // spinner mientras carga
  const [comprando, setComprando] = useState(false)         // loader exclusivo para el botón del modal
  const [token, setToken] = useState<string | null>(null)   // JWT del usuario logueado
  const [user, setUser] = useState<User | null>(null)       // datos del usuario logueado
  const [mostrarRegistro, setMostrarRegistro] = useState(false) // alterna login/registro
  const [eventoSeleccionado, setEventoSeleccionado] = useState<{id: string, titulo: string} | null>(null) // Estado del modal  
  const [reservas, setReservas] = useState<any[]>([])       // Estado de reservas compartido

  // ── Función para cargar reservas desde la API ───────────
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

  // Cargar reservas cuando el token cambia (inicio de sesión o restauración)
  useEffect(() => {
    if (token) {
      cargarReservas()
    } else {
      setReservas([]) // Limpia el estado al cerrar sesión
    }
  }, [token])

  const handleAbrirModal = (eventoId: string, eventoTitulo: string) => {
    if (!token) {
      // Sin sesion → sube al login
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setEventoSeleccionado({ id: eventoId, titulo: eventoTitulo })
  }

  // Se llama cuando el usuario confirma la cantidad en el modal
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
        cargarReservas()            // Recarga el listado al instante (Sincronización Opción B)
      } else {
        alert(data.message)
      }
    } catch {
      alert('Error al crear reserva')
    } finally {
      setComprando(false) // Libera el botón pase lo que pase
    }
  }

  // ── Al iniciar: recupera sesion guardada en localStorage ─
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token')
    const userGuardado = localStorage.getItem('user')
    if (tokenGuardado && userGuardado) {
      setToken(tokenGuardado)
      setUser(JSON.parse(userGuardado))
    }
  }, [])

  // ── Al iniciar: carga eventos desde la API ───────────────
  useEffect(() => {
    fetch('/api/v1/eventos')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEventos(data.data)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  // ── Guarda token y user al hacer login o registro ────────
  const handleLogin = (nuevoToken: string, nuevoUser: User) => {
    setToken(nuevoToken)
    setUser(nuevoUser)
    localStorage.setItem('token', nuevoToken)
    localStorage.setItem('user', JSON.stringify(nuevoUser))
  }

  // ── Borra token y user al cerrar sesion ──────────────────
  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
    
  // ── recarga los eventos(los eventos creados) ──────────────────
  const recargarEventos = () => {
    fetch('/api/v1/eventos')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEventos(data.data)
      })
  }

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

const handleCancelar = async (reservaId: string) => {
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

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="container header-content">
          <h1>Sistema de Eventos</h1>
          {token && user && (
            <div className="header-user">
              <span>Hola, {user.nombre}</span>
              <button onClick={handleLogout} className="btn btn-outline">
                Cerrar Sesion
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <div className="container">

          {/* ── Auth ── */}
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
                  {mostrarRegistro ? 'Inicia sesion' : 'Registrate'}
                </button>
              </p>
            </div>
          )}

          {/* ── CrearEvento: solo visible si es ORGANIZADOR ── */}
          {token && user?.rol === 'ORGANIZADOR' && (
            <CrearEvento token={token} onEventoCreado={recargarEventos} />
          )}
          
          {/* ── Mis Reservas: Solo visible si el usuario inició sesión ── */}
          {token && <MyReservations reservas={reservas}
            onConfirmarPago={handleConfirmarPago}
            onCancelar={handleCancelar} />
          }

          {/* ── Lista de eventos ── */}
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

          {/* ── Modal de Compra ── */}
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