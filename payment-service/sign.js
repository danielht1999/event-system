#!/usr/bin/env node
/**
 * ============================================
 * HERRAMIENTA DE DESARROLLO - Payment Service
 * ============================================
 * 
 * Modos:
 *   node sign.js create [args]    → Genera y EJECUTA la petición
 *   node sign.js create --dry     → Solo genera (no ejecuta)
 *   node sign.js db --query       → Consulta estado actual de la BD
 *   node sign.js flow             → Guía visual del flujo completo
 *   node sign.js help             → Muestra ayuda
 */

require('dotenv').config();

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

// ============================================
// COLORES PARA CONSOLA
// ============================================
const c = {
  reset: '\x1b[0m', bright: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  title: (msg) => console.log(`\n${c.bright}${c.cyan}═══════════════════════════════════════════════${c.reset}\n${c.bright}${c.cyan}  ${msg}${c.reset}\n${c.bright}${c.cyan}═══════════════════════════════════════════════${c.reset}\n`),
  section: (msg) => console.log(`\n${c.bright}${c.blue}▸ ${msg}${c.reset}`),
  info: (msg) => console.log(`  ${c.green}✓${c.reset} ${msg}`),
  warn: (msg) => console.log(`  ${c.yellow}!${c.reset} ${msg}`),
  error: (msg) => console.log(`  ${c.red}✗${c.reset} ${msg}`),
  dim: (msg) => console.log(`  ${c.gray}${msg}${c.reset}`),
  json: (label, obj) => {
    const lines = JSON.stringify(obj, null, 2).split('\n');
    console.log(`  ${c.magenta}${label}:${c.reset}`);
    lines.forEach((line, i) => {
      const prefix = i === 0 ? '┌' : i === lines.length - 1 ? '└' : '│';
      console.log(`  ${c.gray}${prefix} ${line}${c.reset}`);
    });
  },
  curl: (cmd) => console.log(`\n${c.bright}${c.green}${cmd}${c.reset}\n`),
  box: (msg, color = c.green) => {
    const padding = 39 - msg.length;
    const left = Math.floor(padding / 2);
    const right = padding - left;
    console.log(`\n  ${c.bright}${color}┌${'─'.repeat(41)}┐${c.reset}`);
    console.log(`  ${c.bright}${color}│${' '.repeat(left)}${msg}${' '.repeat(right)}${c.bright}${color}│${c.reset}`);
    console.log(`  ${c.bright}${color}└${'─'.repeat(41)}┘${c.reset}\n`);
  },
  stripe: (msg) => console.log(`  ${c.bright}${c.magenta}[stripe-cli]${c.reset} ${msg}`),
  db: (msg) => console.log(`  ${c.bright}${c.yellow}[postgres]${c.reset} ${msg}`),
  step: (num, msg) => console.log(`  ${c.cyan}${String(num).padStart(2, '0')}${c.reset} ${msg}`),
};

// ============================================
// CONFIGURACIÓN
// ============================================
const config = {
  secret: process.env.PAYMENT_SERVICE_HMAC_SECRET,
  baseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
  databaseUrl: process.env.DATABASE_URL,
};

if (!config.secret) {
  log.error('Falta PAYMENT_SERVICE_HMAC_SECRET');
  log.dim('Revisa tu archivo .env');
  process.exit(1);
}

// ============================================
// UTILIDADES
// ============================================
const generateId = () => crypto.randomUUID();
const getTimestamp = () => Date.now().toString();

function generateSignature(timestamp, payloadStr) {
  return crypto.createHmac('sha256', config.secret).update(`${timestamp}.${payloadStr}`).digest('hex');
}

function executeRequest(url, method, headers, payloadStr) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(payloadStr),
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, data, statusCode: res.statusCode });
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, data: '', stderr: err.message, statusCode: 0 });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, data: '', stderr: 'Request timeout (10s)', statusCode: 0 });
    });

    req.write(payloadStr);
    req.end();
  });
}

// ============================================
// COMANDOS DISPONIBLES
// ============================================
const COMMANDS = {
  create: {
    description: 'Crea un nuevo pago',
    method: 'POST',
    getEndpoint: () => '/payments', // RUTA CORRECTA SEGÚN server.ts
    buildPayload: (args) => ({
      reservationId: args[0] || generateId(),
      usuarioId: args[1] || '22222222-2222-2222-2222-222222222222',
      amountCents: Number(args[2] || '15000'),
      currency: args[3] || 'MXN',
    }),
    // Headers extra requeridos por el controlador
    extraHeaders: () => ({
      'Idempotency-Key': generateId(),
    }),
    stripeEvent: 'payment_intent.created',
    dbChanges: {
      table: 'payments',
      operation: 'INSERT',
      sql: 'INSERT INTO payments (id, reservation_id, usuario_id, amount_cents, currency, status, stripe_payment_intent_id, created_at, updated_at)',
      afterState: { status: 'PENDING', stripe_payment_intent_id: 'pi_3xxx...' },
    },
    outboxEvent: 'PAYMENT_CREATED',
    nextSteps: [
      'Stripe procesará el PaymentIntent en segundo plano',
      'Si exitoso → Stripe enviará webhook payment_intent.succeeded a /webhooks/stripe',
      'Si fallido → Stripe enviará webhook payment_intent.payment_failed',
    ],
  },
  /* 
  NOTA: confirm y fail no están en tu payments.routes.ts.
  En tu arquitectura, estos estados llegan por webhooks de Stripe.
  Los dejo comentados por si los agregas manualmente en el futuro.
  
  confirm: {
    description: 'Confirma un pago existente',
    method: 'POST',
    getEndpoint: (payload) => `/payments/${payload.paymentId}/confirm`,
    buildPayload: (args) => ({ paymentId: args[0] || generateId() }),
    extraHeaders: null,
    stripeEvent: null,
    dbChanges: { table: 'payments', operation: 'UPDATE', sql: "UPDATE payments SET status = 'CONFIRMED'", afterState: { status: 'CONFIRMED' } },
    outboxEvent: 'PAYMENT_CONFIRMED',
    nextSteps: ['El servicio de reservas consumirá el evento PAYMENT_CONFIRMED'],
  },
  fail: {
    description: 'Marca un pago como fallido',
    method: 'POST',
    getEndpoint: (payload) => `/payments/${payload.paymentId}/fail`,
    buildPayload: (args) => ({ paymentId: args[0] || generateId(), reason: args[1] || 'CARD_DECLINED' }),
    extraHeaders: null,
    stripeEvent: null,
    dbChanges: { table: 'payments', operation: 'UPDATE', sql: "UPDATE payments SET status = 'FAILED'", afterState: { status: 'FAILED' } },
    outboxEvent: 'PAYMENT_FAILED',
    nextSteps: ['El servicio de reservas consumirá el evento PAYMENT_FAILED'],
  },
  */
};

// ============================================
// SECCIONES DE IMPRESIÓN (Sin cambios lógicos)
// ============================================
function printStripeCliExpectations(command, response) {
  const cmd = COMMANDS[command];
  log.title('STRIPE CLI - Qué deberías ver');
  if (!cmd.stripeEvent) { log.dim('Este comando no dispara eventos directamente.'); return; }

  log.section('Terminal con stripe listen');
  log.dim('Si tienes corriendo: stripe listen --forward-to localhost:4000/webhooks/stripe');
  console.log('');
  log.stripe('Esperando webhooks...');
  console.log('');
  log.stripe(`${c.bright}${cmd.stripeEvent}${c.reset}`);
  log.stripe(`--> POST ${c.bright}http://localhost:4000/webhooks/stripe${c.reset}`);

  if (response && response.success) log.stripe(`${c.green}${c.bright}  [200] OK (Forwarded)${c.reset}`);
  else log.stripe(`${c.gray}  (El webhook llega cuando Stripe termina de procesar)${c.reset}`);

  log.section('Eventos que llegarán después (cuando el cliente pague)');
  console.log('');
  log.stripe(`${c.green}payment_intent.succeeded${c.reset} --> ${c.gray}Actualiza pago a CONFIRMED${c.reset}`);
  log.stripe(`${c.red}payment_intent.payment_failed${c.reset} --> ${c.gray}Actualiza pago a FAILED${c.reset}`);
}

function printDbChanges(command, payload, response) {
  const cmd = COMMANDS[command];
  const changes = cmd.dbChanges;
  log.title('BASE DE DATOS - Cambios esperados');

  const paymentId = (response && response.paymentId) || payload.paymentId || '(generado)';

  log.section(`Tabla: ${changes.table}`);
  log.db(`-- Operación: ${changes.operation}`);
  log.db(`-- ${changes.sql}`);
  
  if (response && response.paymentId) {
    log.db(`-- ID generado: ${c.yellow}${response.paymentId}${c.reset}`);
  }
  console.log('');

  log.section('Estado después de la operación');
  log.json('Row en payments', {
    id: paymentId,
    reservation_id: payload.reservationId || '-',
    usuario_id: payload.usuarioId || '-',
    amount_cents: payload.amountCents || '-',
    currency: payload.currency || '-',
    ...changes.afterState,
    created_at: 'NOW()',
    updated_at: 'NOW()',
  });

  log.section('Tabla: outbox_events (Transactional Outbox)');
  log.db(`  INSERT INTO outbox_events ... VALUES ('${paymentId}', 'Payment', '${cmd.outboxEvent}', ...);`);

  log.section('Queries para verificar');
  log.curl(
    `# Ver el pago creado\npsql "$DATABASE_URL" -c "SELECT * FROM payments WHERE id = '${paymentId}';"\n\n` +
    `# Ver outbox pendiente\npsql "$DATABASE_URL" -c "SELECT * FROM outbox_events WHERE aggregate_id = '${paymentId}';"\n\n` +
    `# Ver webhooks procesados\npsql "$DATABASE_URL" -c "SELECT * FROM processed_stripe_events ORDER BY processed_at DESC LIMIT 5;"`
  );
}

function printFlowDiagram() {
  log.title('DIAGRAMA DE FLUJO');
  const d = `
  ${c.cyan}┌──────────────┐${c.reset}      ${c.cyan}┌──────────────┐${c.reset}      ${c.cyan}┌──────────────┐${c.reset}
  ${c.cyan}│${c.reset} ${c.bright}sign.js${c.reset}      ${c.cyan}│${c.reset} ${c.bright}POST /pay${c.reset}   ${c.cyan}│${c.reset} ${c.bright}Handler${c.reset}      ${c.cyan}│${c.reset}
  ${c.cyan}│${c.reset} Genera       ${c.cyan}│${c.reset} hmacAuth     ${c.cyan}│${c.reset} CreatePay    ${c.cyan}│${c.reset}
  ${c.cyan}│${c.reset} firma + HTTP  ${c.cyan}│${c.reset} verifica HMAC ${c.cyan}│${c.reset} mentHandler  ${c.cyan}│${c.reset}
  ${c.cyan}└──────┬───────┘${c.reset}      ${c.cyan}└──────┬───────┘${c.reset}      ${c.cyan}└──────┬───────┘${c.reset}
         ${c.green}──────────►${c.reset}             ${c.green}──────────►${c.reset}             ${c.green}│${c.reset}
                                                      ${c.green}▼${c.reset}
         ${c.cyan}┌──────────────┐${c.reset}      ${c.cyan}┌──────────────┐${c.reset}      ${c.cyan}┌──────────────┐${c.reset}
         ${c.cyan}│${c.reset} ${c.bright}Redis${c.reset}        ${c.cyan}│${c.reset} ${c.bright}Postgres${c.reset}    ${c.cyan}│${c.reset} ${c.bright}Stripe${c.reset}       ${c.cyan}│${c.reset}
         ${c.cyan}│${c.reset} Streams      ${c.cyan}│${c.reset} + Outbox     ${c.cyan}│${c.reset} Payment      ${c.cyan}│${c.reset}
         ${c.cyan}│${c.reset}              ${c.cyan}│${c.reset}              ${c.cyan}│${c.reset} Intent       ${c.cyan}│${c.reset}
         ${c.cyan}└──────┬───────┘${c.reset}      ${c.cyan}└──────┬───────┘${c.reset}      ${c.cyan}└──────┬───────┘${c.reset}
                │                     │                     │
                │                     │                     ${c.magenta}▼${c.reset}
                │                     │            ${c.magenta}┌──────────────┐${c.reset}
                │                     │            ${c.magenta}│${c.reset} ${c.bright}Stripe CLI${c.reset}   ${c.magenta}│${c.reset}
                │                     │            ${c.magenta}│${c.reset} ${c.bright}webhook suc.${c.reset}  ${c.magenta}│${c.reset}
                │                     │            ${c.magenta}└──────┬───────┘${c.reset}
                │                     │                   │
                │                     ${c.green}◄──────────────────┘${c.reset}
                │                     │
                ${c.yellow}◄─────────────────────┘${c.reset}
                │
         ${c.cyan}┌──────────────┐${c.reset}
         ${c.cyan}│${c.reset} ${c.bright}Reserva MS${c.reset}   ${c.cyan}│${c.reset}
         ${c.cyan}│${c.reset} Consume evt  ${c.cyan}│${c.reset}
         ${c.cyan}└──────────────┘${c.reset}`;
  console.log(d);
}

function printNextSteps(command) {
  const cmd = COMMANDS[command];
  log.title('PRÓXIMOS PASOS');
  cmd.nextSteps.forEach((step, i) => log.step(i + 1, step));
  console.log('');
  log.section('Para verificar');
  log.info('1. Revisa la respuesta del servidor arriba');
  log.info('2. Mira el terminal de stripe listen');
  log.info('3. Ejecuta: node sign.js db --query');
}

function printDbQueryMode() {
  log.title('CONSULTAS DE VERIFICACIÓN - BASE DE DATOS');
  if (!config.databaseUrl) { log.error('DATABASE_URL no está configurada en .env'); return; }

  const queries = [
    { label: 'Últimos 5 pagos', sql: 'SELECT id, reservation_id, status, amount_cents, currency, created_at FROM payments ORDER BY created_at DESC LIMIT 5;' },
    { label: 'Outbox pendiente', sql: "SELECT id, aggregate_id, event_type, created_at FROM outbox_events WHERE processed_at IS NULL ORDER BY created_at DESC LIMIT 5;" },
    { label: 'Webhooks Stripe', sql: 'SELECT stripe_event_id, event_type, processed_at FROM processed_stripe_events ORDER BY processed_at DESC LIMIT 5;' },
  ];

  queries.forEach(({ label, sql }) => {
    log.section(label);
    try {
      const result = execSync(`psql "${config.databaseUrl}" -c "${sql}"`, { encoding: 'utf-8', timeout: 5000 });
      console.log(result);
    } catch (err) {
      log.dim('¿Tienes psql instalado y en el PATH?');
    }
  });
}

function printFullFlow() {
  log.title('FLUJO COMPLETO DEL MICROSERVICIO');
  const steps = [
    { t: 'Cliente inicia pago', f: 'sign.js', d: 'Genera firma HMAC + Idempotency-Key' },
    { t: 'Middleware HMAC Auth', f: 'src/api/middlewares/hmacAuth.ts', d: 'Verifica firma usando rawBody' },
    { t: 'Validación de DTOs', f: 'src/api/middlewares/validation.ts', d: 'Verifica schema con Zod' },
    { t: 'CreatePaymentHandler', f: 'src/application/commands/CreatePaymentHandler.ts', d: 'Caso de uso principal' },
    { t: 'Stripe Payment Gateway', f: 'src/infrastructure/gateways/StripePaymentGateway.ts', d: 'Llama a stripe.paymentIntents.create()' },
    { t: 'Postgres (Unit Of Work)', f: 'src/infrastructure/database/PostgresUnitOfWork.ts', d: 'Transacción: Inserta Payment + OutboxEvent' },
    { t: 'Outbox Worker', f: 'src/infrastructure/messaging/OutboxWorker.ts', d: 'Publica evento PAYMENT_CREATED a Redis' },
    { t: 'Stripe Webhook (Async)', f: 'src/infrastructure/webhooks/StripeWebhookController.ts', d: 'Recibe payment_intent.succeeded y actualiza estado' },
  ];
  steps.forEach(({ t, f, d }, i) => {
    console.log(`  ${c.cyan}${String(i+1).padStart(2,'0')}${c.reset} ${c.bright}${t}${c.reset}\n     ${c.yellow}📄 ${f}${c.reset}\n     ${c.dim}${d}${c.reset}\n`);
    if (i < steps.length - 1) console.log(`     ${c.gray}│\n     ▼${c.reset}\n`);
  });
}

function printHelp() {
  log.title('HERRAMIENTA DE DESARROLLO - Payment Service');
  console.log(`  ${c.green}create [args]${c.reset}  Crea un pago (lo ejecuta)\n  ${c.yellow}--dry${c.reset}          Solo muestra, no ejecuta\n  ${c.cyan}db --query${c.reset}    Consulta la BD\n  ${c.cyan}flow${c.reset}          Muestra flujo\n`);
  log.dim('Ejemplos:\n  node sign.js create\n  node sign.js create --dry\n  node sign.js create id-reserva user-id 25000 MXN');
}

// ============================================
// MAIN
// ============================================
async function runCommand(command, args, dryRun) {
  const cmd = COMMANDS[command];
  const payload = cmd.buildPayload(args);
  const payloadStr = JSON.stringify(payload);
  const timestamp = getTimestamp();
  const signature = generateSignature(timestamp, payloadStr);
  const endpoint = cmd.getEndpoint(payload);

  // Construir headers base
   const headers = {
    'X-Signature': signature,      // <-- CAMBIADO
    'X-Timestamp': timestamp,      // <-- CAMBIADO
    'Content-Type': 'application/json',
  };

  // Agregar headers extra (ej. Idempotency-Key)
  if (cmd.extraHeaders) {
    Object.assign(headers, cmd.extraHeaders());
  }

  // 1. Mostrar petición
  log.title('PETICIÓN GENERADA');
  log.info(`Método: ${cmd.method}`);
  log.info(`Endpoint: ${endpoint}`);
  log.json('Payload', payload);
  log.json('Headers', headers);

  const headerArgs = Object.entries(headers).map(([k, v]) => `-H '${k}: ${v}'`).join(' \\\n    ');
  log.curl(`curl -X ${cmd.method} \\\n    ${config.baseUrl}${endpoint} \\\n    ${headerArgs} \\\n    -d '${payloadStr}'`);

  // 2. Ejecutar
  let response = null;
  if (dryRun) {
    log.box('MODO DRY RUN - No se ejecutó', c.yellow);
  } else {
    log.title('EJECUTANDO PETICIÓN');
    response = await executeRequest(`${config.baseUrl}${endpoint}`, cmd.method, headers, payloadStr);

    if (response.success) {
      log.box(`EXITOSO - Status ${response.statusCode}`, c.green);
      try {
        const parsed = JSON.parse(response.data);
        log.json('Respuesta', parsed);
        response.paymentId = parsed.paymentId || parsed.id;
      } catch { log.info(`Respuesta: ${response.data}`); }
    } else {
      log.box(`ERROR - Status ${response.statusCode}`, c.red);
      try { log.json('Error', JSON.parse(response.data)); } catch { if(response.data) log.error(response.data); }
      if (response.statusCode === 0) log.dim('El servidor no está corriendo o la URL es incorrecta.');
      if (response.statusCode === 401) log.dim('Firma HMAC incorrecta. Verifica PAYMENT_SERVICE_HMAC_SECRET.');
      if (response.statusCode === 400) log.dim('Error de validación. ¿Falta algún campo o header?');
    }
  }

  printStripeCliExpectations(command, response);
  printDbChanges(command, payload, response);
  printFlowDiagram();
  printNextSteps(command);

  log.title('RESUMEN RÁPIDO');
  log.info('Ver BD:'); log.curl('node sign.js db --query');
  log.info('Ver flujo:'); log.curl('node sign.js flow');
}

// ============================================
// ENTRY POINT
// ============================================
(async () => {
  const rawArgs = process.argv.slice(2);
  const command = rawArgs[0];
  const isDry = rawArgs.includes('--dry');

  if (!command || command === 'help') { printHelp(); process.exit(0); }
  if (command === 'flow') { printFullFlow(); process.exit(0); }
  if (command === 'db' && rawArgs.includes('--query')) { printDbQueryMode(); process.exit(0); }
  if (!COMMANDS[command]) { log.error(`Comando no reconocido: ${command}`); process.exit(1); }

  const args = rawArgs.filter(a => !a.startsWith('--'));
  await runCommand(command, args.slice(1), isDry);
})();