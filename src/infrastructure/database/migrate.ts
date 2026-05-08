// src/infrastructure/database/migrate.ts
import pool from './connection';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('🔄 Ejecutando migraciones...');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    console.log(`📝 Ejecutando: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`✅ Completado: ${file}`);
    } catch (error: any) {
      console.error(`❌ Error en ${file}:`, error.message);
    }
  }
  
  console.log('✅ Migraciones completadas');
  process.exit(0);
}

runMigrations();
