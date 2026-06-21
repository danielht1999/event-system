// src/shared/infrastructure/database/migrate.ts

import pool from './connection';
import fs from 'fs';
import path from 'path';

export async function runMigrations(): Promise<void> {
  console.log('Ejecutando migraciones...');

  const migrationsDir = path.resolve(__dirname, './migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`No existe directorio: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Ejecutando: ${file}`);

    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    try {
      for (const statement of statements) {
        console.log('--------------------------------');
        console.log(statement);
        console.log('--------------------------------');

        await pool.query(statement);
      }

      console.log(`Completado: ${file}`);
    } catch (error: any) {
      console.error(`Error en ${file}:`, error.message);
      throw error;
    }
  }

  console.log('Migraciones completadas con éxito 🎉');
}

// Permite ejecutar el archivo directamente
if (require.main === module) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(error);
      await pool.end();
      process.exit(1);
    });
}