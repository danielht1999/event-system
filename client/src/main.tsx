import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css';  
import App from './app/App'
import { AuthProvider } from './shared/context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>  
      <App />
    </AuthProvider>
  </StrictMode>,
)