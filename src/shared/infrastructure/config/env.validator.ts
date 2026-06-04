// src/shared/infrastructure/config/env.validator.ts

// 1. Lista de variables OBLIGATORIAS
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PORT', 
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET'
];

// 2. Filtrar las variables que FALTAN
//process.env = las variables de entorno de Node.js
export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}\n` +
      `El servidor no puede arrancar sin estas variables.`
    );
  }
  
  console.log('Variables de entorno validadas correctamente');
};