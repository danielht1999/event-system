// client/src/features/events/components/EventForm.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { useEvent, useCrearEvento, useActualizarEvento, usePublicarEvento, useCancelarEvento } from '../hooks/useEvent';
import { useMisEventos } from '../hooks/useEvents';

export const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hooks para el evento individual (desde useEvent.ts)
  const { evento, cargando: cargandoEvento } = useEvent(isEditing ? id! : '');
  const { crearEvento, cargando: cargandoCrear } = useCrearEvento();
  const { actualizarEvento, cargando: cargandoActualizar } = useActualizarEvento();
  const { publicarEvento } = usePublicarEvento();
  const { cancelarEvento } = useCancelarEvento();

  // Hooks para mis eventos (desde useEvents.ts)
  const { eventos: misEventos, recargar: recargarMisEventos } = useMisEventos();

  const [titulo, setTitulo] = useState('');
  const [lugar, setLugar] = useState('');
  const [precio, setPrecio] = useState('');
  const [cupos, setCupos] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (isEditing && evento) {
      setTitulo(evento.titulo);
      setLugar(evento.lugar);
      setPrecio(String(evento.precio ?? 0));
      setCupos(String(evento.cuposDisponibles ?? 0));
      setDescripcion(evento.descripcion || '');
      setFecha(evento.fecha || '');
    }
  }, [isEditing, evento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    const data = {
      titulo: titulo.trim(),
      lugar: lugar.trim(),
      precio: Number(precio),
      capacidadTotal: Number(cupos),
      descripcion: descripcion.trim() || undefined,
      fecha: fecha || undefined,
    };

    if (!data.titulo) {
      setError('El título es obligatorio');
      return;
    }
    if (!data.lugar) {
      setError('El lugar es obligatorio');
      return;
    }
    if (data.precio < 0) {
      setError('El precio no puede ser negativo');
      return;
    }
    if (data.capacidadTotal < 1) {
      setError('Debe haber al menos 1 cupo disponible');
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await actualizarEvento(id!, data);
      } else {
        response = await crearEvento(data);
      }

      if (response.success) {
        setExito(true);
        if (!isEditing) {
          setTitulo('');
          setLugar('');
          setPrecio('');
          setCupos('');
          setDescripcion('');
          setFecha('');
          recargarMisEventos();
        }
        setTimeout(() => {
          setExito(false);
          navigate('/');
        }, 2000);
      } else {
        setError(response.message || 'Error al guardar el evento');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    }
  };

  const handlePublicar = async (id: string) => {
    await publicarEvento(id);
    recargarMisEventos();
  };

  const handleCancelar = async (id: string) => {
    await cancelarEvento(id);
    recargarMisEventos();
  };

  const isLoading = cargandoCrear || cargandoActualizar;

  if (isEditing && cargandoEvento) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando evento...</p>
      </div>
    );
  }

  if (user?.rol !== 'ORGANIZADOR') {
    return (
      <div className="error-container">
        <h2>Acceso denegado</h2>
        <p>Solo los organizadores pueden crear o editar eventos.</p>
        <button onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    );
  }

  // ✅ Si es edición: solo formulario
  if (isEditing) {
    return (
      <div className="main-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="panel-title" style={{ textAlign: 'center' }}>
          Editar Evento
        </h1>

        {exito && <div className="success-message">Evento actualizado exitosamente</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <textarea
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              type="datetime-local"
              placeholder="Fecha"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              placeholder="Lugar"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              type="number"
              placeholder="Capacidad"
              value={cupos}
              onChange={(e) => setCupos(e.target.value)}
              min="1"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              min="0"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? 'Guardando...' : 'Actualizar Evento'}
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={() => navigate('/')}
            disabled={isLoading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Cancelar
          </button>
        </form>
      </div>
    );
  }

  // ✅ Creación: formulario + mis eventos en dos columnas
  return (
    <div className="main-panel">
      <h1 className="panel-title">Crear Evento</h1>

      <div className="panel-layout">
        {/* Columna Izquierda: Formulario */}
        <div className="panel-box">
          <h3 className="panel-box-title">Crear Evento</h3>

          {exito && <div className="success-message">Evento creado exitosamente</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <textarea
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <input
                type="datetime-local"
                placeholder="Fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Lugar"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                placeholder="Capacidad"
                value={cupos}
                onChange={(e) => setCupos(e.target.value)}
                min="1"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <input
                type="number"
                step="0.01"
                placeholder="Precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                min="0"
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Evento'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Mis Eventos */}
        <div className="panel-box">
          <h3 className="panel-box-title">Mis Eventos</h3>
          {misEventos.length === 0 ? (
            <p className="empty">No tienes eventos creados.</p>
          ) : (
            <div className="eventos-list">
              {misEventos.map((evento) => (
                <div key={evento.id} className="managed-event-card">
                  <div className="managed-event-title">{evento.titulo}</div>
                  <div className="data-grid">
                    <div className="data-item">
                      <span className="data-label">Lugar</span>
                      <span className="data-value">{evento.lugar}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Estado</span>
                      <span className={`pill-led ${evento.estado === 'PUBLICADA' ? 'success' : 'warning'}`}>
                        <span className="led"></span>
                        {evento.estado || 'BORRADOR'}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Precio</span>
                      <span className="data-value">${evento.precio}</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Cupos</span>
                      <span className="data-value">{evento.cuposDisponibles}</span>
                    </div>
                  </div>
                  <div className="event-actions">
                    {evento.estado !== 'PUBLICADA' && (
                      <button
                        className="btn-publicar"
                        onClick={() => handlePublicar(evento.id)}
                      >
                        Publicar
                      </button>
                    )}
                    <button
                      className="btn-eliminar"
                      onClick={() => handleCancelar(evento.id)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};