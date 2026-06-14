CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizador_id UUID NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    lugar VARCHAR(300) NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR'
        CHECK (
            estado IN (
                'BORRADOR',
                'PUBLICADA',
                'CANCELADA'
            )
        ),

    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Consultas por fecha
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha);
-- Eventos por organizador
CREATE INDEX IF NOT EXISTS idx_eventos_organizador ON eventos(organizador_id);
-- Eventos publicados futuros
CREATE INDEX IF NOT EXISTS idx_eventos_estado_fecha ON eventos(estado, fecha);