// client/src/features/reservations/components/PurchaseModal.tsx

import { useState, useEffect } from 'react';
import type { Evento } from '../../events/types/Event';

interface PurchaseModalProps {
  evento: Evento;
  cargando: boolean;
  onConfirmar: (ticketTypeId: string, cantidad: number) => Promise<void>;
  onCerrar: () => void;
}

export function PurchaseModal({
  evento,
  cargando,
  onConfirmar,
  onCerrar,
}: PurchaseModalProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [cantidad, setCantidad] = useState(1);

  const { titulo, lugar, fecha, descripcion, tickets } = evento;

  // Seleccionar el primer ticket por defecto
  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const maxCantidad = selectedTicket?.cuposDisponibles ?? 0;
  const precioUnitario = selectedTicket?.precio ?? 0;
  const total = cantidad * precioUnitario;

  // Formatear fecha
  const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'Fecha por confirmar';
    return new Date(fechaStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear precio
  const formatPrecio = (precio: number) => {
    return precio === 0 ? 'Gratis' : `$${precio}`;
  };

  // Manejar cambio de tipo de ticket
  const handleTicketChange = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setCantidad(1);  // Resetear cantidad al cambiar de tipo
  };

  // Manejar cambio de cantidad
  const handleCantidadChange = (value: number) => {
    const nuevaCantidad = Math.max(1, Math.min(value, maxCantidad));
    setCantidad(nuevaCantidad);
  };

  const handleConfirmar = async () => {
    if (selectedTicketId && cantidad > 0) {
      await onConfirmar(selectedTicketId, cantidad);
    }
  };

  // Verificar si se puede confirmar
  const puedeConfirmar = selectedTicketId && cantidad > 0 && cantidad <= maxCantidad && !cargando;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-content modal-compra"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h3>🎟️ Comprar Tickets</h3>
          <button className="modal-close" onClick={onCerrar}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Información del evento */}
          <div className="modal-evento-info">
            <h2 className="modal-evento-titulo">{titulo}</h2>
            <div className="modal-evento-meta">
              <span>📍 {lugar}</span>
              <span>•</span>
              <span>📅 {formatFecha(fecha)}</span>
            </div>
            {descripcion && (
              <p className="modal-evento-descripcion">{descripcion}</p>
            )}
          </div>

          <hr className="modal-divider" />

          {/* Selector de ticket */}
          <div className="modal-selector">
            <label className="modal-selector-label">Selecciona tu entrada</label>

            <div className="modal-selector-row">
              <div className="modal-selector-group">
                <label className="form-label" htmlFor="ticket-type">
                  Tipo de entrada
                </label>
                <select
                  id="ticket-type"
                  className="form-control"
                  value={selectedTicketId}
                  onChange={(e) => handleTicketChange(e.target.value)}
                  disabled={cargando}
                >
                  {tickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.nombre} - {formatPrecio(ticket.precio)}
                      {ticket.cuposDisponibles === 0 && ' (Agotado)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-selector-group">
                <label className="form-label" htmlFor="cantidad">
                  Cantidad
                </label>
                <input
                  id="cantidad"
                  type="number"
                  className="form-control"
                  min="1"
                  max={maxCantidad}
                  value={cantidad}
                  disabled={cargando || maxCantidad === 0}
                  onChange={(e) => handleCantidadChange(Number(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Feedback de cupos disponibles */}
            {selectedTicket && (
              <div className={`modal-cupos-feedback ${
                maxCantidad === 0 ? 'error' : 'success'
              }`}>
                {maxCantidad > 0 ? (
                  <>
                    <span>{maxCantidad} cupos disponibles</span>
                    {cantidad > maxCantidad && (
                      <span className="modal-cupos-error">
                        Cantidad excede los cupos disponibles
                      </span>
                    )}
                  </>
                ) : (
                  <span>Sin cupos disponibles</span>
                )}
              </div>
            )}

            {/* Precio total */}
            <div className="modal-total">
              <span className="modal-total-label">Total:</span>
              <span className="modal-total-precio">
                {formatPrecio(total)}
              </span>
            </div>
          </div>

          {/* Tags de tipos disponibles */}
          <div className="modal-tags">
            <span className="modal-tags-label">⚡ Tipos disponibles:</span>
            {tickets.map((ticket) => (
              <span
                key={ticket.id}
                className={`badge-tag ${
                  ticket.id === selectedTicketId ? 'active' : ''
                }`}
                onClick={() => handleTicketChange(ticket.id)}
              >
                {ticket.nombre}
                {ticket.cuposDisponibles === 0 && ' (Agotado)'}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleConfirmar}
            disabled={!puedeConfirmar}
          >
            {cargando ? 'Procesando...' : 'Confirmar Compra'}
          </button>
          <button
            className="btn btn-danger"
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