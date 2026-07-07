// client/src/features/events/components/TicketItem.tsx

import { useState } from 'react';
import type { TicketItemProps } from '../types/Event';
import { LIMITES, DEFAULT_TICKET_NAMES } from '../types/Event';

export const TicketItem: React.FC<TicketItemProps> = ({
  ticket,
  index,
  isOnlyTicket,
  capacidadTotal,
  onUpdate,
  onRemove,
  onBlur,
  disabled = false
}) => {
  // Detectar si el nombre actual es personalizado (no está en la lista predefinida)
  const [isCustomName, setIsCustomName] = useState(
    ticket.nombre !== '' && !DEFAULT_TICKET_NAMES.includes(ticket.nombre as any)
  );

  const handleChange = (field: keyof typeof ticket, value: string | number) => {
    onUpdate(index, field, value);
  };

  const handleNameChange = (value: string) => {
    if (value === 'Otro') {
      setIsCustomName(true);
      onUpdate(index, 'nombre', ''); // Limpiar para que el usuario escriba
    } else {
      setIsCustomName(false);
      onUpdate(index, 'nombre', value);
    }
  };

  const capacidadRestante = capacidadTotal - ticket.capacidad;

  return (
    <div className="ticket-item">
      <div className="ticket-item-header">
        <span className="ticket-number">Ticket #{index + 1}</span>
        {!isOnlyTicket && !disabled && (
          <button
            type="button"
            className="ticket-remove-btn"
            onClick={() => onRemove(index)}
            aria-label="Eliminar tipo de ticket"
          >
            ✕
          </button>
        )}
      </div>

      <div className="ticket-item-body">
        {/* Tipo de Ticket - Select con opción "Otro" */}
        <div className="form-group">
          <label className="form-label" htmlFor={`ticket-${index}-nombre`}>
            Tipo
          </label>
          <select
            id={`ticket-${index}-nombre`}
            className="form-control"
            value={isCustomName ? 'Otro' : ticket.nombre}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={disabled}
            required
          >
            <option value="">Selecciona un tipo</option>
            {DEFAULT_TICKET_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="Otro">✏️ Otro (personalizado)</option>
          </select>
          
          {/* Campo para nombre personalizado */}
          {isCustomName && (
            <input
              type="text"
              className="ticket-custom-name-input"
              placeholder="Escribe tu tipo personalizado"
              value={ticket.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              maxLength={LIMITES.TICKET.NOMBRE_MAX}
              required
              autoFocus
            />
          )}
        </div>

        {/* Precio */}
        <div className="form-group">
          <label className="form-label" htmlFor={`ticket-${index}-precio`}>
            Precio ($)
          </label>
          <input
            id={`ticket-${index}-precio`}
            type="number"
            className="form-control"
            placeholder="0.00"
            value={ticket.precio || ''}
            onChange={(e) => handleChange('precio', Number(e.target.value))}
            onBlur={onBlur}
            disabled={disabled}
            min={LIMITES.TICKET.PRECIO_MIN}
            step="0.01"
            required
          />
        </div>

        {/* Capacidad */}
        <div className="form-group">
          <label className="form-label" htmlFor={`ticket-${index}-capacidad`}>
            Capacidad
          </label>
          <input
            id={`ticket-${index}-capacidad`}
            type="number"
            className="form-control"
            placeholder="Cupos"
            value={ticket.capacidad || ''}
            onChange={(e) => handleChange('capacidad', Number(e.target.value))}
            onBlur={onBlur}
            disabled={disabled}
            min={LIMITES.TICKET.CAPACIDAD_MIN}
            max={capacidadTotal > 0 ? capacidadTotal : undefined}
            required
          />
          {capacidadTotal > 0 && ticket.capacidad > 0 && (
            <span className={`ticket-capacidad-restante ${
              capacidadRestante < 0 ? 'error' : ''
            }`}>
              {capacidadRestante > 0 
                ? `Quedan ${capacidadRestante} cupos disponibles` 
                : capacidadRestante === 0 
                  ? '✅ Capacidad completa' 
                  : `⚠️ Excede en ${Math.abs(capacidadRestante)} cupos`
              }
            </span>
          )}
        </div>
      </div>
    </div>
  );
};