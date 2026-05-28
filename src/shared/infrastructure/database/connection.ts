// src/infrastructure/database/connection.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

//carga el archivo correcto según el entorno:
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'event_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Probar conexion
pool.on('connect', () => {
  console.log('Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error en PostgreSQL:', err);
});

export default pool;
