CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    lugar VARCHAR(300) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    capacidad_total INT NOT NULL,
    precio DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    reservas_confirmadas INT DEFAULT 0,
    reservas_pendientes INT DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha);
CREATE INDEX IF NOT EXISTS idx_eventos_organizador ON eventos(organizador_id);