import pool from './connection';
import bcrypt from 'bcrypt';
import crypto from 'crypto'; // Nativo de Node.js para generar el código de ticket único

async function seed() {
  console.log('[SEED] Iniciando inserción de datos de prueba...');
  
  try {
    const passwordHash = await bcrypt.hash('123456', 10);
    
    // ----------------------------------------------------
    // 1. INSERTAR USUARIOS (IDs fijos para testing)
    // ----------------------------------------------------
    const organizadorId = '11111111-1111-1111-1111-111111111111';
    const asistenteId   = '22222222-2222-2222-2222-222222222222';

    const usuariosQuery = `
      INSERT INTO usuarios (id, email, nombre, password_hash, rol)
      VALUES 
        ('${organizadorId}', 'organizador@test.com', 'Organizador Test', $1, 'ORGANIZADOR'),
        ('${asistenteId}', 'asistente@test.com', 'Asistente Test', $1, 'asistente')
      ON CONFLICT (email) DO NOTHING;
    `;
    
    await pool.query(usuariosQuery, [passwordHash]);
    console.log('Usuarios mapeados.');

    // ----------------------------------------------------
    // 2. INSERTAR EVENTOS (Mapeado exacto con tus columnas)
    // ----------------------------------------------------
    const evento1Id = 'a1111111-1111-1111-1111-111111111111';
    const evento2Id = 'b2222222-2222-2222-2222-222222222222';
    const evento3Id = 'c3333333-3333-3333-3333-333333333333';

    const eventosQuery = `
      INSERT INTO eventos (
        id, organizador_id, titulo, descripcion, lugar, 
        fecha, capacidad_total, precio, estado, reservas_confirmadas, reservas_pendientes
      )
      VALUES 
        (
          '${evento1Id}', 
          '${organizadorId}', 
          'Conferencia de Arquitectura de Software', 
          'Sistemas distribuidos, escalabilidad con colas de mensajería y optimización de base de datos.', 
          'Auditorio Virtual Alpha', 
          NOW() + INTERVAL '10 days', 
          150, 
          150.00, 
          'PUBLICADO', 
          1, 
          0
        ),
        (
          '${evento2Id}', 
          '${organizadorId}', 
          'Workshop Práctico de k6 y Pruebas de Carga', 
          'Aprende a encontrar los límites de concurrencia y estrés de tus APIs.', 
          'Laboratorio Tech Room B', 
          NOW() + INTERVAL '15 days', 
          50, 
          0.00, 
          'PUBLICADO', 
          0, 
          1
        ),
        (
          '${evento3Id}', 
          '${organizadorId}', 
          'Hackathon de Node.js & TypeScript', 
          'Construye backend escalable en un fin de semana intenso.', 
          'Centro de Convenciones Nexus', 
          NOW() + INTERVAL '30 days', 
          200, 
          45.50, 
          'BORRADOR', 
          0, 
          0
        )
      ON CONFLICT (id) DO NOTHING;
    `;

    await pool.query(eventosQuery);
    console.log('Eventos mapeados (Borradores y Publicados).');

    // ----------------------------------------------------
    // 3. INSERTAR RESERVAS COHERENTES
    // ----------------------------------------------------
    // Generamos códigos únicos aleatorios que cumplan con VARCHAR(50) UNIQUE
    const ticketCode1 = `TCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const ticketCode2 = `TCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const reservasQuery = `
      INSERT INTO reservas (id, evento_id, usuario_id, cantidad_tickets, estado, codigo_ticket, pagado_en)
      VALUES 
        (
          'f1111111-1111-1111-1111-111111111111', 
          '${evento1Id}', 
          '${asistenteId}', 
          1, 
          'CONFIRMADA', 
          '${ticketCode1}', 
          NOW()
        ),
        (
          'f2222222-2222-2222-2222-222222222222', 
          '${evento2Id}', 
          '${asistenteId}', 
          2, 
          'PENDIENTE_PAGO', 
          '${ticketCode2}', 
          NULL
        )
      ON CONFLICT (id) DO NOTHING;
    `;

    await pool.query(reservasQuery);
    console.log('Reservas de prueba enlazadas con tickets únicos.');
    console.log('Seeding estructurado con éxito.');

  } catch (error) {
    console.error('Error crítico en el seeding:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();