CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY,
    evento_id UUID NOT NULL
        REFERENCES eventos(id)
        ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10,2) NOT NULL
        CHECK (precio >= 0),
    capacidad INT NOT NULL
        CHECK (capacidad > 0),
    reservas_pendientes INT NOT NULL DEFAULT 0
        CHECK (reservas_pendientes >= 0),
    reservas_confirmadas INT NOT NULL DEFAULT 0
        CHECK (reservas_confirmadas >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (
            estado IN (
                'ACTIVO',
                'AGOTADO',
                'DESACTIVADO'
            )
        ),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ticket_type_nombre
        UNIQUE(evento_id, nombre)
);

-- Obtener tipos de ticket de un evento
CREATE INDEX IF NOT EXISTS idx_ticket_types_evento ON ticket_types(evento_id);
-- Tipos activos
CREATE INDEX IF NOT EXISTS idx_ticket_types_estado ON ticket_types(estado);
-- Locking y validación de cupos
CREATE INDEX IF NOT EXISTS idx_ticket_types_evento_estado ON ticket_types(evento_id, estado);