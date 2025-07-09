const winston = require('winston');
const path = require('path');

// Configuración de colores personalizados
const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'cyan'
};

winston.addColors(customColors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      logMessage += `\n${stack}`;
    }
    return logMessage;
  })
);

// Configuración de transports
const transports = [
  // Console transport con colores
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      logFormat
    )
  }),

  // File transport para todos los logs
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/app.log'),
    level: 'info',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // File transport solo para errores
  new winston.transports.File({
    filename: path.join(__dirname, '../logs/error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Crear directorio de logs si no existe
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // Prevenir que el proceso termine por errores no capturados
  exitOnError: false
});

// Función para log de requests HTTP
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
};

// Función para log de errores de base de datos
logger.logDBError = (error, query, params = []) => {
  logger.error('Database Error:', {
    error: error.message,
    query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
    params: params.length > 0 ? params : 'none',
    stack: error.stack
  });
};

// Función para log de autenticación
logger.logAuth = (action, cedula, ip, success = true) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Auth ${action}: ${cedula} from ${ip} - ${success ? 'SUCCESS' : 'FAILED'}`);
};

// Función para log de GPS
logger.logGPS = (cedula, action, location, ip) => {
  logger.info(`GPS ${action}: ${cedula} at ${location.lugar} (${location.latitud}, ${location.longitud}) from ${ip}`);
};

module.exports = logger; 