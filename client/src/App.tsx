import { useState, useEffect } from 'react'
import EventoCard from './components/EventoCard'
import Login from './components/Login'
import Register from './components/Register'
import CrearEvento from './components/CrearEvento'
import MyReservations from './components/MyReservations'
import ComprarModal from './components/ComprarModal'
import MyEvents from './components/MyEvents'
import UserProfile from './components/UserProfile'

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

interface UserProfileData {
  id: string
  nombre: string
  email: string
  rol: string
}

function App() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [comprando, setComprando] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<{id: string, titulo: string} | null>(null)
  const [reservas, setReservas] = useState<any[]>([])
  const [misEventos, setMisEventos] = useState<any[]>([])

  const [tabActiva, setTabActiva] = useState<'explorar' | 'mis-reservas' | 'panel-organizador' | 'perfil'>('explorar')
  const [profile, setProfile] = useState<UserProfileData | null>(null)

  // --- Operaciones API ---
  const cargarReservas = () => {
    if (!token) return
    fetch('/api/v1/reservas/mis-reservas', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data.success) setReservas(data.data) })
      .catch(err => console.error('Error al cargar reservas:', err))
  }

  const recargarEventos = () => {
    fetch('/api/v1/eventos')
      .then(res => res.json())
      .then(data => { if (data.success) setEventos(data.data) })
  }

  const cargarMisEventos = () => {
    fetch('/api/v1/eventos/mis-eventos', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data.success) setMisEventos(data.data) })
  }

  const cargarPerfil = () => {
    if (!token) return
    fetch('/api/v1/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { 
        if (data.success) setProfile(data.data) 
      })
      .catch(err => console.error('Error al cargar perfil:', err))
  }

  // Funciones para actualizar perfil
  const handleUpdateNombre = async (nuevoNombre: string) => {
    const response = await fetch('/api/v1/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre: nuevoNombre })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar nombre')
    }

    if (data.success) {
      // En lugar de confiar ciegamente en lo que venga del backend,
      // actualizamos de forma reactiva y funcional manteniendo los datos anteriores intactos (como el rol)
      setProfile(prev => prev ? { ...prev, nombre: nuevoNombre } : null)
      setUser(prev => prev ? { ...prev, nombre: nuevoNombre } : null)
      
      // Actualizamos el localStorage de forma segura
      try {
        const userGuardado = localStorage.getItem('user')
        if (userGuardado) {
          const parsedUser = JSON.parse(userGuardado)
          parsedUser.nombre = nuevoNombre
          localStorage.setItem('user', JSON.stringify(parsedUser))
        }
      } catch (e) {
        console.error("Error al guardar el nombre en localStorage", e)
      }
    }
  }

  const handleUpdateEmail = async (nuevoEmail: string) => {
    const response = await fetch('/api/v1/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email: nuevoEmail })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar email')
    }

    if (data.success) {
      //Lo mismo aquí: conservamos el ID, el rol y el nombre, solo mutamos el email
      setProfile(prev => prev ? { ...prev, email: nuevoEmail } : null)
      setUser(prev => prev ? { ...prev, email: nuevoEmail } : null)
      
      try {
        const userGuardado = localStorage.getItem('user')
        if (userGuardado) {
          const parsedUser = JSON.parse(userGuardado)
          parsedUser.email = nuevoEmail
          localStorage.setItem('user', JSON.stringify(parsedUser))
        }
      } catch (e) {
        console.error("Error al guardar el email in localStorage", e)
      }
    }
  }

  const handleLogin = (nuevoToken: string, nuevoUser: User) => {
    setToken(nuevoToken)
    setUser(nuevoUser)
    localStorage.setItem('token', nuevoToken)
    localStorage.setItem('user', JSON.stringify(nuevoUser))
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setTabActiva('explorar')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const handleAbrirModal = (eventoId: string, eventoTitulo: string) => {
    if (!token) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setEventoSeleccionado({ id: eventoId, titulo: eventoTitulo })
  }

  const handleConfirmarCompra = async (cantidad: number) => {
    if (!eventoSeleccionado || !token) return
    setComprando(true)
    try {
      const response = await fetch('/api/v1/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventoId: eventoSeleccionado.id, cantidadTickets: cantidad })
      })
      const data = await response.json()
      if (data.success) {
        setEventoSeleccionado(null)
        cargarReservas()
      } else { alert(data.message) }
    } catch { alert('Error al crear reserva') } finally { setComprando(false) }
  }

  const handleConfirmarPago = async (reservaId: string) => {
    try {
      const response = await fetch(`/api/v1/reservas/${reservaId}/pagar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) cargarReservas()
      else alert(data.message)
    } catch { alert('Error al confirmar pago') }
  }

  const handleCancelarReserva = async (reservaId: string) => {
    try {
      const response = await fetch(`/api/v1/reservas/${reservaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) cargarReservas()
      else alert(data.message)
    } catch { alert('Error al cancelar reserva') }
  }

  const handlePublicarEvento = async (eventoId: string) => {
    if (!token) return
    try {
      const response = await fetch(`/api/v1/eventos/${eventoId}/publicar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) { recargarEventos(); cargarMisEventos(); }
      else alert(data.message)
    } catch { alert('Error al publicar evento') }
  }

  const handleCancelarEvento = async (eventoId: string) => {
    if (!token) return
    try {
      const response = await fetch(`/api/v1/eventos/${eventoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) { recargarEventos(); cargarMisEventos(); }
      else alert(data.message)
    } catch { alert('Error al cancelar evento') }
  }

  // --- Effect Hooks ---
  useEffect(() => {
    // Cambios Defensivos contra bloqueos de Sandboxing y datos corruptos stringificados
    try {
      const tokenGuardado = localStorage.getItem('token')
      const userGuardado = localStorage.getItem('user')
      
      if (tokenGuardado && userGuardado && userGuardado !== "undefined" && userGuardado !== "null") {
        setToken(tokenGuardado)
        setUser(JSON.parse(userGuardado))
      }
    } catch (error) {
      console.warn("El almacenamiento local está bloqueado o corrupto en este entorno de desarrollo.", error)
    }
  }, [])

  useEffect(() => {
    fetch('/api/v1/eventos')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEventos(data.data)
        setCargando(false)
      })
      .catch(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (token) cargarReservas()
    else setReservas([])
  }, [token])
  
  useEffect(() => {
    if (token && user?.rol === 'ORGANIZADOR') cargarMisEventos()
    else setMisEventos([])
  }, [token, user])

  useEffect(() => {
    if (token) {
      cargarPerfil()
    } else {
      setProfile(null)
    }
  }, [token])

  return (
    <div className="app">

      {/* ===== HEADER CON NAVEGACIÓN DE PESTAÑAS ===== */}
      <header className="header">
        <div className="container header-content">
          <h1>Eventify</h1>
          
          <nav className="nav-tabs">
            <button 
              onClick={() => setTabActiva('explorar')}
              className={`nav-link ${tabActiva === 'explorar' ? 'active' : ''}`}
            >
              Explorar
            </button>
            
            {token && (
              <button 
                onClick={() => setTabActiva('mis-reservas')}
                className={`nav-link ${tabActiva === 'mis-reservas' ? 'active' : ''}`}
              >
                Mis Reservas ({reservas.length})
              </button>
            )}

            {token && user?.rol === 'ORGANIZADOR' && (
              <button 
                onClick={() => setTabActiva('panel-organizador')}
                className={`nav-link ${tabActiva === 'panel-organizador' ? 'active' : ''}`}
              >
                Panel Organizador
              </button>
            )}

            {token && (
              <button 
                onClick={() => setTabActiva('perfil')}
                className={`nav-link ${tabActiva === 'perfil' ? 'active' : ''}`}
              >
                Mi Perfil
              </button>
            )}
          </nav>

          <div className="header-user">
            {token && user ? (
              <>
                {/* Optional chaining defensivo para evitar caídas catastróficas en el render */}
                <span><strong>[{user?.rol?.toLowerCase() || 'usuario'}]</strong> {user?.nombre || ''}</span>
                <button onClick={handleLogout} className="btn btn-outline" style={{padding: '6px 12px', fontSize: '0.85rem'}}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <span style={{fontSize: '0.9rem', opacity: 0.9}}>Invitado</span>
            )}
          </div>
        </div>
      </header>

      {/* ===== CUERPO PRINCIPAL ===== */}
      <main className="main">
        <div className="container">

          {/* VISTA 1: EXPLORAR EVENTOS */}
          {tabActiva === 'explorar' && (
            <>
              {!token && (
                <div className="hero-banner">
                  <div className="hero-text">
                    <h2>Encuentra tus próximos eventos favoritos</h2>
                    <p>Reserva entradas para conciertos, conferencias y talleres exclusivos de forma inmediata y 100% segura.</p>
                  </div>
                  <div className="hero-auth-box">
                    {mostrarRegistro ? <Register onLogin={handleLogin} /> : <Login onLogin={handleLogin} />}
                    <p className="form-toggle">
                      {mostrarRegistro ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                      <button onClick={() => setMostrarRegistro(!mostrarRegistro)}>
                        {mostrarRegistro ? 'Inicia sesión' : 'Regístrate aquí'}
                      </button>
                    </p>
                  </div>
                </div>
              )}

              <h2 className="section-title">Eventos Disponibles</h2>
              {cargando ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                  <p style={{color: '#666', fontSize: '0.9rem'}}>Cargando cartelera de eventos...</p>
                </div>
              ) : eventos.length === 0 ? (
                <p className="empty">No hay eventos publicados en este momento.</p>
              ) : (
                <div className="eventos-grid">
                  {eventos.map(evento => (
                    <div key={evento.id} className="evento-card">
                      <EventoCard evento={evento} onComprar={handleAbrirModal} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* VISTA 2: MIS RESERVAS */}
          {tabActiva === 'mis-reservas' && token && (
            <div className="card">
              <MyReservations 
                reservas={reservas}
                onConfirmarPago={handleConfirmarPago}
                onCancelar={handleCancelarReserva} 
              />
            </div>
          )}

          {/* VISTA 3: PANEL DEL ORGANIZADOR */}
          {tabActiva === 'panel-organizador' && token && user?.rol === 'ORGANIZADOR' && (
            <div className="dashboard-grid">
              <div className="card">
                <CrearEvento token={token} onEventoCreado={recargarEventos} />
              </div>
              <div className="card">
                <MyEvents 
                  eventos={misEventos} 
                  onPublicarEvento={handlePublicarEvento} 
                  onCancelarEvento={handleCancelarEvento} 
                />
              </div>
            </div>
          )}

          {/* VISTA 4: PERFIL DE USUARIO */}
          {tabActiva === 'perfil' && token && (
            <div className="card">
              <UserProfile 
                profile={profile} 
                onUpdateNombre={handleUpdateNombre}
                onUpdateEmail={handleUpdateEmail}
              />
            </div>
          )}

        </div>
      </main>

      {/* ===== MODAL DE COMPRA ===== */}
      {eventoSeleccionado && (
        <ComprarModal
          eventoTitulo={eventoSeleccionado.titulo}
          cargando={comprando}
          onConfirmar={handleConfirmarCompra}
          onCerrar={() => setEventoSeleccionado(null)}
        />
      )}
      
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <h3>Eventify</h3>
            <p>La plataforma ideal para descubrir y gestionar tus eventos favoritos.</p>
          </div>
          <div className="footer-links">
            <h4>Explorar</h4>
            <ul>
              <li><a href="#">Todos los eventos</a></li>
              <li><a href="#">Conciertos</a></li>
              <li><a href="#">Conferencias</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Soporte</h4>
            <ul>
              <li><a href="#">Ayuda y FAQ</a></li>
              <li><a href="#">Términos de servicio</a></li>
              <li><a href="#">Contacto</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 Eventify. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default App