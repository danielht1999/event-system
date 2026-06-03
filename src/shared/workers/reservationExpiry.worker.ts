import cron from 'node-cron';
import { ExpireReservationsHandler } from '@modules/reservation/application/commands/ExpireReservationsHandler';
import { ExpireReservationsCommand } from '@modules/reservation/application/commands/ExpireReservationsCommand';

export const startReservationExpiryWorker = (expireHandler: ExpireReservationsHandler) => {
  // Ejecutar cada minuto para una precisión milimétrica
  cron.schedule('* * * * *', async () => {
    try {
      // Instanciamos el comando
      const command = new ExpireReservationsCommand();
      
      // Ejecutamos a través del Handler
      const eventosAfectados = await expireHandler.execute(command);
      
      if (eventosAfectados > 0) {
        console.log(`[Worker] Éxito: Se liberaron cupos en ${eventosAfectados} eventos.`);
      }
    } catch (error) {
      console.error('[Worker Error] Error al disparar el comando de expiración:', error);
    }
  });
};
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