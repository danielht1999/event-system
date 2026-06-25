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

    // Verificar tablas
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

    await client.query(
      `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
       VALUES ($1, 'organizador@test.com', 'Organizador Principal', $2, 'ORGANIZADOR')
       ON CONFLICT (id) DO NOTHING;`,
      [users.organizador1, passwordHash]
    );

    await client.query(
      `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
       VALUES ($1, 'organizador2@test.com', 'Organizador Secundario', $2, 'ORGANIZADOR')
       ON CONFLICT (id) DO NOTHING;`,
      [users.organizador2, passwordHash]
    );

    await client.query(
      `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
       VALUES ($1, 'asistente1@test.com', 'Asistente Uno', $2, 'ASISTENTE')
       ON CONFLICT (id) DO NOTHING;`,
      [users.asistente1, passwordHash]
    );

    await client.query(
      `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
       VALUES ($1, 'asistente2@test.com', 'Asistente Dos', $2, 'ASISTENTE')
       ON CONFLICT (id) DO NOTHING;`,
      [users.asistente2, passwordHash]
    );

    console.log('[SEED] ✅ Usuarios insertados');

    // ============================================
    // 2. EVENTOS
    // ============================================
    const events = {
      event1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      event2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      event3: 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    };

    await client.query(
      `INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, capacidad_total, estado)
       VALUES ($1, $2, 'Conferencia de Software', 'Sistemas distribuidos', 'Auditorio A', NOW() + INTERVAL '10 days', 500, 'PUBLICADA')
       ON CONFLICT (id) DO NOTHING;`,
      [events.event1, users.organizador1]
    );

    await client.query(
      `INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, capacidad_total, estado)
       VALUES ($1, $2, 'Workshop de k6', 'Pruebas de carga', 'Laboratorio B', NOW() + INTERVAL '15 days', 200, 'PUBLICADA')
       ON CONFLICT (id) DO NOTHING;`,
      [events.event2, users.organizador1]
    );

    await client.query(
      `INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, capacidad_total, estado)
       VALUES ($1, $2, 'Hackathon', 'Coding 48h', 'Nexus Center', NOW() + INTERVAL '30 days', 300, 'BORRADOR')
       ON CONFLICT (id) DO NOTHING;`,
      [events.event3, users.organizador2]
    );

    console.log('[SEED] ✅ Eventos insertados');

    // ============================================
    // 3. TIPOS DE TICKETS
    // ============================================
    const ticketTypes = {
      tckType1: '11111111-1111-1111-1111-111111111111',
      tckType2: '22222222-2222-2222-2222-222222222222',
      tckType3: '33333333-3333-3333-3333-333333333333'
    };

    await client.query(
      `INSERT INTO ticket_types (id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado)
       VALUES ($1, $2, 'General', 150.00, 150, 0, 'ACTIVO')
       ON CONFLICT (id) DO NOTHING;`,
      [ticketTypes.tckType1, events.event1]
    );

    await client.query(
      `INSERT INTO ticket_types (id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado)
       VALUES ($1, $2, 'Estudiante', 0.00, 60, 0, 'ACTIVO')
       ON CONFLICT (id) DO NOTHING;`,
      [ticketTypes.tckType2, events.event2]
    );

    await client.query(
      `INSERT INTO ticket_types (id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado)
       VALUES ($1, $2, 'Early Bird', 50.00, 200, 0, 'ACTIVO')
       ON CONFLICT (id) DO NOTHING;`,
      [ticketTypes.tckType3, events.event3]
    );

    console.log('[SEED] ✅ Tipos de ticket insertados');

    // ============================================
    // 4. RESERVAS
    // ============================================

    // Reserva 1: CONFIRMADA
    const codigo1 = generateTicketCode();
    const reserva1Id = '11111111-1111-1111-1111-111111111111';
    await client.query(
      `INSERT INTO reservas (id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket)
       VALUES ($1, $2, $3, $4, 1, 'CONFIRMADA', $5)
       ON CONFLICT (id) DO NOTHING;`,
      [reserva1Id, events.event1, ticketTypes.tckType1, users.asistente1, codigo1]
    );

    console.log('[SEED] ✅ Reserva 1 (CONFIRMADA) insertada');

    // Reserva 2: PENDIENTE_PAGO
    const codigo2 = generateTicketCode();
    const reserva2Id = '22222222-2222-2222-2222-222222222222';
    await client.query(
      `INSERT INTO reservas (id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket)
       VALUES ($1, $2, $3, $4, 2, 'PENDIENTE_PAGO', $5)
       ON CONFLICT (id) DO NOTHING;`,
      [reserva2Id, events.event2, ticketTypes.tckType2, users.asistente2, codigo2]
    );

    console.log('[SEED] ✅ Reserva 2 (PENDIENTE_PAGO) insertada');

    // Actualizar reservas_pendientes
    await client.query(
      `UPDATE ticket_types
       SET reservas_pendientes = reservas_pendientes + 2
       WHERE id = $1`,
      [ticketTypes.tckType2]
    );

    console.log('[SEED] ✅ reservas_pendientes actualizado (+2)');

    // ============================================
    // 5. PAYMENTS
    // ============================================
    // ✅ Pago para la reserva confirmada (UUID válido)
    const paymentId = '55555555-5555-5555-5555-555555555555';
    await client.query(
      `INSERT INTO payments (id, reservation_id, usuario_id, monto, moneda, estado)
       VALUES ($1, $2, $3, 150.00, 'MXN', 'APROBADO')
       ON CONFLICT (id) DO NOTHING;`,
      [paymentId, reserva1Id, users.asistente1]
    );

    console.log('[SEED] ✅ Payment insertado');

    // ============================================
    // 6. Verificación final
    // ============================================
    const verifyResult = await client.query(
      `
      SELECT 
        tt.id,
        tt.nombre,
        tt.capacidad,
        tt.reservas_pendientes,
        tt.reservas_confirmadas,
        (
          SELECT COALESCE(SUM(r.cantidad_tickets), 0)
          FROM reservas r
          WHERE r.ticket_type_id = tt.id
          AND r.estado = 'PENDIENTE_PAGO'
        ) as total_pendiente_real
      FROM ticket_types tt
      WHERE tt.id IN ($1, $2)
      `,
      [ticketTypes.tckType1, ticketTypes.tckType2]
    );

    console.log('[SEED] 📊 Verificación de ticket_types:');
    verifyResult.rows.forEach((row) => {
      console.log(
        `  ${row.nombre}: capacidad=${row.capacidad}, ` +
        `reservas_pendientes=${row.reservas_pendientes}, ` +
        `reservas_confirmadas=${row.reservas_confirmadas}, ` +
        `total_pendiente_real=${row.total_pendiente_real}`
      );
    });

    // ============================================
    // 7. Resumen final
    // ============================================
    console.log('[SEED] 📊 Resumen:');
    console.log(`  👤 Usuarios: 4`);
    console.log(`  📅 Eventos: 3`);
    console.log(`  🎫 Ticket Types: 3`);
    console.log(`  📋 Reservas: 2`);
    console.log(`  💳 Payments: 1`);

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