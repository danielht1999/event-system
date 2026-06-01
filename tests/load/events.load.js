import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuración de la carga (Rampas de estrés progresivo)
export const options = {
  stages: [
    { duration: '20s', target: 20 },  // Rampa de subida: de 0 a 20 usuarios virtuales
    { duration: '40s', target: 50 },  // Estrés moderado: sube a 50 usuarios
    { duration: '40s', target: 120 }, // Estrés alto: empuja el sistema a 120 usuarios concurrentes
    { duration: '20s', target: 0 },   // Rampa de bajada: recuperación del servidor
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],          // Menos del 2% de errores permitidos
    http_req_duration: ['p(95)<200'],        // El 95% de las peticiones debe responder en menos de 200ms
  },
};

// TU RUTA REAL COMPROBADA
const BASE_URL = 'http://localhost:3000/api/v1/eventos'; 

export default function () {
  // --- PASO 1: Listar Eventos ---
  const listRes = http.get(`${BASE_URL}`);
  
  const listCheck = check(listRes, {
    'GET / - status es 200': (r) => r.status === 200,
    'GET / - tiene eventos': (r) => {
      try {
        const body = JSON.parse(r.body);
        const eventos = Array.isArray(body) ? body : body.data || [];
        return eventos.length > 0;
      } catch (e) {
        return false;
      }
    }
  });

  // Si no responde 200 o la lista viene vacía, abortamos esta iteración para evitar crashes
  if (!listCheck || listRes.status !== 200) {
    sleep(1);
    return;
  }

  // Extraer información del body de forma segura
  const body = JSON.parse(listRes.body);
  const eventos = Array.isArray(body) ? body : body.data || [];
  
  // Seleccionar un evento aleatorio de los que insertó el Seeder
  const randomEvent = eventos[Math.floor(Math.random() * eventos.length)];
  const eventId = randomEvent.id; 

  if (eventId) {
    // Simular tiempo de lectura/clic del usuario (entre 0.5 y 1.5 segundos)
    sleep(Math.random() * 1 + 0.5);

    // --- PASO 2: Ver Detalle del Evento ---
    // Esto le pegará a: http://localhost:3000/api/v1/eventos/:id
    const detailRes = http.get(`${BASE_URL}/${eventId}`);
    check(detailRes, {
      'GET /:id - status es 200': (r) => r.status === 200,
    });

    sleep(Math.random() * 1 + 0.5);

    // --- PASO 3: Ver Disponibilidad de Capacidad ---
    // Esto le pegará a: http://localhost:3000/api/v1/eventos/:id/disponibilidad
    const availabilityRes = http.get(`${BASE_URL}/${eventId}/disponibilidad`);
    check(availabilityRes, {
      'GET /:id/disponibilidad - status es 200': (r) => r.status === 200,
    });
  }

  // Pausa antes del siguiente ciclo de este usuario virtual
  sleep(1);
}