import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from '@shared/api/middlewares/errorHandler';
import { v1Routes } from '@shared/api/routes/v1';
import { register } from '@shared/infrastructure/monitoring/metrics';
import { metricsMiddleware } from '@shared/api/middlewares/metrics.middleware';
import { startReservationExpiryWorker } from '@shared/workers/reservationExpiry.worker';
import { expireReservationHandler } from '@shared/infrastructure/di/container';
import { validateEnv } from '@shared/infrastructure/config/env.validator'
import { connectRedis } from '@shared/infrastructure/cache/redis.client'

// Cargar variables de entorno desde archivo .env
dotenv.config();
//valido las variables de entorno
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARES GLOBALES ====================

// Helmet: Seguridad - protege contra vulnerabilidades conocidas (XSS, clickjacking, etc.)
app.use(helmet());

// CORS: Permite peticiones desde otros dominios (útil para APIs públicas)
app.use(cors());

// JSON: Parsea body de requests con Content-Type: application/json
app.use(express.json());

// URL Encoded: Parsea body de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Morgan: Logging de requests HTTP en consola (formato 'dev' para desarrollo)
app.use(morgan('dev'));

// Metrics Middleware: Registra métricas personalizadas para cada request (tiempos, conteo de rutas)
app.use(metricsMiddleware);

// ==================== RATE LIMITING ====================

// Limitar solicitudes para evitar abusos y ataques DDoS
// Revisa si la terminal ejecutó el comando con el flag personalizado
const isLoadTest = process.argv.includes('--isLoadTest');

if (!isLoadTest) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde'
  });
  app.use('/api', limiter);
}

// ==================== ENDPOINTS PÚBLICOS ====================

// Health check: Verifica que el servicio esté funcionando
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Metrics endpoint: Expone métricas para Prometheus u otros sistemas de monitoreo
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType); // Tipo de contenido prometheus
  res.end(await register.metrics()); // Devuelve todas las métricas registradas
});

// ==================== RUTAS DE LA API ====================

// Versión 1 de la API (todas las rutas comienzan con /api/v1)
app.use('/api/v1', v1Routes);

// ==================== MANEJADOR DE ERRORES ====================

// Middleware global para manejar errores (siempre al final)
app.use(errorHandler);

// ==================== INICIAR SERVIDOR ====================

const startServer = async () => {
  try {
    // 1. Conectar a infraestructura crítica primero
    console.log('Conectando a Redis...');
    await connectRedis();
    
    // 2. Inicializar Workers asíncronos
    startReservationExpiryWorker(expireReservationHandler);
    console.log('Worker de expiración de reservas iniciado');

    // 3. Abrir el puerto para recibir tráfico web
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`==================================================`);
    });

  } catch (error) {
    console.error('Error crítico al iniciar el sistema:', error);
    process.exit(1); // Detener el proceso si la infraestructura falla
  }
};

startServer();

export default app;