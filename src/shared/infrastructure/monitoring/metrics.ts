import { Counter, Gauge, Histogram, register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();

export const reservasCreadas = new Counter({
  name: 'reservas_creadas_total',
  help: 'Total de reservas creadas'
});

export const userQuantity = new Gauge({
  name: 'cantidad_usuarios',
  help: 'cantidad de usuarios'  
});

export const usedRoutes = new Counter({
  name: 'rutas_mas_usadas',
  help: 'Conteo de uso por ruta',
  labelNames: ['method', 'route', 'status']
});

export const responseTime = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duración de requests HTTP en ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [50, 100, 200, 500, 1000, 2000]
});

export { register };