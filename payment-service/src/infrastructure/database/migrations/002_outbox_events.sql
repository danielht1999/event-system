-- Tabla encargada del patrón Transactional Outbox
CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE, -- Identificador único global del evento (sirve para la idempotencia en el consumidor)
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    dispatched BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMPTZ
);

-- Índice optimizado parcial para que el Outbox Worker barra de inmediato solo lo pendiente
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(dispatched) WHERE dispatched = FALSE;