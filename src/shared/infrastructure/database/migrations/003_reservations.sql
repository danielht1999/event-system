CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_type_id UUID NOT NULL
        REFERENCES ticket_types(id)
        ON DELETE CASCADE,
    usuario_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    cantidad_tickets INT NOT NULL
        CHECK (
            cantidad_tickets > 0
            AND cantidad_tickets <= 4
        ),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE_PAGO'
        CHECK (
            estado IN (
                'PENDIENTE_PAGO',
                'CONFIRMADA',
                'CANCELADA',
                'EXPIRADA',
                'CHECKED_IN'
            )
        ),
    codigo_ticket VARCHAR(50) UNIQUE NOT NULL,
    reservado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pagado_en TIMESTAMPTZ,
    checked_in_en TIMESTAMPTZ
);

-- Reservas por ticket type
CREATE INDEX IF NOT EXISTS idx_reservas_ticket_type ON reservas(ticket_type_id);
-- Reservas por usuario
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
-- Worker de expiración
CREATE INDEX IF NOT EXISTS idx_reservas_estado_reservado ON reservas(estado, reservado_en);
-- Consultas de tickets
CREATE INDEX IF NOT EXISTS idx_reservas_codigo_ticket ON reservas(codigo_ticket);