import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Reserva } from '../../domain/entities/Reserva';
import pool from '../../infrastructure/database/connection';

export class ReservaController {
  // Comprar ticket (crear reserva)
  async crearReserva(req: Request, res: Response) {
    const { eventoId, cantidadTickets } = req.body;
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión para comprar tickets'
      });
    }

    if (cantidadTickets < 1 || cantidadTickets > 4) {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes comprar entre 1 y 4 tickets por vez'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verificar que el evento existe y está publicado
      const eventoResult = await client.query(
        `SELECT id, titulo, capacidad_total, reservas_confirmadas, reservas_pendientes, estado 
         FROM eventos WHERE id = $1 FOR UPDATE`,
        [eventoId]
      );

      if (eventoResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }

      const evento = eventoResult.rows[0];

      if (evento.estado !== 'PUBLICADO') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Este evento no está disponible para reservas'
        });
      }

      // Calcular cupos disponibles
      const cuposOcupados = evento.reservas_confirmadas + evento.reservas_pendientes;
      const cuposDisponibles = evento.capacidad_total - cuposOcupados;

      if (cuposDisponibles < cantidadTickets) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `No hay suficientes cupos disponibles. Quedan ${cuposDisponibles} cupos.`
        });
      }

      // Crear la reserva
      const reservaId = uuidv4();
      const codigoTicket = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      await client.query(
        `INSERT INTO reservas (id, evento_id, usuario_id, cantidad_tickets, estado, codigo_ticket)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [reservaId, eventoId, usuarioId, cantidadTickets, 'PENDIENTE_PAGO', codigoTicket]
      );

      // Actualizar reservas pendientes del evento
      await client.query(
        `UPDATE eventos SET reservas_pendientes = reservas_pendientes + $1 WHERE id = $2`,
        [cantidadTickets, eventoId]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente. Tienes 15 minutos para completar el pago.',
        data: {
          id: reservaId,
          codigoTicket,
          estado: 'PENDIENTE_PAGO',
          cantidadTickets,
          expiraEn: '15 minutos'
        }
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error al crear reserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la reserva',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  // Confirmar pago (simulado)
  async confirmarPago(req: Request, res: Response) {
    const { id } = req.params;
    const usuarioId = (req as any).user?.id;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const reservaResult = await client.query(
        'SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (reservaResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }

      const reserva = reservaResult.rows[0];

      if (reserva.usuario_id !== usuarioId) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para confirmar esta reserva'
        });
      }

      if (reserva.estado !== 'PENDIENTE_PAGO') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `La reserva ya está ${reserva.estado}`
        });
      }

      // Confirmar pago
      await client.query(
        `UPDATE reservas SET estado = 'CONFIRMADA', pagado_en = NOW() WHERE id = $1`,
        [id]
      );

      // Actualizar reservas confirmadas del evento
      await client.query(
        `UPDATE eventos 
         SET reservas_confirmadas = reservas_confirmadas + $1,
             reservas_pendientes = reservas_pendientes - $1
         WHERE id = $2`,
        [reserva.cantidad_tickets, reserva.evento_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: '¡Pago confirmado! Tu ticket ha sido emitido.',
        data: {
          id: reserva.id,
          estado: 'CONFIRMADA',
          codigoTicket: reserva.codigo_ticket
        }
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(500).json({
        success: false,
        message: 'Error al confirmar pago',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  // Mis reservas (historial de compras)
  async misReservas(req: Request, res: Response) {
    const usuarioId = (req as any).user?.id;

    try {
      const result = await pool.query(
        `SELECT r.*, e.titulo as evento_titulo, e.fecha as evento_fecha, e.lugar as evento_lugar
         FROM reservas r
         JOIN eventos e ON r.evento_id = e.id
         WHERE r.usuario_id = $1
         ORDER BY r.reservado_en DESC`,
        [usuarioId]
      );

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows.map(r => ({
          id: r.id,
          eventoId: r.evento_id,
          eventoTitulo: r.evento_titulo,
          eventoFecha: r.evento_fecha,
          eventoLugar: r.evento_lugar,
          cantidadTickets: r.cantidad_tickets,
          estado: r.estado,
          codigoTicket: r.codigo_ticket,
          reservadoEn: r.reservado_en,
          pagadoEn: r.pagado_en
        }))
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener reservas'
      });
    }
  }

  // Cancelar reserva
  async cancelarReserva(req: Request, res: Response) {
    const { id } = req.params;
    const usuarioId = (req as any).user?.id;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const reservaResult = await client.query(
        'SELECT * FROM reservas WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (reservaResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }

      const reserva = reservaResult.rows[0];

      if (reserva.usuario_id !== usuarioId) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para cancelar esta reserva'
        });
      }

      if (reserva.estado === 'CONFIRMADA') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'No puedes cancelar una reserva ya confirmada'
        });
      }

      if (reserva.estado === 'CANCELADA') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'La reserva ya está cancelada'
        });
      }

      await client.query(
        `UPDATE reservas SET estado = 'CANCELADA' WHERE id = $1`,
        [id]
      );

      await client.query(
        `UPDATE eventos SET reservas_pendientes = reservas_pendientes - $1 WHERE id = $2`,
        [reserva.cantidad_tickets, reserva.evento_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Reserva cancelada exitosamente'
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(500).json({
        success: false,
        message: 'Error al cancelar reserva'
      });
    } finally {
      client.release();
    }
  }
}