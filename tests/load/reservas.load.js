import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 30 },  // Rampa de subida rápida
    { duration: '30s', target: 100 }, // Concurrencia alta fija (Punto de estrés)
    { duration: '15s', target: 0 },   // Rampa de bajada
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Toleramos hasta 5% de fallos por bloqueos de concurrencia
    http_req_duration: ['p(95)<300'], // El 95% de las compras debe procesarse en < 300ms
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

// ==========================================
// SETUP: Se ejecuta UNA SOLA VEZ antes del test
// ==========================================
export function setup() {
  // Autenticamos usando el usuario asistente del seeder
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'asistente@test.com',
    password: '123456'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Extraemos el token (ajusta según la respuesta de tu login, ej: body.token o body.data.token)
  const token = loginRes.json('token') || loginRes.json('data.token');
  
  if (!token) {
    throw new Error('❌ No se pudo obtener el token de autenticación. Abortando prueba.');
  }

  // Pasamos el token al bloque de ejecución principal
  return { authToken: token };
}

// ==========================================
// EXECUTION: Código que ejecutan los VUs en bucle
// ==========================================
export default function (data) {
  // ID del evento del seeder que tiene 150 espacios libres
  const EVENTO_ID = 'a1111111-1111-1111-1111-111111111111';

  // ARREGLADO: Llaves mapeadas en camelCase para pasar la validación Joi del Backend
  const payload = JSON.stringify({
    eventoId: EVENTO_ID, 
    cantidadTickets: Math.floor(Math.random() * 3) + 1 // Compra aleatoria entre 1 y 3 tickets
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.authToken}`, // Inyección del JWT obtenido en el setup
    },
  };

  // --- PASO CRÍTICO: Intentar hacer la reserva (Escritura en Base de Datos) ---
  const res = http.post(`${BASE_URL}/reservas`, payload, params);

  // Alerta en consola si algo más falla en el DTO
  if (res.status === 400) {
    console.log(`❌ Error 400: ${res.body}`);
  }

  check(res, {
    'POST /reservas - status es 201': (r) => r.status === 201 || r.status === 200,
  });

  // Pensamiento humano: Esperar un poco antes de que el mismo usuario intente otra acción
  sleep(1);
}