import pool from './connection'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

// ============================================
// Helpers
// ============================================

function generateTicketCode(): string {
  return `TCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

async function seed() {
  console.log('[SEED] Iniciando inserción de datos de prueba...')

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // ============================================
    // Verificar tablas
    // ============================================

    await client.query('SELECT 1 FROM usuarios LIMIT 1')
    await client.query('SELECT 1 FROM eventos LIMIT 1')
    await client.query('SELECT 1 FROM reservas LIMIT 1')

    // ============================================
    // Password común
    // ============================================

    const passwordHash = await bcrypt.hash('123456', 10)

    // ============================================
    // USERS
    // ============================================

    const users = {
      organizador1: '11111111-1111-1111-1111-111111111111',
      organizador2: '22222222-2222-2222-2222-222222222222',

      asistente1: '33333333-3333-3333-3333-333333333333',
      asistente2: '44444444-4444-4444-4444-444444444444',
      asistente3: '55555555-5555-5555-5555-555555555555'
    }

    const usuariosQuery = `
      INSERT INTO usuarios (
        id,
        email,
        nombre,
        password_hash,
        rol
      )
      VALUES
        (
          '${users.organizador1}',
          'organizador@test.com',
          'Organizador Principal',
          $1,
          'ORGANIZADOR'
        ),
        (
          '${users.organizador2}',
          'organizador2@test.com',
          'Organizador Secundario',
          $1,
          'ORGANIZADOR'
        ),
        (
          '${users.asistente1}',
          'asistente1@test.com',
          'Asistente Uno',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente2}',
          'asistente2@test.com',
          'Asistente Dos',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente3}',
          'asistente3@test.com',
          'Asistente Tres',
          $1,
          'ASISTENTE'
        )
      ON CONFLICT DO NOTHING;
    `

    await client.query(usuariosQuery, [passwordHash])

    console.log('[SEED] Usuarios insertados')

    // ============================================
    // EVENTS
    // ============================================

    const events = {
      event1: 'a1111111-1111-1111-1111-111111111111',
      event2: 'b2222222-2222-2222-2222-222222222222',
      event3: 'c3333333-3333-3333-3333-333333333333',
      event4: 'd4444444-4444-4444-4444-444444444444'
    }

    const eventosQuery = `
      INSERT INTO eventos (
        id,
        organizador_id,
        titulo,
        descripcion,
        lugar,
        fecha,
        capacidad_total,
        precio,
        estado,
        reservas_confirmadas,
        reservas_pendientes
      )
      VALUES
        (
          '${events.event1}',
          '${users.organizador1}',
          'Conferencia de Arquitectura de Software',
          'Sistemas distribuidos y microservicios.',
          'Auditorio Central Tech',
          NOW() + INTERVAL '10 days',
          150,
          150.00,
          'PUBLICADO',
          3,
          2
        ),
        (
          '${events.event2}',
          '${users.organizador1}',
          'Workshop de Testing con k6',
          'Pruebas de carga y estrés.',
          'Laboratorio Beta',
          NOW() + INTERVAL '15 days',
          60,
          0,
          'PUBLICADO',
          1,
          6
        ),
        (
          '${events.event3}',
          '${users.organizador2}',
          'Hackathon Fullstack Node.js',
          'Backend escalable en 48 horas.',
          'Centro Nexus',
          NOW() + INTERVAL '30 days',
          200,
          50,
          'BORRADOR',
          0,
          0
        ),
        (
          '${events.event4}',
          '${users.organizador2}',
          'Curso Intensivo PostgreSQL',
          'Índices, locks y performance.',
          'Sala Delta',
          NOW() + INTERVAL '7 days',
          80,
          75,
          'PUBLICADO',
          4,
          1
        )
      ON CONFLICT DO NOTHING;
    `

    await client.query(eventosQuery)

    console.log('[SEED] Eventos insertados')

    // ============================================
    // RESERVAS
    // ============================================

    const reservasQuery = `
      INSERT INTO reservas (
        id,
        evento_id,
        usuario_id,
        cantidad_tickets,
        estado,
        codigo_ticket,
        pagado_en,
        reservado_en
      )
      VALUES
        (
          'f1111111-1111-1111-1111-111111111111',
          $1,
          $4,
          1,
          'CONFIRMADA',
          $6,
          NOW(),
          NOW() - INTERVAL '2 hours'
        ),
        (
          'f2222222-2222-2222-2222-222222222222',
          $2,
          $5,
          2,
          'PENDIENTE_PAGO',
          $7,
          NULL,
          NOW() - INTERVAL '5 minutes'
        ),
        (
          'f3333333-3333-3333-3333-333333333333',
          $2,
          $4,
          4,
          'PENDIENTE_PAGO',
          $8,
          NULL,
          NOW() - INTERVAL '25 minutes'
        ),
        (
          'f4444444-4444-4444-4444-444444444444',
          $1,
          $5,
          2,
          'CANCELADA',
          $9,
          NULL,
          NOW() - INTERVAL '1 day'
        ),
        (
          'f5555555-5555-5555-5555-555555555555',
          $3,
          $4,
          3,
          'CONFIRMADA',
          $10,
          NOW(),
          NOW() - INTERVAL '3 days'
        ),
        (
          'f6666666-6666-6666-6666-666666666666',
          $1,
          $5,
          4,
          'EXPIRADA',
          $11,
          NULL,
          NOW() - INTERVAL '40 minutes'
        )
      ON CONFLICT DO NOTHING;
    `

    await client.query(reservasQuery, [
      events.event1,
      events.event2,
      events.event4,

      users.asistente1,
      users.asistente2,

      generateTicketCode(),
      generateTicketCode(),
      generateTicketCode(),
      generateTicketCode(),
      generateTicketCode(),
      generateTicketCode()
    ])

    console.log('[SEED] Reservas insertadas')

    await client.query('COMMIT')

    console.log('[SEED] Datos insertados correctamente')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[SEED ERROR]', error)
  } finally {
    client.release()
    await pool.end()
    process.exit(0)
  }
}

seed()