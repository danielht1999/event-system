// client/src/components/UserProfile.tsx
import { useState } from 'react'

interface UserProfileData {
  id: string
  nombre: string
  email: string
  rol: string
}

interface Props {
  profile: UserProfileData | null
  onUpdateNombre: (nuevoNombre: string) => Promise<void>
  onUpdateEmail: (nuevoEmail: string) => Promise<void>
}

function UserProfile({ profile, onUpdateNombre, onUpdateEmail }: Props) {
  const [editando, setEditando] = useState<'nombre' | 'email' | null>(null)
  const [valorEditado, setValorEditado] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  if (!profile) {
    return (
      <div className="main-panel">
        <h1 className="panel-title">Mi Perfil</h1>
        <p className="empty">No se pudo cargar el perfil</p>
      </div>
    )
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
    <div className="main-panel">
      <h1 className="panel-title">Mi Perfil</h1>
      
      {/* FILA: NOMBRE */}
      <div className="profile-row">
        <div className="profile-info">
          <span className="info-label">Nombre</span>
          {editando === 'nombre' ? (
            <div>
              <div className="edit-mode">
                <input
                  type="text"
                  className="edit-input"
                  value={valorEditado}
                  onChange={(e) => setValorEditado(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') guardarCambios()
                    if (e.key === 'Escape') cancelarEdicion()
                  }}
                  autoFocus
                  disabled={cargando}
                />
                <button className="btn-save" onClick={guardarCambios} disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
                <button className="btn-cancel" onClick={cancelarEdicion} disabled={cargando}>
                  Cancelar
                </button>
              </div>
              {error && <div className="error-inline">{error}</div>}
            </div>
          ) : (
            <>
              <span className="info-value">{profile.nombre}</span>
              {/* Si hubo un error global previo intentando guardar nombre */}
              {error && editando === null && <div className="error-inline">{error}</div>}
            </>
          )}
        </div>
        {editando !== 'nombre' && (
          <button 
            className="btn-edit-profile" 
            onClick={() => iniciarEdicion('nombre')}
            title="Editar nombre"
          >
            ✏️
          </button>
        )}
      </div>

      {/* FILA: EMAIL */}
      <div className="profile-row">
        <div className="profile-info">
          <span className="info-label">Correo electrónico</span>
          {editando === 'email' ? (
            <div>
              <div className="edit-mode">
                <input
                  type="email"
                  className="edit-input"
                  value={valorEditado}
                  onChange={(e) => setValorEditado(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') guardarCambios()
                    if (e.key === 'Escape') cancelarEdicion()
                  }}
                  autoFocus
                  disabled={cargando}
                />
                <button className="btn-save" onClick={guardarCambios} disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
                <button className="btn-cancel" onClick={cancelarEdicion} disabled={cargando}>
                  Cancelar
                </button>
              </div>
              {error && <div className="error-inline">{error}</div>}
            </div>
          ) : (
            <>
              <span className="info-value">{profile.email}</span>
              {/* Si hubo un error global previo intentando guardar email */}
              {error && editando === null && <div className="error-inline">{error}</div>}
            </>
          )}
        </div>
        {editando !== 'email' && (
          <button 
            className="btn-edit-profile" 
            onClick={() => iniciarEdicion('email')}
            title="Editar email"
          >
            ✏️
          </button>
        )}
      </div>

      {/* FILA: ROL */}
      <div className="profile-row">
        <div className="profile-info">
          <span className="info-label">Rol Asignado</span>
          <div className="pill-led success">
            <span className="led"></span>
            {profile.rol === 'ORGANIZADOR' ? 'Organizador' : 'Usuario'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile