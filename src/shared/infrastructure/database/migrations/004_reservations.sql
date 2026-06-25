CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY,
    -- Añadimos la columna para denormalización estratégica del dominio
    evento_id UUID NOT NULL 
        REFERENCES eventos(id) 
        ON DELETE CASCADE,
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

-- Índices optimizados para las consultas de negocio comunes
CREATE INDEX IF NOT EXISTS idx_reservas_evento ON reservas(evento_id);
CREATE INDEX IF NOT EXISTS idx_reservas_ticket_type ON reservas(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado_reservado ON reservas(estado, reservado_en);
CREATE INDEX IF NOT EXISTS idx_reservas_codigo_ticket ON reservas(codigo_ticket);