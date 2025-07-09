const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');
const { validate, validateGPSCoordinates, validateHistorialRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

// GET /api/registros - Obtener todos los registros (del Flask original)
router.get('/', async (req, res, next) => {
  try {
    const { 
      fecha, 
      cedula, 
      tipo, 
      lugar,
      fechaInicio,
      fechaFin,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = `
      SELECT r.id, r.cedula, r.nombre, r.entradasalida, r.lugar, 
             r.latitud, r.longitud, r.tiempo, r.created_at
      FROM registros r
      WHERE 1=1
    `;
    const params = [];

    // Filtro por fecha específica (del Flask original: obtener-datos)
    if (fecha) {
      query += ' AND DATE(r.tiempo) = ?';
      params.push(fecha);
    }

    // Filtro por rango de fechas
    if (fechaInicio && fechaFin) {
      query += ' AND DATE(r.tiempo) BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      query += ' AND DATE(r.tiempo) >= ?';
      params.push(fechaInicio);
    } else if (fechaFin) {
      query += ' AND DATE(r.tiempo) <= ?';
      params.push(fechaFin);
    }

    // Filtro por cédula
    if (cedula) {
      query += ' AND r.cedula = ?';
      params.push(cedula);
    }

    // Filtro por tipo (entrada/salida)
    if (tipo && ['entrada', 'salida'].includes(tipo)) {
      query += ' AND r.entradasalida = ?';
      params.push(tipo);
    }

    // Filtro por lugar
    if (lugar) {
      query += ' AND r.lugar LIKE ?';
      params.push(`%${lugar}%`);
    }

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY r.tiempo DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const registros = await executeQuery(query, params);

    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM registros r WHERE 1=1';
    const countParams = [];
    
    // Aplicar los mismos filtros para el conteo
    if (fecha) {
      countQuery += ' AND DATE(r.tiempo) = ?';
      countParams.push(fecha);
    }
    if (fechaInicio && fechaFin) {
      countQuery += ' AND DATE(r.tiempo) BETWEEN ? AND ?';
      countParams.push(fechaInicio, fechaFin);
    } else if (fechaInicio) {
      countQuery += ' AND DATE(r.tiempo) >= ?';
      countParams.push(fechaInicio);
    } else if (fechaFin) {
      countQuery += ' AND DATE(r.tiempo) <= ?';
      countParams.push(fechaFin);
    }
    if (cedula) {
      countQuery += ' AND r.cedula = ?';
      countParams.push(cedula);
    }
    if (tipo && ['entrada', 'salida'].includes(tipo)) {
      countQuery += ' AND r.entradasalida = ?';
      countParams.push(tipo);
    }
    if (lugar) {
      countQuery += ' AND r.lugar LIKE ?';
      countParams.push(`%${lugar}%`);
    }

    const [{ total }] = await executeQuery(countQuery, countParams);

    logger.info(`Registros consultados: ${registros.length} de ${total}`, {
      filtros: { fecha, cedula, tipo, lugar, fechaInicio, fechaFin }
    });

    res.json({
      success: true,
      data: registros,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/registros - Guardar nuevo registro GPS
router.post('/', 
  validate('registroGPS'), 
  validateGPSCoordinates,
  async (req, res, next) => {
    try {
      const { 
        cedula, 
        entradasalida, 
        lugar, 
        latitud, 
        longitud,
        dispositivo = 'Desconocido',
        tipo_red = 'Desconocido',
        metodo_ubicacion = 'GPS',
        zona_horaria = 'America/Bogota'
      } = req.body;
      
      logger.info(`Datos recibidos para registro GPS: ${cedula} - ${entradasalida} - ${lugar}`, {
        latitud, longitud, dispositivo, tipo_red, metodo_ubicacion
      });

      // Verificar que el auxiliar existe
      const auxiliares = await executeQuery(
        'SELECT nombre FROM auxiliares WHERE cedula = ?',
        [cedula]
      );

      if (auxiliares.length === 0) {
        logger.warn(`Intento de registro con cédula no encontrada: ${cedula}`);
        return res.status(404).json({
          success: false,
          error: 'Cédula no encontrada en la base de datos o auxiliar inactivo'
        });
      }

      const { nombre } = auxiliares[0];

      // Insertar el registro
      const result = await executeQuery(`
        INSERT INTO registros 
          (cedula, nombre, entradasalida, lugar, latitud, longitud, 
           dispositivo, tipo_red, metodo_ubicacion, zona_horaria) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [cedula, nombre, entradasalida, lugar, latitud, longitud,
          dispositivo, tipo_red, metodo_ubicacion, zona_horaria]);

      logger.info(`Registro GPS guardado: ${cedula} - ${entradasalida} - ${lugar}`, {
        latitud, longitud, dispositivo, tipo_red
      });

      res.status(201).json({
        success: true,
        message: 'Registro guardado exitosamente',
        data: {
          id: result.insertId,
          cedula,
          nombre,
          entradasalida,
          lugar,
          latitud,
          longitud,
          dispositivo,
          tipo_red,
          metodo_ubicacion,
          zona_horaria,
          tiempo: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/registros/estadisticas - Obtener estadísticas de registros
router.get('/estadisticas', async (req, res, next) => {
  try {
    const { fecha = new Date().toISOString().split('T')[0] } = req.query;

    // Estadísticas por fecha
    const estadisticas = await executeQuery(`
      SELECT 
        DATE(tiempo) as fecha,
        COUNT(*) as total_registros,
        SUM(CASE WHEN entradasalida = 'entrada' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN entradasalida = 'salida' THEN 1 ELSE 0 END) as salidas,
        COUNT(DISTINCT cedula) as auxiliares_activos
      FROM registros 
      WHERE DATE(tiempo) = ?
      GROUP BY DATE(tiempo)
    `, [fecha]);

    // Registros por hora del día
    const registrosPorHora = await executeQuery(`
      SELECT 
        HOUR(tiempo) as hora,
        COUNT(*) as cantidad,
        SUM(CASE WHEN entradasalida = 'entrada' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN entradasalida = 'salida' THEN 1 ELSE 0 END) as salidas
      FROM registros 
      WHERE DATE(tiempo) = ?
      GROUP BY HOUR(tiempo)
      ORDER BY hora
    `, [fecha]);

    // Top 5 lugares más visitados
    const lugaresMasVisitados = await executeQuery(`
      SELECT 
        lugar,
        COUNT(*) as visitas,
        COUNT(DISTINCT cedula) as auxiliares_unicos
      FROM registros 
      WHERE DATE(tiempo) = ?
      GROUP BY lugar
      ORDER BY visitas DESC
      LIMIT 5
    `, [fecha]);

    res.json({
      success: true,
      data: {
        fecha,
        resumen: estadisticas[0] || {
          fecha,
          total_registros: 0,
          entradas: 0,
          salidas: 0,
          auxiliares_activos: 0
        },
        registros_por_hora: registrosPorHora,
        lugares_mas_visitados: lugaresMasVisitados
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/registros/mapa - Obtener registros agrupados por ubicación
router.get('/mapa', async (req, res, next) => {
  try {
    const { fecha = new Date().toISOString().split('T')[0] } = req.query;
    
    logger.info(`Obteniendo registros del mapa para fecha: ${fecha}`);

    const registros = await executeQuery(`
      SELECT 
        r.lugar,
        r.latitud,
        r.longitud,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'cedula', r.cedula,
            'nombre', r.nombre,
            'entradasalida', r.entradasalida,
            'tiempo', r.tiempo,
            'dispositivo', r.dispositivo,
            'tipo_red', r.tipo_red,
            'metodo_ubicacion', r.metodo_ubicacion,
            'zona_horaria', r.zona_horaria
          )
        ) as registros
      FROM registros r
      WHERE DATE(r.tiempo) = ?
      GROUP BY r.lugar, r.latitud, r.longitud
    `, [fecha]);

    if (registros.length === 0) {
      logger.warn(`No se encontraron registros para la fecha: ${fecha}`);
      return res.status(404).json({
        success: false,
        error: 'No hay registros para la fecha especificada'
      });
    }

    // Procesar los registros para convertir el string JSON_ARRAYAGG en array
    const ubicaciones = registros.map(ubicacion => ({
      ...ubicacion,
      registros: JSON.parse(ubicacion.registros)
    }));

    logger.info(`Enviando ${ubicaciones.length} ubicaciones con registros`);

    res.json({
      success: true,
      data: {
        ubicaciones
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/registros/historial/:cedula - Obtener historial de ubicaciones de un empleado
router.get('/historial/:cedula', validateHistorialRequest, async (req, res, next) => {
  try {
    const { cedula } = req.params;
    const { days = 7 } = req.query;

    logger.info(`Obteniendo historial para cédula ${cedula} de los últimos ${days} días`);

    // Verificar que el auxiliar existe
    const auxiliar = await executeQuery(
      'SELECT cedula FROM auxiliares WHERE cedula = ?',
      [cedula]
    );

    if (auxiliar.length === 0) {
      logger.warn(`Intento de consulta de historial con cédula no encontrada: ${cedula}`);
      return res.status(404).json({
        success: false,
        error: 'Auxiliar no encontrado'
      });
    }

    // Obtener registros de los últimos X días
    const registros = await executeQuery(`
      SELECT 
        DATE(tiempo) as fecha,
        COUNT(CASE WHEN entradasalida = 'entrada' THEN 1 END) as entradas,
        COUNT(CASE WHEN entradasalida = 'salida' THEN 1 END) as salidas,
        SEC_TO_TIME(
          TIMESTAMPDIFF(
            SECOND,
            MIN(CASE WHEN entradasalida = 'entrada' THEN tiempo END),
            MAX(CASE WHEN entradasalida = 'salida' THEN tiempo END)
          )
        ) as horas_trabajadas,
        GROUP_CONCAT(DISTINCT lugar ORDER BY tiempo) as lugares,
        MIN(tiempo) as primer_registro,
        MAX(tiempo) as ultimo_registro
      FROM registros 
      WHERE 
        cedula = ? 
        AND tiempo >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(tiempo)
      ORDER BY fecha DESC
    `, [cedula, parseInt(days)]);

    logger.info(`Se encontraron ${registros.length} días con registros`);

    // Procesar los registros para determinar el estado de cada día
    const historial = registros.map(registro => {
      let status = 'incomplete';
      let horasNum = 0;

      if (registro.horas_trabajadas) {
        const [hours, minutes, seconds] = registro.horas_trabajadas.split(':');
        horasNum = parseFloat(hours) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600;
      }

      // Determinar el estado del día
      if (registro.entradas === registro.salidas && registro.entradas > 0) {
        status = horasNum >= 8 ? 'complete' : 'partial';
      }

      return {
        fecha: registro.fecha,
        entradas: registro.entradas || 0,
        salidas: registro.salidas || 0,
        horas: horasNum.toFixed(1) + 'h',
        lugares: (registro.lugares || '').split(',').filter(Boolean),
        status,
        primer_registro: registro.primer_registro,
        ultimo_registro: registro.ultimo_registro
      };
    });

    res.json({
      success: true,
      data: historial
    });

  } catch (error) {
    logger.error('Error al obtener historial:', error);
    next(error);
  }
});

// GET /api/registros/:id - Obtener registro específico
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const registros = await executeQuery(
      'SELECT * FROM registros WHERE id = ?',
      [id]
    );

    if (registros.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado'
      });
    }

    res.json({
      success: true,
      data: registros[0]
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/registros/:id - Eliminar registro (solo admin)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await executeQuery(
      'DELETE FROM registros WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado'
      });
    }

    logger.warn(`Registro eliminado: ID ${id}`, { ip: req.ip });

    res.json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 