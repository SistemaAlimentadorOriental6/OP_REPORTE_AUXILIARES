const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || '192.168.90.32',
  user: process.env.DB_USER || 'desarrollo',
  password: process.env.DB_PASSWORD || 'test_24*',
  database: process.env.DB_NAME || 'bdsaocomco_auxiliares',
  port: parseInt(process.env.DB_PORT) || 3306,
  // Pool de conexiones para mejor rendimiento
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  // Configuraciones adicionales para producción
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  charset: 'utf8mb4',
  timezone: 'local'
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para obtener conexión del pool
const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.debug('✅ Nueva conexión obtenida del pool');
    return connection;
  } catch (error) {
    logger.error('❌ Error obteniendo conexión:', error);
    throw new Error(`Error de conexión a base de datos: ${error.message}`);
  }
};

// Función para ejecutar queries con manejo de errores
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(query, params);
    logger.debug(`✅ Query ejecutado: ${query.substring(0, 50)}...`);
    return results;
  } catch (error) {
    logger.error('❌ Error ejecutando query:', {
      query: query.substring(0, 100),
      params,
      error: error.message
    });
    throw error;
  } finally {
    if (connection) {
      connection.release();
      logger.debug('🔄 Conexión liberada al pool');
    }
  }
};

// Función para transacciones
const executeTransaction = async (callback) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    
    const result = await callback(connection);
    
    await connection.commit();
    logger.info('✅ Transacción completada exitosamente');
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback();
      logger.warn('🔄 Transacción revertida debido a error');
    }
    logger.error('❌ Error en transacción:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await getConnection();
    await connection.ping();
    connection.release();
    logger.info('🟢 Conexión a base de datos verificada');
    return true;
  } catch (error) {
    logger.error('🔴 Error al probar conexión:', error);
    throw error;
  }
};

// Función para cerrar el pool
const closePool = async () => {
  try {
    await pool.end();
    logger.info('🔄 Pool de conexiones cerrado');
  } catch (error) {
    logger.error('❌ Error cerrando pool:', error);
    throw error;
  }
};

// Inicialización de tablas si no existen
const initializeTables = async () => {
  try {
    // Tabla auxiliares (debe crearse primero por la llave foránea)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS auxiliares (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        cedula VARCHAR(20) NOT NULL UNIQUE,
        nombre VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cedula (cedula)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla registros
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS registros (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        cedula VARCHAR(20) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        entradasalida ENUM('entrada','salida') NOT NULL,
        lugar VARCHAR(255) NOT NULL,
        latitud DECIMAL(10,8) NOT NULL,
        longitud DECIMAL(11,8) NOT NULL,
        tiempo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        dispositivo VARCHAR(255),
        tipo_red VARCHAR(50),
        metodo_ubicacion VARCHAR(50),
        zona_horaria VARCHAR(50),
        INDEX idx_cedula (cedula),
        INDEX idx_tiempo (tiempo),
        FOREIGN KEY (cedula) REFERENCES auxiliares(cedula)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla sesiones
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS sesiones (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        cedula VARCHAR(20) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expira_at TIMESTAMP NOT NULL,
        ip VARCHAR(45),
        user_agent TEXT,
        activa TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_cedula (cedula),
        INDEX idx_expira (expira_at),
        FOREIGN KEY (cedula) REFERENCES auxiliares(cedula) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    logger.info('✅ Tablas inicializadas correctamente');
  } catch (error) {
    logger.error('❌ Error inicializando tablas:', error);
    throw error;
  }
};

module.exports = {
  pool,
  getConnection,
  executeQuery,
  executeTransaction,
  testConnection,
  closePool,
  initializeTables
}; 