import { useState, useEffect } from 'react'
import EventoCard from './EventoCard'
import Login from './components/Login'
import Register from './components/Register'
import CrearEvento from './components/CrearEvento'
import MyReservations from './components/MyReservations'

interface Evento {
  id: string
  titulo: string
  lugar: string
  precio: number
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
  const [token, setToken] = useState<string | null>(null)   // JWT del usuario logueado
  const [user, setUser] = useState<User | null>(null)       // datos del usuario logueado
  const [mostrarRegistro, setMostrarRegistro] = useState(false) // alterna login/registro

  // ── Al iniciar: recupera sesion guardada en localStorage ─
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token')
    const userGuardado = localStorage.getItem('user')
    if (tokenGuardado && userGuardado) {
      setToken(tokenGuardado)
      setUser(JSON.parse(userGuardado))
    }
  }, []) // [] = solo se ejecuta una vez al montar el componente

  // ── Al iniciar: carga eventos desde la API ───────────────
  useEffect(() => {
    fetch('/api/v1/eventos')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEventos(data.data)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, []) // [] = solo una vez, no depende de ningún estado

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

  return (
    <div className="app">

      {/* ── Header: siempre visible ── */}
      <header className="header">
        <div className="container header-content">
          <h1>Sistema de Eventos</h1>

          {/* Solo muestra nombre y logout si hay sesion activa */}
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

          {/* ── Auth: solo visible si NO hay sesion ── */}
          {!token && (
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
              {/* Alterna entre Login y Register segun mostrarRegistro */}
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
            <CrearEvento token={token} onEventoCreado={recargarEventos} /> /* ──al crear exitosamente un evento recarga la lista ── */
          )}
          {token && <MyReservations token={token} />}

          {/* ── Lista de eventos: siempre visible ── */}
          <h2 className="section-title">Eventos disponibles</h2>
          {cargando ? (
            <p className="empty">Cargando eventos...</p>
          ) : eventos.length === 0 ? (
            <p className="empty">No hay eventos disponibles</p>
          ) : (
            <div className="eventos-grid">
              {eventos.map(evento => (
                <EventoCard key={evento.id} evento={evento} />
              ))}
            </div>
          )}

        </div>
      </main>

    </div>
  )
}

export default App