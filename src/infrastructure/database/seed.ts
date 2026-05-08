import pool from './connection';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Insertando datos de prueba...');
  
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const query = `
    INSERT INTO usuarios (id, email, nombre, password_hash, rol)
    VALUES 
      ('11111111-1111-1111-1111-111111111111', 'organizador@test.com', 'Organizador Test', $1, 'organizador'),
      ('22222222-2222-2222-2222-222222222222', 'asistente@test.com', 'Asistente Test', $1, 'asistente')
    ON CONFLICT (email) DO NOTHING;
  `;
  
  await pool.query(query, [passwordHash]);
  console.log('Usuarios de prueba creados');
  process.exit(0);
}

seed();