// src/server.ts
import './shared/infrastructure/config/env.loader';
import { validateEnv } from '@shared/infrastructure/config/env.validator';

validateEnv(); // Si falta algo, explota con mensaje personalizado

// 2. Ahora que el entorno existe y es seguro, importamos el resto del sistema
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '@shared/api/middlewares/errorHandler';
import { v1Routes } from '@shared/api/routes/v1';
import { register } from '@shared/infrastructure/monitoring/metrics';
import { metricsMiddleware } from '@shared/api/middlewares/metrics.middleware';
import { startReservationExpiryWorker } from '@shared/workers/reservationExpiry.worker';
import { expireReservationHandler } from '@shared/infrastructure/di/container';
import { connectRedis } from '@shared/infrastructure/cache/redis.client';

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', true); // para el load balancer

// ==================== MIDDLEWARES GLOBALES ====================

// Helmet: Seguridad - protege contra vulnerabilidades conocidas (XSS, clickjacking, etc.)
app.use(helmet());

// CORS: Configuracion especifica para permitir origenes especificos
// El middleware CORS controla que origenes pueden hacer peticiones a esta API
// y que metodos y headers estan permitidos.
app.use(cors({
  // Lista de origenes permitidos para hacer peticiones a la API
  origin: [
    'http://localhost:5173',                                 // Frontend en desarrollo local (Vite)
    'http://localhost:3000',                                // Frontend alternativo o backend mismo
    'https://surname-pts-them-teachers.trycloudflare.com',  // Dominio de Cloudflare para exposicion publica
    /\.trycloudflare\.com$/                                 // Cualquier subdominio de trycloudflare (wildcard)
  ],
  credentials: true,                                        // Permite enviar cookies, tokens y headers de autenticacion
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'], // Metodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'], // Headers permitidos en requests
  exposedHeaders: ['Content-Length', 'X-Total-Count'],      // Headers expuestos al cliente
  maxAge: 86400                                             // Tiempo en segundos que el navegador cachea la respuesta preflight (24 horas)
}));

// JSON: Parsea body de requests con Content-Type: application/json
app.use(express.json());

// URL Encoded: Parsea body de formularios URL-encoded
app.use(express.urlencoded({ extended: true }));

// Morgan: Logging de requests HTTP en consola (formato 'dev' para desarrollo)
app.use(morgan('dev'));

// Metrics Middleware: Registra metricas personalizadas para cada request (tiempos, conteo de rutas)
app.use(metricsMiddleware);

// ==================== RATE LIMITING ====================

// Limitar solicitudes para evitar abusos y ataques DDoS
// Revisa si la terminal ejecuto el comando con el flag personalizado
const isLoadTest = process.argv.includes('--isLoadTest');

if (!isLoadTest) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de tiempo: 15 minutos
    max: 100,                 // Maximo de solicitudes por IP en la ventana
    message: 'Demasiadas solicitudes desde esta IP, por favor intente mas tarde'
  });
  app.use('/api', limiter);
}

// ==================== ENDPOINTS PUBLICOS ====================

// Health check: Verifica que el servicio este funcionando
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Metrics endpoint: Expone metricas para Prometheus u otros sistemas de monitoreo
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType); // Tipo de contenido prometheus
  res.end(await register.metrics()); // Devuelve todas las metricas registradas
});

// ==================== RUTAS DE LA API ====================

// Version 1 de la API (todas las rutas comienzan con /api/v1)
app.use('/api/v1', v1Routes);

// ==================== MANEJADOR DE ERRORES ====================

// Middleware global para manejar errores (siempre al final)
app.use(errorHandler);

// ==================== INICIAR SERVIDOR ====================

const startServer = async () => {
  try {
    // 1. Conectar a infraestructura critica primero
    console.log('Conectando a Redis...');
    await connectRedis();
    
    // 2. Inicializar Workers asincronos
    startReservationExpiryWorker(expireReservationHandler);
    console.log('Worker de expiracion de reservas iniciado');

    // 3. Abrir el puerto para recibir trafico web
    app.listen(PORT, () => {
      console.log('==================================================');
      console.log('Servidor corriendo en http://localhost:' + PORT);
      console.log('Ambiente: ' + (process.env.NODE_ENV || 'development'));
      console.log('==================================================');
    });

  } catch (error) {
    console.error('Error critico al iniciar el sistema:', error);
    process.exit(1); // Detener el proceso si la infraestructura falla
  }
};

startServer();

export default app;