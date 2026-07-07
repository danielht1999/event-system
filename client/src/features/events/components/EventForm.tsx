// client/src/features/events/components/EventForm.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { useEvent, useCrearEvento, useActualizarEvento, usePublicarEvento, useCancelarEvento } from '../hooks/useEvent';
import { useEventManagement } from '../hooks/useEventManagement'; // ← IMPORTAR
import { TicketSection } from './TicketSection';
import { EventManagementCard } from './EventManagementCard'; // ← Solo UNA vez

import type { TicketInput } from '../types/Event';
import {
  crearTicketVacio,
  calcularCapacidadAsignada,
  ticketInputToApi,
  eventoToFormData,
  LIMITES
} from '../types/Event';

export const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const { evento, cargando: cargandoEvento } = useEvent(isEditing ? id! : '');
  const { crearEvento, cargando: cargandoCrear } = useCrearEvento();
  const { actualizarEvento, cargando: cargandoActualizar } = useActualizarEvento();
  const { publicarEvento } = usePublicarEvento();
  const { cancelarEvento } = useCancelarEvento();
  
  // ✅ Usar useEventManagement en lugar de useMisEventos
  const { eventos: misEventos, recargar: recargarMisEventos } = useEventManagement();

  // ============================================
  // ESTADO DEL FORMULARIO
  // ============================================

  const [titulo, setTitulo] = useState('');
  const [lugar, setLugar] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [capacidadTotal, setCapacidadTotal] = useState<number>(0);
  const [tickets, setTickets] = useState<TicketInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    if (isEditing && evento) {
      const formData = eventoToFormData(evento);
      setTitulo(formData.titulo);
      setLugar(formData.lugar);
      setDescripcion(formData.descripcion || '');
      setFecha(formData.fecha || '');
      setCapacidadTotal(formData.capacidadTotal);
      setTickets(formData.tickets.map(t => ({
        id: crypto.randomUUID(),
        nombre: t.nombre,
        precio: t.precio,
        capacidad: t.capacidad
      })));
    }
  }, [isEditing, evento]);

  useEffect(() => {
    if (!isEditing && tickets.length === 0) {
      setTickets([crearTicketVacio()]);
    }
  }, [isEditing]);

  // ============================================
  // VALIDACIONES
  // ============================================

  const validarFormulario = (): string | null => {
    if (!titulo.trim()) return 'El título es obligatorio';
    if (!lugar.trim()) return 'El lugar es obligatorio';
    if (capacidadTotal < LIMITES.CAPACIDAD_TOTAL.MIN) {
      return `La capacidad total debe ser al menos ${LIMITES.CAPACIDAD_TOTAL.MIN}`;
    }
    if (capacidadTotal > LIMITES.CAPACIDAD_TOTAL.MAX) {
      return `La capacidad total no puede exceder ${LIMITES.CAPACIDAD_TOTAL.MAX}`;
    }

    if (tickets.length === 0) {
      return 'Debes agregar al menos un tipo de ticket';
    }

    const capacidadAsignada = calcularCapacidadAsignada(tickets);
    if (capacidadAsignada > capacidadTotal) {
      return `La capacidad asignada (${capacidadAsignada}) excede la capacidad total (${capacidadTotal})`;
    }

    for (const ticket of tickets) {
      if (!ticket.nombre.trim()) {
        return 'Todos los tickets deben tener un nombre';
      }
      if (ticket.precio < LIMITES.TICKET.PRECIO_MIN) {
        return 'El precio no puede ser negativo';
      }
      if (ticket.capacidad < LIMITES.TICKET.CAPACIDAD_MIN) {
        return `La capacidad de cada ticket debe ser al menos ${LIMITES.TICKET.CAPACIDAD_MIN}`;
      }
    }

    const nombres = tickets.map(t => t.nombre.trim().toLowerCase());
    if (new Set(nombres).size !== nombres.length) {
      return 'No se permiten tipos de ticket con el mismo nombre';
    }

    return null;
  };

  // ============================================
  // MANEJADORES
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(false);

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const data = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      lugar: lugar.trim(),
      fecha: fecha || undefined,
      capacidadTotal,
      tickets: tickets.map(ticketInputToApi)
    };

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
          setDescripcion('');
          setFecha('');
          setCapacidadTotal(0);
          setTickets([crearTicketVacio()]);
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

  // ============================================
  // RENDERIZADO CONDICIONAL
  // ============================================

  if (isEditing && cargandoEvento) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="loading-text">Cargando evento...</p>
      </div>
    );
  }

  if (user?.rol !== 'ORGANIZADOR') {
    return (
      <div className="error-container">
        <h2>Acceso denegado</h2>
        <p>Solo los organizadores pueden crear o editar eventos.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    );
  }

  // ============================================
  // EDICIÓN
  // ============================================

  if (isEditing) {
    return (
      <div className="card card-form" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 className="card-title" style={{ textAlign: 'center' }}>
          Editar Evento
        </h1>

        {exito && <div className="success-message">Evento actualizado exitosamente</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <textarea
              className="form-control"
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
              className="form-control"
              placeholder="Fecha"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Lugar"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <TicketSection
            tickets={tickets}
            capacidadTotal={capacidadTotal}
            onTicketsChange={setTickets}
            onCapacidadTotalChange={setCapacidadTotal}
            disabled={isLoading}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '20px' }}
          >
            {isLoading ? 'Guardando...' : 'Actualizar Evento'}
          </button>

          <button
            type="button"
            className="btn btn-danger"
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

  // ============================================
  // CREACIÓN: Dos columnas
  // ============================================

  return (
    <div className="card">
      <h1 className="card-title">Crear Evento</h1>

      <div className="panel-layout">
        {/* Columna Izquierda: Formulario */}
        <div className="card">
          <h3 className="card-title-sm">Crear Evento</h3>

          {exito && <div className="success-message">Evento creado exitosamente</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <textarea
                className="form-control"
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
                className="form-control"
                placeholder="Fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Lugar"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <TicketSection
              tickets={tickets}
              capacidadTotal={capacidadTotal}
              onTicketsChange={setTickets}
              onCapacidadTotalChange={setCapacidadTotal}
              disabled={isLoading}
            />

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Evento'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Mis Eventos */}
        <div className="card">
          <h3 className="card-title-sm">Mis Eventos</h3>
          {misEventos.length === 0 ? (
            <p className="empty">No tienes eventos creados.</p>
          ) : (
            <div className="eventos-list">
              {misEventos.map((evento) => (
                <EventManagementCard
                  key={evento.id}
                  evento={evento}
                  onPublicar={handlePublicar}
                  onCancelar={handleCancelar}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};