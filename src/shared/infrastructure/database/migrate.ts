import pool from './connection'
import fs from 'fs'
import path from 'path'

async function runMigrations() {
  console.log('Ejecutando migraciones...')

  const migrationsDir = path.resolve(__dirname, './migrations')

  console.log('Directorio migrations:', migrationsDir)

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`No existe directorio: ${migrationsDir}`)
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  console.log('Archivos encontrados:', files)

  for (const file of files) {
    console.log(`Ejecutando: ${file}`)

    const filePath = path.join(migrationsDir, file)

    const sql = fs.readFileSync(filePath, 'utf8')

    console.log(`Tamaño SQL: ${sql.length} caracteres`)

    try {
      await pool.query(sql)
      console.log(`Completado: ${file}`)
    } catch (error: any) {
      console.error(`Error en ${file}:`, error.message)
      throw error
    }
  }

  console.log('Migraciones completadas')

  await pool.end()
  process.exit(0)
}

runMigrations()