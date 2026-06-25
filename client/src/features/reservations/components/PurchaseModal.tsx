// client/src/features/reservations/components/PurchaseModal.tsx

import { useState } from 'react';

interface PurchaseModalProps {
  eventoTitulo: string;
  ticketTypeNombre: string;   // ✅ Nuevo
  ticketTypePrecio: number;   // ✅ Nuevo
  cargando: boolean;
  onConfirmar: (cantidad: number) => Promise<void>;
  onCerrar: () => void;
}

export function PurchaseModal({
  eventoTitulo,
  ticketTypeNombre,
  ticketTypePrecio,
  cargando,
  onConfirmar,
  onCerrar,
}: PurchaseModalProps) {
  const [cantidad, setCantidad] = useState(1);

  const total = cantidad * ticketTypePrecio;

  const handleConfirmar = async () => {
    await onConfirmar(cantidad);
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>🎟️ Comprar Tickets</h3>
          <button className="modal-close" onClick={onCerrar}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p><strong>Evento:</strong> {eventoTitulo}</p>
          <p><strong>Tipo de entrada:</strong> {ticketTypeNombre}</p>
          <p><strong>Precio unitario:</strong> ${ticketTypePrecio}</p>

          <div className="form-group">
            <label>Cantidad de tickets (máximo 4):</label>
            <input
              type="number"
              min="1"
              max="4"
              value={cantidad}
              disabled={cargando}
              onChange={(e) =>
                setCantidad(
                  Math.max(1, Math.min(4, Number(e.target.value) || 1))
                )
              }
            />
          </div>

          <p><strong>Total:</strong> ${total}</p>
        </div>

        <div className="modal-footer">
          <button
            className="btn-confirmar"
            onClick={handleConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : '✅ Confirmar'}
          </button>
          <button
            className="btn-cerrar-modal"
            onClick={onCerrar}
            disabled={cargando}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}