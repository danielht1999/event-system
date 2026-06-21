// src/shared/infrastructure/config/env.validator.ts
// 1. Lista de variables OBLIGATORIAS
const REQUIRED_ENV_VARS = [
  // DATABASE
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',

  // AUTH
  'JWT_SECRET',

  // SMTP / EMAIL
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_FROM_NAME',
  'SMTP_FROM_EMAIL',

  // PLATFORM URLS
  'PLATFORM_TERMS_URL',
  'PLATFORM_PRIVACY_URL'
];

// 2. Filtrar las variables que FALTAN
//process.env = las variables de entorno de Node.js
export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  // Condicional inteligente: Exigir credenciales SMTP solo si NO estamos en desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development' || process.argv.includes('--isLoadTest');
  if (!isDevelopment) {
    if (!process.env.SMTP_USER) missing.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}\n` +
      `El servidor no puede arrancar sin estas variables.`
    );
  }
  
  console.log('Variables de entorno validadas correctamente');
};