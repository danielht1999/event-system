//conexion a redis en docker
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Configuración básica
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
};

// Crear cliente
const client = createClient(redisConfig);

// Manejar eventos
client.on('error', (err) => console.error('Redis Error:', err));
client.on('connect', () => console.log('Redis conectado'));
client.on('ready', () => console.log('Redis listo'));

// Conectar (una sola vez, para toda la app)
export const connectRedis = async () => {
  await client.connect();
};

// Exportar para usar en toda la app
export default client;
