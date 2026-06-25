// client/src/features/events/components/EventCard.tsx

import { useState } from 'react';
import type { Evento } from '../types/Event';

interface EventCardProps {
  evento: Evento;
  onComprar: (eventoId: string, ticketTypeId: string, eventoTitulo: string) => void;
}

export function EventCard({ evento, onComprar }: EventCardProps) {
  const { id, titulo, lugar, tickets } = evento;

  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    tickets?.[0]?.id || ''
  );

  const selectedTicket = tickets?.find((t) => t.id === selectedTicketId);

  if (!tickets || tickets.length === 0) {
    return (
      <div className="evento-card">
        <h3 className="evento-title">{titulo}</h3>
        <div className="evento-meta">
          <span>📍</span>
          <span>{lugar}</span>
        </div>
        <p className="empty-tickets">No hay tipos de entrada disponibles.</p>
      </div>
    );
  }

  const tieneCupos = (selectedTicket?.cuposDisponibles ?? 0) > 0;

  const formatPrecio = (precio: number) => {
    return precio === 0 ? 'Gratis' : `$${precio}`;
  };

  const handleComprar = () => {
    if (selectedTicketId) {
      onComprar(id, selectedTicketId, titulo);
    }
  };

  return (
    <div className="evento-card">
      <h3 className="evento-title">{titulo}</h3>

      <div className="evento-meta">
        <span>📍</span>
        <span>{lugar}</span>
      </div>

      <div className="ticket-type-selector">
        <label htmlFor={`ticket-select-${id}`}>Tipo de entrada:</label>
        <select
          id={`ticket-select-${id}`}
          value={selectedTicketId}
          onChange={(e) => setSelectedTicketId(e.target.value)}
        >
          {tickets.map((ticket) => (
            <option key={ticket.id} value={ticket.id}>
              {ticket.nombre} - {formatPrecio(ticket.precio)}
              {ticket.cuposDisponibles === 0 && ' (Agotado)'}
            </option>
          ))}
        </select>
      </div>

      {selectedTicket && (
        <div className="evento-precio">{formatPrecio(selectedTicket.precio)}</div>
      )}

      <div className="evento-cupos">
        {tieneCupos ? (
          <div className="pill-led success">
            <span className="led"></span>
            {selectedTicket?.cuposDisponibles} CUPOS DISPONIBLES
          </div>
        ) : (
          <div className="pill-led error">
            <span className="led"></span>
            SIN CUPOS
          </div>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={handleComprar}
        disabled={!tieneCupos || !selectedTicketId}
      >
        {tieneCupos ? 'Comprar Ticket' : 'Sin cupos'}
      </button>
    </div>
  );
}