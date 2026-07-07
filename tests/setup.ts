// tests/setup.ts
import '../src/shared/infrastructure/config/env.loader';
import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('\n[Global Setup]: Iniciando infraestructura de integración...');
  try {
    // Ejecutas tu script de migraciones para garantizar que la DB tiene el último esquema
    console.log('[Global Setup]: Corriendo migraciones en base de datos de prueba...');
    execSync('npm run db:migrate', {
      env: { ...process.env, DB_NAME: 'event_system_test' }
    });
  } catch (error) {
    console.error('[Global Setup] Error configurando la base de datos de pruebas:', error);
    process.exit(1);
  }
}