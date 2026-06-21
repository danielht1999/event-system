// src/shared/infrastructure/database/seed.ts

import pool from './connection';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

function generateTicketCode(): string {
  return `TCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function seed() {
  console.log('[SEED] Iniciando inserción de datos de prueba...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ============================================
    // Verificar tablas obligatorias
    // ============================================
    await client.query('SELECT 1 FROM usuarios LIMIT 1');
    await client.query('SELECT 1 FROM eventos LIMIT 1');
    await client.query('SELECT 1 FROM ticket_types LIMIT 1');
    await client.query('SELECT 1 FROM reservas LIMIT 1');

    const passwordHash = await bcrypt.hash('123456', 10);

    // ============================================
    // 1. USUARIOS
    // ============================================
    const users = {
      organizador1: '11111111-1111-1111-1111-111111111111',
      organizador2: '22222222-2222-2222-2222-222222222222',
      asistente1: '33333333-3333-3333-3333-333333333333',
      asistente2: '44444444-4444-4444-4444-444444444444'
    };

    const usuariosQuery = `
      INSERT INTO usuarios (id, email, nombre, password_hash, rol)
      VALUES
        ('${users.organizador1}', 'organizador@test.com', 'Organizador Principal', $1, 'ORGANIZADOR'),
        ('${users.organizador2}', 'organizador2@test.com', 'Organizador Secundario', $1, 'ORGANIZADOR'),
        ('${users.asistente1}', 'asistente1@test.com', 'Asistente Uno', $1, 'ASISTENTE'),
        ('${users.asistente2}', 'asistente2@test.com', 'Asistente Dos', $1, 'ASISTENTE')
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(usuariosQuery, [passwordHash]);

    // ============================================
    // 2. EVENTOS
    // ============================================
    const events = {
      event1: 'a1111111-1111-1111-1111-111111111111',
      event2: 'b2222222-2222-2222-2222-222222222222',
      event3: 'c3333333-3333-3333-3333-333333333333'
    };

    const eventosQuery = `
      INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, estado)
      VALUES
        ('${events.event1}', '${users.organizador1}', 'Conferencia de Software', 'Sistemas distribuidos', 'Auditorio A', NOW() + INTERVAL '10 days', 'PUBLICADA'),
        ('${events.event2}', '${users.organizador1}', 'Workshop de k6', 'Pruebas de carga', 'Laboratorio B', NOW() + INTERVAL '15 days', 'PUBLICADA'),
        ('${events.event3}', '${users.organizador2}', 'Hackathon', 'Coding 48h', 'Nexus Center', NOW() + INTERVAL '30 days', 'BORRADOR')
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(eventosQuery);

    // ============================================
    // 3. TIPOS DE TICKETS (Corregido: Nombre tabla y columnas)
    // ============================================
    const ticketTypes = {
      tckType1: '01111111-1111-1111-1111-111111111111',
      tckType2: '02222222-2222-2222-2222-222222222222',
      tckType3: '03333333-3333-3333-3333-333333333333'
    };

    const ticketTypesQuery = `
      INSERT INTO ticket_types (id, evento_id, nombre, precio, capacidad_maxima, estado)
      VALUES
        ('${ticketTypes.tckType1}', '${events.event1}', 'General', 150.00, 150, 'ACTIVO'),
        ('${ticketTypes.tckType2}', '${events.event2}', 'Estudiante', 0.00, 60, 'ACTIVO'),
        ('${ticketTypes.tckType3}', '${events.event3}', 'Early Bird', 50.00, 200, 'ACTIVO')
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(ticketTypesQuery);

    // ============================================
    // 4. RESERVAS
    // ============================================
    const reservasQuery = `
      INSERT INTO reservas (
        id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket
      )
      VALUES
        (
            'f1111111-1111-1111-1111-111111111111', 
            '${events.event1}', 
            '${ticketTypes.tckType1}', 
            '${users.asistente1}', 
            1, 
            'CONFIRMADA', 
            $1
        ),
        (
            'f2222222-2222-2222-2222-222222222222', 
            '${events.event2}', 
            '${ticketTypes.tckType2}', 
            '${users.asistente2}', 
            2, 
            'PENDIENTE_PAGO', 
            $2
        )
      ON CONFLICT (id) DO NOTHING;
    `;
    await client.query(reservasQuery, [generateTicketCode(), generateTicketCode()]);

    await client.query('COMMIT');
    console.log('[SEED] ✅ Datos insertados correctamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SEED ERROR]', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seed();