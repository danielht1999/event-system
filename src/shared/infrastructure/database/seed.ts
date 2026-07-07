// src/shared/infrastructure/database/seed.ts

import pool from './connection';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

function generateTicketCode(): string {
  return `TCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysFromNow: number, daysRange: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + randomInt(daysFromNow, daysFromNow + daysRange));
  return date;
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// ============================================
// CONFIGURACIÓN DE DATOS
// ============================================

const EVENT_TITLES = [
  'Conferencia de Software', 'Workshop de React', 'Hackathon 2026',
  'Festival de Música', 'Torneo de Esports', 'Cumbre de IA',
  'Meetup de Startups', 'Curso de Docker', 'Seminario de Finanzas',
  'Concierto de Rock', 'Exposición de Arte', 'Congreso de Medicina',
  'Feria de Empleo', 'Maratón de Código', 'Taller de Diseño'
];

const EVENT_DESCRIPTIONS = [
  'Evento de tecnología con charlas y talleres',
  'Aprende las últimas tendencias en desarrollo',
  'Competencia de programación por equipos',
  'Noche de música en vivo con bandas locales',
  'Torneo profesional de videojuegos',
  'Conferencia sobre inteligencia artificial',
  'Networking para emprendedores e inversores',
  'Capacitación intensiva en contenedores',
  'Estrategias de inversión para el futuro',
  'Banda tributo a Queen en concierto',
  'Obras de artistas contemporáneos',
  'Avances en investigación médica',
  'Encuentro con las mejores empresas',
  'Competencia de desarrollo de software',
  'Creatividad y pensamiento visual'
];

const LOCATIONS = [
  'Auditorio A', 'Laboratorio B', 'Nexus Center', 'Sala Principal',
  'Teatro Municipal', 'Centro de Convenciones', 'Espacio Coworking',
  'Universidad Tecnológica', 'Estadio de la Ciudad', 'Museo de Arte',
  'Hospital General', 'Parque Empresarial', 'Centro Cultural',
  'Biblioteca Pública', 'Campus Universitario'
];

const TICKET_NAMES = ['General', 'VIP', 'Preferente', 'Estudiante', 'Early Bird', 'Premium'];

async function seed() {
  console.log('[SEED] 🌱 Iniciando inserción de datos de prueba...');
  console.log('[SEED] ⏳ Este proceso puede tomar unos segundos...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ============================================
    // 1. USUARIOS (10)
    // ============================================
    const passwordHash = await bcrypt.hash('123456', 10);

    const users = [
      { id: generateId(), email: 'organizador1@test.com', nombre: 'Carlos Mendoza', rol: 'ORGANIZADOR' },
      { id: generateId(), email: 'organizador2@test.com', nombre: 'Laura Fernández', rol: 'ORGANIZADOR' },
      { id: generateId(), email: 'organizador3@test.com', nombre: 'Roberto Sánchez', rol: 'ORGANIZADOR' },
      { id: generateId(), email: 'asistente1@test.com', nombre: 'Ana García', rol: 'ASISTENTE' },
      { id: generateId(), email: 'asistente2@test.com', nombre: 'Miguel Torres', rol: 'ASISTENTE' },
      { id: generateId(), email: 'asistente3@test.com', nombre: 'Elena Ramírez', rol: 'ASISTENTE' },
      { id: generateId(), email: 'asistente4@test.com', nombre: 'Diego Castro', rol: 'ASISTENTE' },
      { id: generateId(), email: 'asistente5@test.com', nombre: 'Valentina León', rol: 'ASISTENTE' },
      { id: generateId(), email: 'asistente6@test.com', nombre: 'Andrés Mora', rol: 'ASISTENTE' },
      { id: generateId(), email: 'asistente7@test.com', nombre: 'Sofía Ríos', rol: 'ASISTENTE' },
    ];

    for (const user of users) {
      await client.query(
        `INSERT INTO usuarios (id, email, nombre, password_hash, rol)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING;`,
        [user.id, user.email, user.nombre, passwordHash, user.rol]
      );
    }

    console.log('[SEED] ✅ Usuarios insertados:', users.length);

    // ============================================
    // 2. EVENTOS (15)
    // ============================================
    const eventos = [];
    const organizadorIds = users.filter(u => u.rol === 'ORGANIZADOR').map(u => u.id);

    for (let i = 0; i < 15; i++) {
      const id = generateId();
      const titulo = EVENT_TITLES[i % EVENT_TITLES.length];
      const descripcion = EVENT_DESCRIPTIONS[i % EVENT_DESCRIPTIONS.length];
      const lugar = LOCATIONS[i % LOCATIONS.length];
      const fecha = randomDate(i + 1, 20);
      const capacidadTotal = randomInt(50, 500);
      const estado = i < 10 ? 'PUBLICADA' : (i < 13 ? 'BORRADOR' : 'CANCELADA');
      const organizadorId = randomItem(organizadorIds);

      await client.query(
        `INSERT INTO eventos (id, organizador_id, titulo, descripcion, lugar, fecha, capacidad_total, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING;`,
        [id, organizadorId, titulo, descripcion, lugar, fecha, capacidadTotal, estado]
      );

      eventos.push({ id, organizadorId, titulo, capacidadTotal });
    }

    console.log('[SEED] ✅ Eventos insertados:', eventos.length);

    // ============================================
    // 3. TIPOS DE TICKETS (2-4 por evento)
    // ============================================
    const ticketTypes = [];

    for (const evento of eventos) {
      const numTickets = randomInt(2, 4);
      const usedNames = new Set<string>();

      for (let i = 0; i < numTickets; i++) {
        let nombre = randomItem(TICKET_NAMES);
        while (usedNames.has(nombre)) {
          nombre = randomItem(TICKET_NAMES);
        }
        usedNames.add(nombre);

        const id = generateId();
        const precio = nombre === 'Estudiante' ? 0 : randomInt(50, 500);
        const capacidad = Math.floor(evento.capacidadTotal / numTickets) + randomInt(-20, 20);
        const finalCapacidad = Math.max(10, capacidad);

        await client.query(
          `INSERT INTO ticket_types (id, evento_id, nombre, precio, capacidad, reservas_pendientes, estado)
           VALUES ($1, $2, $3, $4, $5, 0, 'ACTIVO')
           ON CONFLICT (id) DO NOTHING;`,
          [id, evento.id, nombre, precio, finalCapacidad]
        );

        ticketTypes.push({ id, eventoId: evento.id, nombre, precio, capacidad: finalCapacidad });
      }
    }

    console.log('[SEED] ✅ Tipos de ticket insertados:', ticketTypes.length);

    // ============================================
    // 4. RESERVAS (50+)
    // ============================================
    const reservas = [];
    const asistenteIds = users.filter(u => u.rol === 'ASISTENTE').map(u => u.id);
    const estados = ['CONFIRMADA', 'PENDIENTE_PAGO', 'CANCELADA', 'EXPIRADA'];
    const estadosPesos = [0.4, 0.3, 0.15, 0.15]; // 40% confirmadas, 30% pendientes, etc.

    // Seleccionar eventos publicados para reservas
    const eventosPublicados = eventos.filter((_, i) => i < 10);

    for (const evento of eventosPublicados) {
      const ticketsDelEvento = ticketTypes.filter(t => t.eventoId === evento.id);
      const numReservas = randomInt(2, 6);

      for (let i = 0; i < numReservas; i++) {
        const ticket = randomItem(ticketsDelEvento);
        const cantidad = randomInt(1, 3);
        const usuarioId = randomItem(asistenteIds);
        
        // Seleccionar estado con peso
        let estado = estados[0];
        let rand = Math.random();
        let acumulado = 0;
        for (let j = 0; j < estados.length; j++) {
          acumulado += estadosPesos[j];
          if (rand < acumulado) {
            estado = estados[j];
            break;
          }
        }

        const id = generateId();
        const codigo = generateTicketCode();

        await client.query(
          `INSERT INTO reservas (id, evento_id, ticket_type_id, usuario_id, cantidad_tickets, estado, codigo_ticket)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING;`,
          [id, evento.id, ticket.id, usuarioId, cantidad, estado, codigo]
        );

        reservas.push({ id, eventoId: evento.id, ticketId: ticket.id, usuarioId, estado, cantidad });

        // Actualizar reservas_pendientes en ticket_types
        if (estado === 'PENDIENTE_PAGO') {
          await client.query(
            `UPDATE ticket_types
             SET reservas_pendientes = reservas_pendientes + $1
             WHERE id = $2`,
            [cantidad, ticket.id]
          );
        }
      }
    }

    console.log('[SEED] ✅ Reservas insertadas:', reservas.length);

    // ============================================
    // 5. PAYMENTS (para reservas confirmadas)
    // ============================================
    const reservasConfirmadas = reservas.filter(r => r.estado === 'CONFIRMADA');
    let paymentsCount = 0;

    for (const reserva of reservasConfirmadas) {
      const ticket = ticketTypes.find(t => t.id === reserva.ticketId);
      if (!ticket) continue;

      const monto = ticket.precio * reserva.cantidad;
      const paymentId = generateId();

      await client.query(
        `INSERT INTO payments (id, reservation_id, usuario_id, monto, moneda, estado)
         VALUES ($1, $2, $3, $4, 'MXN', 'APROBADO')
         ON CONFLICT (id) DO NOTHING;`,
        [paymentId, reserva.id, reserva.usuarioId, monto]
      );

      paymentsCount++;
    }

    console.log('[SEED] ✅ Payments insertados:', paymentsCount);

    // ============================================
    // 6. Verificación final
    // ============================================
    const verifyResult = await client.query(
      `
      SELECT 
        COUNT(*) as total,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'ORGANIZADOR') as organizadores,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'ASISTENTE') as asistentes
      FROM usuarios
      `
    );

    const totalReservas = await client.query('SELECT COUNT(*) FROM reservas');
    const totalPayments = await client.query('SELECT COUNT(*) FROM payments');

    console.log('[SEED] 📊 Resumen final:');
    console.log(`  👤 Usuarios: ${verifyResult.rows[0].total}`);
    console.log(`    🧑‍💼 Organizadores: ${verifyResult.rows[0].organizadores}`);
    console.log(`    👥 Asistentes: ${verifyResult.rows[0].asistentes}`);
    console.log(`  📅 Eventos: ${eventos.length}`);
    console.log(`  🎫 Ticket Types: ${ticketTypes.length}`);
    console.log(`  📋 Reservas: ${totalReservas.rows[0].count}`);
    console.log(`  💳 Payments: ${totalPayments.rows[0].count}`);

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