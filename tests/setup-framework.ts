// tests/setup-framework.ts
import pool from '../src/shared/infrastructure/database/connection';

// Se ejecuta antes de cada archivo de test de integración
beforeEach(async () => {
  // Truncamos las tablas críticas de forma masiva para limpiar el estado
  // Usar TRUNCATE con CASCADE limpia dependencias de llaves foráneas de golpe
  await pool.query('TRUNCATE TABLE usuarios, eventos, reservas CASCADE');
});

// Se ejecuta al finalizar cada archivo de test de integración
afterAll(async () => {
  // Cerramos el pool de conexiones global para evitar fugas de memoria (memory leaks)
  // y que Jest se quede colgado al terminar
  await pool.end();
});