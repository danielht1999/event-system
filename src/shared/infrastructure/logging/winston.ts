import fs from 'fs';
import winston from 'winston';

// Usamos una variable de entorno para poder cambiar la ruta
const LOG_DIR = process.env.LOG_DIR || 'logs';

// Si la carpeta no existe, la creamos automáticamente.
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Detectamos si estamos en producción.
const isProduction = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({

  // Nivel mínimo que Winston escuchará.
  // En desarrollo queremos ver más información (debug).
  // En producción normalmente solo warnings y errores.
  level: isProduction ? 'warn' : 'debug',

  // Los formatos se ejecutan en cadena.
  // Primero agrega timestamp,
  // luego incluye stacks de errores,
  // y finalmente convierte todo a JSON estructurado.
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    // Convierte los logs en JSON estructurado.
    winston.format.json()
  ),
  transports: [
    // Este envía logs a la terminal.
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
    }),
    // Solo guardará logs nivel "error".
    // Winston usa jerarquía de niveles (error < warn < info < debug)
    // Si ponemos: level: 'error' entonces SOLO se guardan errores.
    // Si fuera: level: 'info' también guardaría warn y error.
    new winston.transports.File({
      filename: `${LOG_DIR}/error.log`,
      level: 'error'
    })
  ],
  // Captura errores que podrían crashear la aplicación.
  // Ejemplo: throw new Error('fatal');
  // Sin esto: el proceso muere sin información útil.
  // Con esto: el error queda registrado en un archivo.
  exceptionHandlers: [
    new winston.transports.File({
      filename: `${LOG_DIR}/exceptions.log`
    })
  ]
});
// Exportamos una única instancia compartida.
// Así todo el proyecto usa el mismo logger configurado.
export { logger };