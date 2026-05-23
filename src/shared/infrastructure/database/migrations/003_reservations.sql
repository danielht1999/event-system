CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cantidad_tickets INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE_PAGO',
    codigo_ticket VARCHAR(50) UNIQUE NOT NULL,
    reservado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pagado_en TIMESTAMP,
    checked_in_en TIMESTAMP,
    CONSTRAINT max_tickets CHECK (cantidad_tickets <= 4)
);

CREATE INDEX idx_reservas_evento ON reservas(evento_id);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);