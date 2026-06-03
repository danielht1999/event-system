import cron from 'node-cron'
import { Pool } from 'pg'

export const startReservationExpiryWorker = (pool: Pool) => {
  // Ejecutar cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    console.log('Verificando reservas expiradas...')

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Obtener reservas pendientes con más de 15 minutos
      const resultado = await client.query(
        `
        SELECT 
          id,
          evento_id,
          cantidad_tickets,
          estado,
          reservado_en,
          NOW() - reservado_en AS tiempo_transcurrido
        FROM reservas
        WHERE estado = $1
          AND reservado_en <= NOW() - INTERVAL '15 minutes'
        FOR UPDATE
        `,
        ['PENDIENTE_PAGO']
      )

      // No hay reservas expiradas -> terminar normalmente
      if (resultado.rows.length === 0) {
        await client.query('COMMIT')
        return
      }

      // Obtener IDs de reservas expiradas
      const reservationIds = resultado.rows.map((r) => r.id)

      // Marcar reservas como EXPIRADA
      await client.query(
        `
        UPDATE reservas
        SET estado = 'EXPIRADA'
        WHERE id = ANY($1)
        `,
        [reservationIds]
      )

      // Agrupar tickets por evento
      const eventosMap = new Map<string, number>()

      for (const reserva of resultado.rows) {
        const actual = eventosMap.get(reserva.evento_id) || 0

        eventosMap.set(
          reserva.evento_id,
          actual + reserva.cantidad_tickets
        )
      }

      // Devolver cupos pendientes al evento
      for (const [eventoId, tickets] of eventosMap) {
        await client.query(
          `
          UPDATE eventos
          SET reservas_pendientes = reservas_pendientes - $1
          WHERE id = $2
          `,
          [tickets, eventoId]
        )
      }

      await client.query('COMMIT')

      console.log(
        `Reservas expiradas procesadas: ${resultado.rows.length}`
      )
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error procesando reservas expiradas:', error)
    } finally {
      client.release()
    }
  })
}