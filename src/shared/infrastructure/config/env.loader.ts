// src/shared/infrastructure/config/env.loader.ts
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Definir los entornos posibles como un objeto constante
const ENV_MAP = {
  development: '.env',
  test: '.env.test',
  cloudflare: '.env.cloudflare',
  production: '.env.production'
} as const;

// Tipo para los nombres de entorno válidos
type ValidEnv = keyof typeof ENV_MAP;

const getEnvFile = (): string => {
  const env = (process.env.NODE_ENV || 'development') as ValidEnv;
  
  // 1. Intentar cargar el archivo específico del entorno
  const specificFile = ENV_MAP[env];
  const specificPath = path.resolve(process.cwd(), specificFile);
  
  if (fs.existsSync(specificPath)) {
    return specificFile;
  }
  
  // 2. Si no existe y es development, intentar con .env.dev (fallback)
  if (env === 'development') {
    const devPath = path.resolve(process.cwd(), '.env.dev');
    if (fs.existsSync(devPath)) {
      console.warn(`⚠️  No se encontró .env, usando .env.dev como fallback`);
      return '.env.dev';
    }
  }
  
  // 3. Si nada existe, usar .env por defecto
  console.warn(`⚠️  No se encontró ningún archivo .env, usando .env por defecto`);
  return '.env';
};

const envFile = getEnvFile();
const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

if (result.error) {
  console.warn(`⚠️  No se pudo cargar ${envFile}, usando variables de sistema`);
} else {
  console.log(`✅ Cargado archivo de entorno: ${envFile}`);
}

export const loadedEnvFile = envFile;
export const currentEnv = process.env.NODE_ENV || 'development';