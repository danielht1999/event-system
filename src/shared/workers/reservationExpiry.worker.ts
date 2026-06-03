import cron from 'node-cron'
import { Pool } from 'pg'

export const startReservationExpiryWorker = (pool: Pool) => {
  // Ejecutar cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    console.log('Verificando reservas expiradas...')

    const client = await pool.connect()

    try {
      await client.query('BEGIN')
      // Expirar reservas y liberar cupos en una sola operación atómica
      const resultado = await client.query(`
        WITH reservas_expiradas AS (
          UPDATE reservas
          SET estado = 'EXPIRADA'
          WHERE estado = 'PENDIENTE_PAGO'
            AND reservado_en <= NOW() - INTERVAL '15 minutes'
          RETURNING evento_id, cantidad_tickets
        )

        UPDATE eventos e
        SET reservas_pendientes = e.reservas_pendientes - sub.total_tickets
        FROM (
          SELECT 
            evento_id,
            SUM(cantidad_tickets) AS total_tickets
          FROM reservas_expiradas
          GROUP BY evento_id
        ) sub
        WHERE e.id = sub.evento_id
        RETURNING e.id;
      `)

      await client.query('COMMIT')

      console.log(
        `Eventos actualizados por reservas expiradas: ${resultado.rowCount}`
      )
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error procesando reservas expiradas:', error)
    } finally {
      client.release()
    }
  })
}
//  const resultado = await client.query(`
//         -- ===========================================================
//         -- PARTE 1: CTE (Common Table Expression) - "reservas_expiradas"
//         -- ===========================================================
//         -- Una CTE es como una "tabla temporal" que existe solo durante
//         -- la ejecución de esta consulta. Se define con WITH.
//         -- ===========================================================
        
//         WITH reservas_expiradas AS (
//           -- Esta es la operación principal que MODIFICA datos (UPDATE)
//           UPDATE reservas
//           -- Cambiamos el estado a EXPIRADA
//           SET estado = 'EXPIRADA'
//           -- Condiciones para expirar:
//           WHERE estado = 'PENDIENTE_PAGO'           -- Solo reservas sin pagar
//             AND reservado_en <= NOW() - INTERVAL '15 minutes'  -- Más viejo de 15 min
//           -- La magia: RETURNING nos devuelve los datos de las filas afectadas
//           RETURNING evento_id, cantidad_tickets
//         )
        
//         -- ===========================================================
//         -- PARTE 2: ACTUALIZACIÓN DE EVENTOS
//         -- ===========================================================
//         -- Aquí liberamos los cupos de cada evento que perdió reservas
//         -- ===========================================================
        
//         UPDATE eventos e
//         -- Restamos los tickets de las reservas expiradas
//         SET reservas_pendientes = e.reservas_pendientes - sub.total_tickets
//         FROM (
//           -- Subconsulta: Agrupa por evento para sumar los tickets expirados
//           SELECT 
//             evento_id,
//             SUM(cantidad_tickets) AS total_tickets  -- Suma todos los tickets expirados
//           FROM reservas_expiradas  -- Datos que vienen de la CTE de arriba
//           GROUP BY evento_id        -- Agrupamos por evento
//         ) sub  -- Esta subconsulta se llama "sub"
//         WHERE e.id = sub.evento_id  -- Conectamos con la tabla eventos
//         RETURNING e.id;              -- Devolvemos los IDs de eventos afectados
//       `)