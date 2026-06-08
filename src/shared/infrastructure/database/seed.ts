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
    // USERS (MÁS USUARIOS PARA PRUEBAS)
    // ============================================

    const users = {
      // Organizadores existentes
      organizador1: '11111111-1111-1111-1111-111111111111',
      organizador2: '22222222-2222-2222-2222-222222222222',
      
      // Asistentes existentes
      asistente1: '33333333-3333-3333-3333-333333333333',
      asistente2: '44444444-4444-4444-4444-444444444444',
      asistente3: '55555555-5555-5555-5555-555555555555',
      
      // NUEVOS ASISTENTES para pruebas de carga
      asistente4: '66666666-6666-6666-6666-666666666666',
      asistente5: '77777777-7777-7777-7777-777777777777',
      asistente6: '88888888-8888-8888-8888-888888888888',
      asistente7: '99999999-9999-9999-9999-999999999999',
      asistente8: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      asistente9: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      asistente10: 'cccccccc-cccc-cccc-cccc-cccccccccccc'
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
        ),
        (
          '${users.asistente4}',
          'asistente4@test.com',
          'Asistente Cuatro',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente5}',
          'asistente5@test.com',
          'Asistente Cinco',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente6}',
          'asistente6@test.com',
          'Asistente Seis',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente7}',
          'asistente7@test.com',
          'Asistente Siete',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente8}',
          'asistente8@test.com',
          'Asistente Ocho',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente9}',
          'asistente9@test.com',
          'Asistente Nueve',
          $1,
          'ASISTENTE'
        ),
        (
          '${users.asistente10}',
          'asistente10@test.com',
          'Asistente Diez',
          $1,
          'ASISTENTE'
        )
      ON CONFLICT (id) DO NOTHING;
    `

    const userResult = await client.query(usuariosQuery, [passwordHash])
    console.log(`[SEED] Usuarios insertados: ${userResult.rowCount} nuevos`)

    // ============================================
    // EVENTS (INCLUYE NUEVOS EVENTOS DE ALTA CAPACIDAD)
    // ============================================

    const events = {
      // Eventos existentes
      event1: 'a1111111-1111-1111-1111-111111111111',
      event2: 'b2222222-2222-2222-2222-222222222222',
      event3: 'c3333333-3333-3333-3333-333333333333',
      event4: 'd4444444-4444-4444-4444-444444444444',
      
      // NUEVOS EVENTOS DE ALTA CAPACIDAD (10,000 cupos cada uno) - UUIDs corregidos
      event5: 'e5555555-5555-5555-5555-555555555555',
      event6: 'f6666666-6666-6666-6666-666666666666',
      event7: 'a7777777-7777-7777-7777-777777777777',
      event8: 'b8888888-8888-8888-8888-888888888888',
      event9: 'c9999999-9999-9999-9999-999999999999',
      event10: 'daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event11: 'ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      event12: 'fccccccc-cccc-cccc-cccc-cccccccccccc'
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
        -- EVENTOS EXISTENTES
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
        ),
        
        -- NUEVOS EVENTOS DE ALTA CAPACIDAD (PARA PRUEBAS DE CARGA)
        (
          '${events.event5}',
          '${users.organizador1}',
          'Mega Conferencia Tech 2025',
          'El evento de tecnología más grande del año con speakers internacionales.',
          'Estadio Principal',
          NOW() + INTERVAL '20 days',
          10000,
          299.99,
          'PUBLICADO',
          0,
          0
        ),
        (
          '${events.event6}',
          '${users.organizador1}',
          'Festival de Música Digital',
          'Los mejores artistas electrónicos en un evento masivo.',
          'Parque de la Innovación',
          NOW() + INTERVAL '25 days',
          10000,
          150.00,
          'PUBLICADO',
          0,
          0
        ),
        (
          '${events.event7}',
          '${users.organizador2}',
          'Convención Internacional de Software',
          '3 días de conferencias, talleres y networking.',
          'Centro de Convenciones',
          NOW() + INTERVAL '35 days',
          10000,
          450.00,
          'PUBLICADO',
          0,
          0
        ),
        (
          '${events.event8}',
          '${users.organizador2}',
          'Maratón de Innovación',
          '24 horas creando soluciones tecnológicas para problemas reales.',
          'Espacio Coworking Central',
          NOW() + INTERVAL '40 days',
          10000,
          75.00,
          'PUBLICADO',
          0,
          0
        ),
        (
          '${events.event9}',
          '${users.organizador1}',
          'Expo de Startups Global',
          'Conoce las startups más prometedoras del ecosistema.',
          'Pabellón de Exposiciones',
          NOW() + INTERVAL '45 days',
          10000,
          0,
          'PUBLICADO',
          0,
          0
        ),
        (
          '${events.event10}',
          '${users.organizador2}',
          'Cumbre de Inteligencia Artificial',
          'El futuro de la IA aplicada a negocios y sociedad.',
          'Auditorio Nacional',
          NOW() + INTERVAL '50 days',
          10000,
          599.99,
          'PUBLICADO',
          0,
          0
        ),
        (
          '${events.event11}',
          '${users.organizador1}',
          'Tech Week 2025',
          'Una semana completa de tecnología, innovación y desarrollo.',
          'Distrito Tecnológico',
          NOW() + INTERVAL '55 days',
          10000,
          199.99,
          'PUBLICADO',
          0,
          0
        ),
        (
          '${events.event12}',
          '${users.organizador2}',
          'Congreso de Desarrollo Ágil',
          'Metodologías ágiles, DevOps y transformación digital.',
          'Hotel Crowne Plaza',
          NOW() + INTERVAL '60 days',
          10000,
          325.00,
          'PUBLICADO',
          0,
          0
        )
      ON CONFLICT (id) DO NOTHING;
    `

    const eventResult = await client.query(eventosQuery)
    console.log(`[SEED] Eventos insertados: ${eventResult.rowCount} nuevos`)

    // ============================================
    // RESERVAS (SOLO PARA EVENTOS EXISTENTES)
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
      ON CONFLICT (id) DO NOTHING;
    `

    // Solo los eventos existentes reciben reservas iniciales
    const reservaResult = await client.query(reservasQuery, [
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

    console.log(`[SEED] Reservas insertadas: ${reservaResult.rowCount} nuevas`)

    await client.query('COMMIT')

    console.log('\n[SEED] ✅ DATOS INSERTADOS CORRECTAMENTE')
    console.log('[SEED] 📊 Resumen:')
    console.log(`[SEED]    - Usuarios: 10 asistentes + 2 organizadores`)
    console.log(`[SEED]    - Eventos: 4 existentes + 8 de alta capacidad (10,000 cupos)`)
    console.log(`[SEED]    - Reservas: Solo en eventos existentes (6 reservas)`)
    console.log('[SEED]    - Eventos de carga disponibles: event5 a event12')
    console.log('[SEED]    - IDs de eventos de carga:')
    console.log(`[SEED]      • ${events.event5} (Mega Conferencia Tech 2025)`)
    console.log(`[SEED]      • ${events.event6} (Festival de Música Digital)`)
    console.log(`[SEED]      • ${events.event7} (Convención Internacional de Software)`)
    console.log(`[SEED]      • ${events.event8} (Maratón de Innovación)`)
    console.log(`[SEED]      • ${events.event9} (Expo de Startups Global)`)
    console.log(`[SEED]      • ${events.event10} (Cumbre de Inteligencia Artificial)`)
    console.log(`[SEED]      • ${events.event11} (Tech Week 2025)`)
    console.log(`[SEED]      • ${events.event12} (Congreso de Desarrollo Ágil)`)
    
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