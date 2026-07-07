// client/src/components/Login.tsx
import { useState } from 'react'

interface User {
  id: string
  nombre: string
  email: string
  rol: string
}

interface Props {
  onLogin: (token: string, user: User) => void
}

function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        onLogin(data.data.token, data.data.user)
      } else {
        setError(data.message)
      }
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="hero-auth-box">
      <h2>Iniciar sesión</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="input-container">
            <span className="icon-wrapper">📧</span>
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email}
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
        </div>
        <div className="form-group">
          <div className="input-container">
            <span className="icon-wrapper">🔒</span>
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={cargando}>
          {cargando ? 'Cargando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}

export default Login