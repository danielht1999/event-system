# Payment Microservice - Flujos Internos

## 1. Flujo del Webhook de Stripe (Entrada de Dinero)

Este diagrama detalla el procesamiento interno desde que Stripe notifica al microservicio hasta que el evento se guarda en la tabla de Outbox de forma transaccional.

```
 [ Servidor de Stripe ]
          │  POST /webhooks/stripe (Notificación Asíncrona)
          ▼
 1. [ server.ts ] ─────────────────────► Intercepta la ruta antes que el JSON global.
          │                               • Ejecuta: `express.raw({ type: 'application/json' })`.
          │                               • Preserva los bytes exactos en `req.body` (Buffer).
          ▼
 2. [ StripeWebhookController.ts ] ────► Método: `handle(req, res)`
          │                               • Llama a `StripeSignatureVerifier.constructEvent()`.
          │                               • Si la firma criptográfica falla ──► Corta con 400 Bad Request.
          ▼
 3. [ Tabla processed_stripe_events ] ─► Filtro de Deduplicación Defensiva.
          │                               • Llama a `isAlreadyProcessed(event.id)`.
          │                               • [SI YA EXISTE] ──► Retorna 200 OK `{ deduped: true }` y frena.
          ▼
 4. [ Enrutador interno: dispatch() ] ─► Evalúa `event.type`.
          │                               • Si es 'payment_intent.succeeded' ──► Instancia `ConfirmPaymentCommand`.
          │                               • Llama: `await confirmPaymentHandler.execute(command)`.
          ▼
 5. [ ConfirmPaymentHandler.ts ] ──────► Abre el contexto atómico: `uow.execute(async (tx) => { ... })`.
          │                               • Busca el pago usando el cliente transaccional `tx`.
          │                               • Verifica Idempotencia: ¿El estado actual es `'PENDIENTE'`?
          │                               • Cambia el estado en la entidad: `payment.aprobar()`.
          │                               • Ejecuta: `paymentRepository.save(payment, tx)`.
          ▼
 6. [ OutboxStore.ts ] ────────────────► Empaqueta el sobre del evento financiero (`EventEnvelope`).
          │                               • Llama a `outboxStore.append(envelope, tx)`.
          │                               • Ejecuta: `INSERT INTO outbox_events (...) VALUES (..., dispatched = FALSE)`.
          ▼
 7. [ PostgresUnitOfWork.ts ] ─────────► Si no hubo fallos en la base de datos:
          │                               • Cierra la transacción: `COMMIT`.
          │                               • Guarda el ID del evento de Stripe en `processed_stripe_events`.
          ▼
 8. [ Respuesta Final ] ───────────────► El controlador responde de inmediato a Stripe: `res.status(200).json({ received: true })`.
```

## 2. Flujo del Outbox Worker (Publicación hacia Redis Streams)

Este flujo ocurre de forma asíncrona en background de manera completamente aislada, garantizando el envío fiable de eventos hacia Redis.

```
 [ OutboxWorker.ts ] ──► (Bucle recursivo controlado por `setTimeout` cada 1 segundo)
          │
          ▼
 1. [ Consulta de Lote (Batch) ] ──► Golpea el pool global de Postgres de forma directa.
          │                           • Ejecuta: `SELECT * FROM outbox_events WHERE dispatched = FALSE LIMIT 20`.
          │                           • Utiliza el índice parcial rápido de la base de datos.
          ▼
 2. [ Iteración del Lote ] ────────► Por cada fila recuperada de la tabla:
          │                           • Extrae la columna `payload` (JSONB) que contiene el `EventEnvelope`.
          ▼
 3. [ RedisStreamsPublisher.ts ] ──► (Puerto de Infraestructura de Mensajería)
          │                           • Llama a `publisher.publish('payments.events', event)`.
          │                           • Ejecuta comando nativo en memoria: `XADD payments.events * event '...'`.
          ▼
 4. [ Confirmación en Postgres ] ──► Una vez que Redis confirma la recepción del stream:
          │                           • Ejecuta: `UPDATE outbox_events SET dispatched = TRUE WHERE id = $1`.
          │                           • El mensaje queda marcado como procesado históricamente.
          ▼
 5. [ Programación del Siguiente Tick ]
          │                           • Bloque `.finally()` reactiva el temporizador.
          └──────────────────────────► Espera 1000ms e inicia el ciclo nuevamente.
```

## 3. Flujo de Creación de Pago (Iniciación desde Frontend/Monolito)

Este flujo maneja la creación de un pago y la generación del clientSecret delegando la idempotencia directamente al API downstream de Stripe.

```
 [ Petición del Cliente ] (POST /v1/payments)
          │
          ▼
 1. [ Express Router ] ────────────────► Atrapa el Verbo HTTP y la Ruta.
          │                               Importa: `paymentController` desde container.ts
          ▼
 2. [ Middleware Stack ] ──────────────► Ejecuta validación/auth.
          │                               • Verifica credenciales HMAC / JWT del sistema.
          │                               • Valida payload con validador de esquema.
          ▼
 3. [ PaymentController ] ─────────────► Extrae el cuerpo JSON, construye `CreatePaymentCommand`.
          │                               • Extrae datos de monto, divisa y metadatos del negocio.
          ▼
 4. [ CreatePaymentHandler ] ──────────► Orquesta el caso de uso con el Unit of Work (`uow.execute`).
          │                               
          ▼
 5. [ StripePaymentGateway ] ──────────► Invoca el adaptador de infraestructura de pasarela.
          │                               • Pasa `paymentId` como `idempotencyKey` nativa a Stripe.
          │                               • Si Stripe ya procesó este ID, retorna el Intent existente.
          │                               • Retorna `{ providerReference, clientSecret }`.
          ▼
 6. [ Domain Entity ] ──────────────────► Instancia la entidad `Payment` con estado inicial `PENDIENTE`.
          │                               • Inyecta el Value Object `Money`.
          │                               • Almacena internamente el `providerReference` de Stripe.
          ▼
 7. [ Persistencia Transaccional ] ────► Guarda en la base de datos a través del repositorio.
          │                               • `paymentRepository.save(payment, tx)`.
          │                               • Registra el evento de creación en `outboxStore.append(..., tx)`.
          ▼
 8. [ Commit & Response ] ─────────────► Cierra la transacción.
                                          • Responde al emisor: `{ paymentId, clientSecret, status: 'PENDIENTE' }`.
```

## 4. Tablas del Microservicio

### Payments Table

```sql
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    reservation_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    monto_centavos INTEGER NOT NULL CHECK (monto_centavos >= 0),
    currency VARCHAR(3) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO')),
    provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
    provider_reference VARCHAR(255),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_reference ON payments(provider_reference);
```

### Outbox Events Table

```sql
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispatched BOOLEAN NOT NULL DEFAULT FALSE,
    dispatched_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_dispatched ON outbox_events(dispatched) WHERE dispatched = FALSE;
```

### Processed Stripe Events Table

```sql
CREATE TABLE IF NOT EXISTS processed_stripe_events (
    stripe_event_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 5. Endpoints Expuestos por el Microservicio

### REST Endpoints

| Método | Endpoint | Descripción | Respuesta |
|--------|----------|-------------|-----------|
| POST | `/v1/payments` | Crear una intención de pago | `{ paymentId, clientSecret, status }` |
| GET | `/v1/payments/:id` | Obtener un pago por su ID | `{ paymentId, status, money, ... }` |

### Webhook Endpoint

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/webhooks/stripe` | Webhook de Stripe (Firma criptográfica verificada en raw body) |

## 6. Eventos de Dominio (Publicados en Redis Streams)

Estos eventos se depositan en el stream 'payments.events' dentro del sobre estructurado EventEnvelope:

- **PAYMENT_CREATED**: Generado al inicializar la transacción.
- **PAYMENT_CONFIRMED**: Generado de forma asíncrona cuando el Webhook confirma el cobro.
- **PAYMENT_FAILED**: Generado si la tarjeta es rechazada o no hay fondos.

## 7. Capas del Microservicio

| Capa | Responsabilidad | Ejemplos de Archivos |
|------|-----------------|---------------------|
| **Capa de Infraestructura** | Controladores HTTP, adaptadores de red, clientes de BD e implementaciones concretas. | `StripeWebhookController`, `PostgresPaymentRepository`, `RedisStreamsPublisher`, `pool` |
| **Capa de Aplicación** | Casos de uso puros del sistema, definición de comandos y orquestadores. | `ConfirmPaymentHandler`, `ConfirmPaymentCommand`, `IConfirmPaymentHandler` |
| **Capa de Dominio** | Modelos de negocio enriquecidos, agregados, contratos de interfaces (puertos) y lógica agnóstica. | `Payment` (Entidad), `Money` (Value Object), `IPaymentRepository` (Interface) |

## 8. Diagrama de Dependencias Reales (Arquitectura Hexagonal Estricta)

**Corrección de Arquitectura**: En el documento original pusiste que la capa de Dominio dependía de los Repositorios y la Infraestructura dependía de todo. En la arquitectura limpia, la Capa de Dominio está en el centro absoluto y no depende de nadie. Las capas externas apuntan hacia adentro mediante la Inversión de Dependencias (Interfaces).

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE INFRAESTRUCTURA                             │
│  (Implementa interfaces y maneja tecnologías de entrada/salida)            │
│                                                                            │
│  [StripeWebhookController]   [PostgresPaymentRepository]   [pool (pg)]     │
│  [RedisStreamsPublisher]     [Stripe SDK]                  [OutboxWorker]  │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ Depende de e implementa
┌────────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE APLICACIÓN                                │
│  (Orquesta casos de uso usando las abstracciones del dominio)              │
│                                                                            │
│  [ConfirmPaymentHandler]     [ConfirmPaymentCommand]                       │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ Depende de
┌────────────────────────────────────────────────────────────────────────────┐
│                            CAPA DE DOMINIO                                 │
│  (Núcleo agnóstico del negocio. Cero frameworks, cero librerías de red)   │
│                                                                            │
│  [Payment (Entity)]          [Money (Value Object)]                        │
│  [IPaymentRepository (Port)] [IOutboxStore (Port)]                         │
└────────────────────────────────────────────────────────────────────────────┘
```