import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, //Expone la app en tu red local e IP fija (resuelve el problema del IDE)
    port: 5173, //Asegura que siempre use el mismo puerto
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
        // Nota: Si tu backend corre dentro de Docker en una red compartida, 
        // aquí usarías el nombre del servicio de Docker (ej: 'http://backend:3000')
      }
    }
  }
})