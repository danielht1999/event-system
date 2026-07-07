// client/src/features/events/components/EventCard.tsx

import { Link } from 'react-router-dom';
import type { Evento } from '../types/Event';

interface EventCardProps {
  evento: Evento;
  onComprar: (evento: Evento) => void;
}

export function EventCard({ evento, onComprar }: EventCardProps) {
  const { id, titulo, lugar, fecha, tickets, estado, precioMinimo, cuposDisponibles } = evento;

  // ============================================================
  // USAR ESTRICTAMENTE LOS CAMPOS DEL DTO
  // ============================================================
  
  // ✅ Usar precioMinimo del DTO (viene del backend)
  // Si no viene (por ejemplo, en detalle), calcular desde tickets
  const precioMostrar = precioMinimo !== undefined 
    ? precioMinimo 
    : (tickets && tickets.length > 0 ? Math.min(...tickets.map(t => t.precio)) : 0);

  // ✅ Usar cuposDisponibles del DTO (viene del backend)
  // Si no viene (por ejemplo, en detalle), calcular desde tickets
  const cuposMostrar = cuposDisponibles !== undefined
    ? cuposDisponibles
    : (tickets ? tickets.reduce((sum, t) => sum + t.cuposDisponibles, 0) : 0);

  const tieneCupos = cuposMostrar > 0;

  // ============================================================
  // FORMATO DE DATOS
  // ============================================================

  const formatPrecio = (precio: number) => {
    return precio === 0 ? 'Gratis' : `$${precio}`;
  };

  const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'Fecha por confirmar';
    return new Date(fechaStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener nombres de tipos de ticket para tags (solo si existen)
  const tiposNombres = tickets?.map(t => t.nombre) || [];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="card card-accent card-hover card-fixed">
      {/* Título - limitado a 2 líneas */}
      <h3 className="card-title">{titulo}</h3>

      {/* Metadata: Lugar y Fecha - limitado a 1 línea */}
      <div className="card-subtitle">
        <span>📍 {lugar}</span>
        <span>•</span>
        <span>📅 {formatFecha(fecha)}</span>
      </div>

      {/* Separador */}
      <hr className="evento-divider" />

      {/* Resumen rápido */}
      <div className="evento-resumen">
        <span className="evento-precio">
          Desde {formatPrecio(precioMostrar)}
        </span>
        <span className="evento-cupos">
          🎟️ {cuposMostrar} cupos disponibles
        </span>
        <span className={`pill-led ${tieneCupos ? 'success' : 'error'}`}>
          <span className="led"></span>
          {tieneCupos ? 'Disponible' : 'Agotado'}
        </span>
      </div>

      {/* Tags de tipos de ticket */}
      {tiposNombres.length > 0 && (
        <div className="evento-tags">
          <span className="evento-tags-label">Tipos:</span>
          {tiposNombres.map((nombre, index) => (
            <span key={index} className="badge-tag">
              {nombre}
            </span>
          ))}
        </div>
      )}

      {/* Botones de acción - siempre al final */}
      <div className="evento-actions-buttons">
        <Link to={`/events/${id}`} className="btn-detalle">
          Ver detalles
        </Link>
        <button
          className="btn btn-primary"
          onClick={() => onComprar(evento)}
          disabled={!tieneCupos || estado === 'CANCELADA'}
        >
          {estado === 'CANCELADA' 
            ? 'Evento Cancelado' 
            : tieneCupos 
              ? 'Comprar Ticket →' 
              : 'Sin cupos'
          }
        </button>
      </div>
    </div>
  );
}