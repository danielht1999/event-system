import http from 'k6/http';
import { check, sleep } from 'k6';
import { vu } from 'k6/execution';
import { Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js';

// =========================================================================
// 1. CONFIGURACIÓN DE PRUEBA DE RUPTURA (BREAKPOINT TESTING)
// =========================================================================
export const options = {
  scenarios: {
    ataque_rompe_monolito: {
      executor: 'ramping-arrival-rate',
      startRate: 50,              // Empezamos con 50 peticiones por segundo (TPS)
      timeUnit: '1s',
      preAllocatedVUs: 100,       // k6 reserva 100 VUs de golpe para no perder tiempo
      maxVUs: 800,                // Permitimos que k6 escale hasta 800 VUs si el backend se ralentiza
      stages: [
        { duration: '30s', target: 200 },  // Rampa rápida a 200 transacciones/seg
        { duration: '1m', target: 500 },   // Escalamos a 500 transacciones/seg (¡Aquí suele tronar Express!)
        { duration: '1m', target: 1000 },  // El fin del mundo: 1,000 transacciones/seg
        { duration: '30s', target: 0 },    // Bajada rápida
      ],
      exec: 'escenarioEscritura', // Enfócate 100% en escrituras concurrentes
    },
  },
  // QUITAMOS LOS THRESHOLDS ESTRICTOS para que k6 no aborte la prueba cuando el sistema empiece a morir
  thresholds: {
    http_req_failed: ['rate<1'],     // Toleramos cualquier tasa de fallo (buscamos el punto de quiebre)
    http_req_duration: ['max<60000'], // Solo para no tener outliers infinitos
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

// =========================================================================
// MÉTRICAS PERSONALIZADAS
// =========================================================================
const errores500 = new Counter('errores_500');
const errores429 = new Counter('errores_429');
const errores400 = new Counter('errores_400');

// =========================================================================
// DATOS PARA ROTACIÓN REAL
// =========================================================================

// Lista de usuarios asistentes para pruebas de carga (del seed)
const USUARIOS = [
  { email: 'asistente1@test.com', id: '33333333-3333-3333-3333-333333333333' },
  { email: 'asistente2@test.com', id: '44444444-4444-4444-4444-444444444444' },
  { email: 'asistente3@test.com', id: '55555555-5555-5555-5555-555555555555' },
  { email: 'asistente4@test.com', id: '66666666-6666-6666-6666-666666666666' },
  { email: 'asistente5@test.com', id: '77777777-7777-7777-7777-777777777777' },
  { email: 'asistente6@test.com', id: '88888888-8888-8888-8888-888888888888' },
  { email: 'asistente7@test.com', id: '99999999-9999-9999-9999-999999999999' },
  { email: 'asistente8@test.com', id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
  { email: 'asistente9@test.com', id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
  { email: 'asistente10@test.com', id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }
];

// Lista de eventos de alta capacidad para pruebas de carga (10,000 cupos cada uno)
const EVENTOS_CARGA = [
  { id: 'e5555555-5555-5555-5555-555555555555', nombre: 'Mega Conferencia Tech 2025' },
  { id: 'f6666666-6666-6666-6666-666666666666', nombre: 'Festival de Música Digital' },
  { id: 'a7777777-7777-7777-7777-777777777777', nombre: 'Convención Internacional de Software' },
  { id: 'b8888888-8888-8888-8888-888888888888', nombre: 'Maratón de Innovación' },
  { id: 'c9999999-9999-9999-9999-999999999999', nombre: 'Expo de Startups Global' },
  { id: 'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', nombre: 'Cumbre de Inteligencia Artificial' },
  { id: 'ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', nombre: 'Tech Week 2025' },
  { id: 'fccccccc-cccc-cccc-cccc-cccccccccccc', nombre: 'Congreso de Desarrollo Ágil' }
];

// =========================================================================
// 2. SETUP: Generación de un Pool de Tokens legítimos antes del ataque
// =========================================================================
export function setup() {
  const tokensValidos = [];
  console.log(`[SETUP] 🔐 Pre-autenticando a los ${USUARIOS.length} usuarios del sistema...`);

  for (const usuario of USUARIOS) {
    const payload = JSON.stringify({
      email: usuario.email,
      password: '123456'
    });

    const params = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post(`${BASE_URL}/auth/login`, payload, params);
    const token = res.json('token') || res.json('data.token');

    if (token) {
      tokensValidos.push({ 
        id: usuario.id, 
        email: usuario.email, 
        token: token 
      });
      console.log(`[SETUP] ✅ Token obtenido para: ${usuario.email}`);
    } else {
      console.log(`[SETUP] ❌ Falló autenticación para: ${usuario.email}`);
    }
  }

  if (tokensValidos.length === 0) {
    throw new Error('❌ Cero usuarios autenticados. Abortando.');
  }

  console.log(`[SETUP] 🎉 Pool preparado: ${tokensValidos.length} usuarios autenticados`);
  console.log(`[SETUP] 💣 INICIANDO PRUEBA DE RUPTURA - Buscando el punto de quiebre...`);
  
  return { poolUsuarios: tokensValidos };
}

// =========================================================================
// 3. CÓDIGO DE EJECUCIÓN PARA COMPRADORES (PRUEBA DE RUPTURA + FORENSES)
// =========================================================================
export function escenarioEscritura(data) {
  // 1. Asignar un usuario con su token real usando la aritmética de VUs
  const usuarioIndex = (vu.idInTest - 1) % data.poolUsuarios.length;
  const usuario = data.poolUsuarios[usuarioIndex];

  // 2. Rotación de eventos y cantidad de tickets
  const evento = EVENTOS_CARGA[Math.floor(Math.random() * EVENTOS_CARGA.length)];
  const cantidadTickets = Math.floor(Math.random() * 5) + 1;
  
  // 3. El PAYLOAD ES LIMPIO (No viajan emails ni IDs clonados, tal como en producción)
  const payload = JSON.stringify({
    eventoId: evento.id,
    cantidadTickets: cantidadTickets
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${usuario.token}`,
    },
    timeout: '15s'
  };

  // 4. Medir duración exacta de la petición
  const inicio = Date.now();
  const res = http.post(`${BASE_URL}/reservas`, payload, params);
  const duracion = Date.now() - inicio;

  // ==================================================
  // LOGS FORENSES - EVIDENCIA ESTRUCTURADA
  // ==================================================

  // ERRORES 500 (Críticos - el servidor explotó)
  if (res.status >= 500) {
    errores500.add(1);
    
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      tipo: 'SERVER_ERROR',
      status: res.status,
      usuario: usuario.email,
      evento: evento.nombre,
      cantidadTickets: cantidadTickets,
      duracionMs: duracion,
      body: res.body?.substring(0, 500)
    }));
  }

  // RATE LIMIT 429 (Demasiadas peticiones)
  if (res.status === 429) {
    errores429.add(1);
    
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      tipo: 'RATE_LIMIT',
      status: res.status,
      usuario: usuario.email,
      evento: evento.nombre,
      cantidadTickets: cantidadTickets,
      duracionMs: duracion
    }));
  }

  // ERRORES CLIENTE 4xx (excepto 429)
  if (res.status >= 400 && res.status < 500 && res.status !== 429) {
    errores400.add(1);
    
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      tipo: 'CLIENT_ERROR',
      status: res.status,
      usuario: usuario.email,
      evento: evento.nombre,
      cantidadTickets: cantidadTickets,
      duracionMs: duracion,
      body: res.body?.substring(0, 500)
    }));
  }

  // Log de éxito opcional (descomentar si necesitas trazabilidad completa)
  // if (res.status === 200 || res.status === 201) {
  //   console.log(JSON.stringify({
  //     timestamp: new Date().toISOString(),
  //     tipo: 'SUCCESS',
  //     status: res.status,
  //     usuario: usuario.email,
  //     evento: evento.nombre,
  //     cantidadTickets: cantidadTickets,
  //     duracionMs: duracion
  //   }));
  // }

  // 6. Verificación de métricas (sin thresholds estrictos para no abortar)
  check(res, { 
    'request completed': (r) => r.status !== 0 
  });
  
  // 7. Tiempo de pensamiento MÍNIMO para no auto-protegernos
  sleep(0.1);
}

// =========================================================================
// 4. FUNCIÓN DE TEARDOWN: Reporte final del punto de quiebre
// =========================================================================
export function teardown(data) {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('🔍 REPORTE DE PRUEBA DE RUPTURA');
  console.log('='.repeat(70));
  console.log(`📊 Pool de usuarios utilizado: ${data.poolUsuarios.length}`);
  console.log(`🎯 Eventos de carga disponibles: ${EVENTOS_CARGA.length}`);
  console.log(`💣 Se intentó llevar el sistema hasta: 1000 transacciones/segundo`);
  console.log('='.repeat(70));
  console.log('📈 Para analizar el punto de quiebre, revisa:');
  console.log('   1. El pico de TPS donde empezaron los errores 5xx');
  console.log('   2. La latencia p95 cuando superó los 1000ms');
  console.log('   3. El momento donde la CPU/RAM de tu servidor se disparó');
  console.log('='.repeat(70));
}

// =========================================================================
// 5. RESUMEN JSON AUTOMÁTICO (k6 lo ejecuta al finalizar)
// =========================================================================
export function handleSummary(data) {
  return {
    'logs/k6-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}