// UserProfile.tsx
import { useState } from 'react'

interface UserProfile {
  id: string
  nombre: string
  email: string
  rol: string
}

interface Props {
  profile: UserProfile | null
  onUpdateNombre: (nuevoNombre: string) => Promise<void>
  onUpdateEmail: (nuevoEmail: string) => Promise<void>
}

function UserProfile({ profile, onUpdateNombre, onUpdateEmail }: Props) {
  const [editando, setEditando] = useState<'nombre' | 'email' | null>(null)
  const [valorEditado, setValorEditado] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  if (!profile) {
    return <div className="sin-profile">No se pudo cargar el perfil</div>
  }

  const iniciarEdicion = (campo: 'nombre' | 'email') => {
    setEditando(campo)
    setValorEditado(campo === 'nombre' ? profile.nombre : profile.email)
    setError('')
  }

  const cancelarEdicion = () => {
    setEditando(null)
    setValorEditado('')
    setError('')
    setCargando(false)
  }

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
    return regex.test(email)
  }

  const guardarCambios = async () => {
    if (!valorEditado.trim()) {
      setError('Este campo no puede estar vacío')
      return
    }

    // Validaciones específicas
    if (editando === 'nombre' && valorEditado.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    if (editando === 'email') {
      if (!validarEmail(valorEditado)) {
        setError('Ingresa un email válido (ejemplo: usuario@correo.com)')
        return
      }
      
      if (valorEditado === profile.email) {
        setError('El email es igual al actual')
        return
      }
    }

    if (editando === 'nombre' && valorEditado === profile.nombre) {
      setError('El nombre es igual al actual')
      return
    }

    setCargando(true)
    setError('')

    try {
      if (editando === 'nombre') {
        await onUpdateNombre(valorEditado)
      } else if (editando === 'email') {
        await onUpdateEmail(valorEditado)
      }
      
      // Éxito - cerrar edición
      setEditando(null)
      setValorEditado('')
    } catch (err: any) {
      // El error viene del backend
      setError(err.message || 'Error al actualizar, intenta de nuevo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="perfil-container">
      <h2>Mi Perfil</h2>
      
      <div className="perfil-card">
        {/* Campo NOMBRE */}
        <div className="campo-perfil">
          <label><strong>Nombre:</strong></label>
          
          {editando === 'nombre' ? (
            <div className="campo-edicion">
              <input
                type="text"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarCambios()
                  if (e.key === 'Escape') cancelarEdicion()
                }}
                autoFocus
                disabled={cargando}
              />
              <div className="acciones-edicion">
                <button 
                  onClick={guardarCambios} 
                  className="btn-guardar"
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
                <button 
                  onClick={cancelarEdicion} 
                  className="btn-cancelar"
                  disabled={cargando}
                >
                  Cancelar
                </button>
              </div>
              {error && <div className="error-inline">{error}</div>}
            </div>
          ) : (
            <div className="campo-valor">
              <span>{profile.nombre}</span>
              <button 
                onClick={() => iniciarEdicion('nombre')} 
                className="btn-editar"
                title="Editar nombre"
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Campo EMAIL */}
        <div className="campo-perfil">
          <label><strong>Email:</strong></label>
          
          {editando === 'email' ? (
            <div className="campo-edicion">
              <input
                type="email"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarCambios()
                  if (e.key === 'Escape') cancelarEdicion()
                }}
                autoFocus
                disabled={cargando}
              />
              <div className="acciones-edicion">
                <button 
                  onClick={guardarCambios} 
                  className="btn-guardar"
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
                <button 
                  onClick={cancelarEdicion} 
                  className="btn-cancelar"
                  disabled={cargando}
                >
                  Cancelar
                </button>
              </div>
              {error && <div className="error-inline">{error}</div>}
            </div>
          ) : (
            <div className="campo-valor">
              <span>{profile.email}</span>
              <button 
                onClick={() => iniciarEdicion('email')} 
                className="btn-editar"
                title="Editar email"
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Campo ROL (solo lectura, sin edición) */}
        <div className="campo-perfil">
          <label><strong>Rol:</strong></label>
          <div className="campo-valor">
            <span className={`rol-badge ${profile.rol.toLowerCase()}`}>
              {profile.rol === 'ORGANIZADOR' ? 'Organizador' : 'Usuario'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile