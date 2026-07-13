CREATE TABLE IF NOT EXISTS processed_stripe_events (
    stripe_event_id VARCHAR(255) PRIMARY KEY,
    -- Opcional y nullable a propósito: eventos de Stripe irrelevantes para
    -- este dominio (ver StripeWebhookController.dispatch, rama `default`)
    -- se marcan como procesados sin resolver un Payment.
    -- ON DELETE SET NULL, no CASCADE: esta tabla es de auditoría/dedup;
    -- si algún día se borra un Payment, no debe arrastrar el registro de
    -- qué eventos de Stripe ya se procesaron para él.
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_processed_at
    ON processed_stripe_events(processed_at);