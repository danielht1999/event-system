// client/src/features/events/pages/EventDetailPage.tsx

import { useParams } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';

export const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { evento, cargando } = useEvent(id ?? '');

  if (cargando) {
    return <div>Cargando evento...</div>;
  }

  if (!evento) {
    return <div>Evento no encontrado.</div>;
  }

  return (
    <div className="page-container">
      <h1>{evento.titulo}</h1>

      <p>
        <strong>Lugar:</strong> {evento.lugar}
      </p>

      <p>
        <strong>Precio:</strong> ${evento.precio}
      </p>

      <p>
        <strong>Cupos disponibles:</strong>{' '}
        {evento.cuposDisponibles}
      </p>

      {evento.fecha && (
        <p>
          <strong>Fecha:</strong> {evento.fecha}
        </p>
      )}

      {evento.descripcion && (
        <div>
          <h3>Descripción</h3>
          <p>{evento.descripcion}</p>
        </div>
      )}
    </div>
  );
};