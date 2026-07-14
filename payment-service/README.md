# payment-service

Microservicio de pagos, extraído del monolito `event-system`. Dueño exclusivo
del estado de un pago, integrado a Stripe en modo sandbox.

Basado en:
- `PAYMENT_SERVICE_ARCHITECTURE.md` — el porqué y las decisiones de diseño.
- `IMPLEMENTATION_PLAN.md` (sección E) — el checklist de archivos.
- `PAYMENT_SERVICE_CONTRACTS.md` — las firmas exactas implementadas aquí.

> Este repo cubre **solo el microservicio**. La parte del monolito
> (`InitiatePaymentHandler`, `PaymentServiceHttpClient`, el consumidor de
> eventos, etc. — ver `MONOLITH_INTEGRATION_CONTRACTS.md`) queda pendiente.

## Estructura

```
src/
├── domain/          entidades, puertos, errores — sin dependencias externas
├── application/      comandos y handlers — solo conocen interfaces de domain/
├── infrastructure/    Stripe, Postgres, Redis Streams, HMAC, webhooks, DI
└── api/               rutas Express, DTOs, middlewares — sin lógica de negocio
```

## Arrancar en local

```bash
cp .env.example .env   # completar STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc.

docker compose up -d payment-postgres   # o cualquier Postgres propio
npm install
npm run migrate                          # aplica las 3 migraciones en orden
npm run dev                              # ts-node-dev con recarga en caliente
```

El servidor levanta en `http://localhost:4000`.

## Probar sin el monolito (curl / Postman)

`POST /payments` requiere firma HMAC. Ejemplo de cómo generarla en un script rápido:

```js
const crypto = require('crypto');
const timestamp = Date.now().toString();
const body = JSON.stringify({
  reservationId: '11111111-1111-1111-1111-111111111111',
  usuarioId: '22222222-2222-2222-2222-222222222222',
  amountCents: 15000,
  currency: 'MXN',
});
const signature = crypto
  .createHmac('sha256', process.env.PAYMENT_SERVICE_HMAC_SECRET)
  .update(`${timestamp}.${body}`)
  .digest('hex');
```

Headers requeridos: `Content-Type: application/json`, `Idempotency-Key`,
`X-Timestamp`, `X-Signature`.

Para probar el webhook, usar el Stripe CLI:
```bash
stripe listen --forward-to localhost:4000/webhooks/stripe
stripe trigger payment_intent.succeeded
```

## Reglas de oro respetadas (ver PAYMENT_SERVICE_CONTRACTS.md sección 0)

- `domain/` no importa `express`/`pg`/`ioredis`/`stripe`/`joi` — solo TS puro.
- `application/` solo recibe interfaces por constructor (nunca clases concretas).
- Todo SDK externo vive únicamente en `infrastructure/`.
- El monto nunca se recalcula aquí — se confía en `amountCents` verificado por HMAC.
- Outbox pattern: `Payment.save()` + `INSERT outbox_events` en la misma transacción.
- `/webhooks/stripe` usa body crudo (`express.raw`), configurado antes de `express.json()` global.

## Pendiente (documentado explícitamente, no improvisado)

- Reembolsos: `Payment.reembolsar()` lanza `NotImplementedError` a propósito.
- Tests: no definidos aún en los documentos fuente (ver `IMPLEMENTATION_PLAN.md`, sección I).
- Métricas Prometheus reales (`/metrics` es un placeholder de texto plano).
- Dead-letter de Redis Streams: decisión abierta en la arquitectura.
