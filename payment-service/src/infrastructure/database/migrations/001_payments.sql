CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    reservation_id UUID NOT NULL UNIQUE,   -- correlación, no FK (BD separada)
                                            -- UNIQUE es invariante de negocio: una
                                            -- reserva tiene a lo sumo un Payment.
    usuario_id UUID NOT NULL,
    monto_centavos INTEGER NOT NULL CHECK (monto_centavos >= 0),
    moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE','APROBADO','RECHAZADO','REEMBOLSADO')),
    provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
    provider_reference VARCHAR(255),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    -- Reservada para uso futuro. Ningún código la llena ni la lee todavía
    -- (ni Payment.ts ni PostgresPaymentRepository la mapean) — se agrega
    -- ahora para no tener que hacer una migración adicional cuando aparezca
    -- un caso de uso concreto, pero se deja explícitamente sin consumir.
    metadata JSONB,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_provider_reference ON payments(provider_reference);

-- Soporta queries de monitoreo/limpieza de intents abandonados, ej.:
-- SELECT * FROM payments WHERE estado = 'PENDIENTE' AND creado_en < now() - interval '1 hour';
CREATE INDEX IF NOT EXISTS idx_payments_estado_creado ON payments(estado, creado_en);