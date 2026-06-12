CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    lugar VARCHAR(300) NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    capacidad_total INT NOT NULL,
    precio DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    reservas_confirmadas INT DEFAULT 0,
    reservas_pendientes INT DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Consultas por fecha
CREATE INDEX IF NOT EXISTS idx_eventos_fecha
ON eventos(fecha);

-- Consultas por organizador
CREATE INDEX IF NOT EXISTS idx_eventos_organizador
ON eventos(organizador_id);

-- Eventos publicados futuros (muy común en sistemas de eventos)
CREATE INDEX IF NOT EXISTS idx_eventos_estado_fecha
ON eventos(estado, fecha);