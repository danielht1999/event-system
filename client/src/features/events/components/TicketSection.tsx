// client/src/features/events/components/TicketSection.tsx

import type { TicketSectionProps, TicketInput } from '../types/Event';
import { crearTicketVacio, calcularCapacidadAsignada, LIMITES } from '../types/Event';
import { TicketItem } from './TicketItem';

export const TicketSection: React.FC<TicketSectionProps> = ({
  tickets,
  capacidadTotal,
  onTicketsChange,
  onCapacidadTotalChange,
  disabled = false
}) => {
  const capacidadAsignada = calcularCapacidadAsignada(tickets);
  const excedeCapacidad = capacidadAsignada > capacidadTotal;
  const cuposDisponibles = capacidadTotal - capacidadAsignada;
  const tieneCapacidadTotal = capacidadTotal > 0;

  const handleAddTicket = () => {
    const nuevoTicket = crearTicketVacio();
    onTicketsChange([...tickets, nuevoTicket]);
  };

  const handleRemoveTicket = (index: number) => {
    if (tickets.length <= 1) return;
    const nuevosTickets = tickets.filter((_, i) => i !== index);
    onTicketsChange(nuevosTickets);
  };

  const handleUpdateTicket = (index: number, field: keyof TicketInput, value: string | number) => {
    const nuevosTickets = [...tickets];
    nuevosTickets[index] = {
      ...nuevosTickets[index],
      [field]: value
    };
    onTicketsChange(nuevosTickets);
  };

  return (
    <div className="ticket-section">
      {/* Capacidad Total */}
      <div className="form-group capacidad-total-group">
        <label className="form-label" htmlFor="capacidad-total">
          Capacidad Total del Evento
        </label>
        <input
          id="capacidad-total"
          type="number"
          className="form-control"
          placeholder="Capacidad máxima"
          value={capacidadTotal || ''}
          onChange={(e) => onCapacidadTotalChange(Number(e.target.value))}
          disabled={disabled}
          min={LIMITES.CAPACIDAD_TOTAL.MIN}
          max={LIMITES.CAPACIDAD_TOTAL.MAX}
          required
        />
        <span className="capacidad-total-hint">
          Máximo {LIMITES.CAPACIDAD_TOTAL.MAX} personas
        </span>
      </div>

      {/* Feedback de capacidad */}
      {tieneCapacidadTotal && (
        <div className={`capacidad-feedback ${excedeCapacidad ? 'error' : 'success'}`}>
          <span className="capacidad-feedback-text">
            Capacidad asignada: <strong>{capacidadAsignada}</strong> / {capacidadTotal}
          </span>
          <span className="capacidad-feedback-detalle">
            {excedeCapacidad ? (
              <>⚠️ Excede en <strong>{Math.abs(cuposDisponibles)}</strong> cupos</>
            ) : cuposDisponibles === 0 ? (
              <>✅ Todos los cupos asignados</>
            ) : (
              <>Quedan <strong>{cuposDisponibles}</strong> cupos disponibles</>
            )}
          </span>
        </div>
      )}

      {/* Lista de Tickets */}
      <div className="tickets-list">
        <div className="tickets-header">
          <h4 className="tickets-title">Tipos de Ticket</h4>
          <span className="tickets-count">
            {tickets.length} {tickets.length === 1 ? 'tipo' : 'tipos'}
          </span>
        </div>

        {tickets.map((ticket, index) => (
          <TicketItem
            key={ticket.id}
            ticket={ticket}
            index={index}
            isOnlyTicket={tickets.length <= 1}
            capacidadTotal={capacidadTotal}
            onUpdate={handleUpdateTicket}
            onRemove={handleRemoveTicket}
            disabled={disabled}
          />
        ))}

        <button
          type="button"
          className="btn-add-ticket"
          onClick={handleAddTicket}
          disabled={disabled}
        >
          + Agregar Tipo de Ticket
        </button>

        {tickets.length === 0 && (
          <p className="ticket-error-message">
            ⚠️ Debes agregar al menos un tipo de ticket
          </p>
        )}
      </div>
    </div>
  );
};