import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/App.css';
import App from './app/App'
import { AuthProvider } from './shared/context/AuthContext'  // ← Importar AuthProvider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>  
      <App />
    </AuthProvider>
  </StrictMode>,
)