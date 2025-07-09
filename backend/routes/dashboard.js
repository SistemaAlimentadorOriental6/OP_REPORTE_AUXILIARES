const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

// GET /api/dashboard/stats - Estadísticas generales del dashboard
router.get('/stats', async (req, res, next) => {
  try {
    const { periodo = '7d' } = req.query;
    
    let fechaInicio;
    const fechaFin = new Date().toISOString().split('T')[0];
    
    switch (periodo) {
      case '1d':
        fechaInicio = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '7d':
        fechaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30d':
        fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        fechaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // Estadísticas principales
    const [statsGeneral] = await executeQuery(`
      SELECT 
        COUNT(*) as total_registros,
        SUM(CASE WHEN entradasalida = 'entrada' THEN 1 ELSE 0 END) as total_entradas,
        SUM(CASE WHEN entradasalida = 'salida' THEN 1 ELSE 0 END) as total_salidas,
        COUNT(DISTINCT cedula) as auxiliares_activos,
        COUNT(DISTINCT lugar) as lugares_visitados
      FROM registros 
      WHERE DATE(tiempo) BETWEEN ? AND ?
    `, [fechaInicio, fechaFin]);

    // Total de auxiliares registrados
    const [auxStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_auxiliares,
        SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as auxiliares_activos,
        SUM(CASE WHEN activo = FALSE THEN 1 ELSE 0 END) as auxiliares_inactivos
      FROM auxiliares
    `);

    // Estadísticas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const [statsHoy] = await executeQuery(`
      SELECT 
        COUNT(*) as registros_hoy,
        SUM(CASE WHEN entradasalida = 'entrada' THEN 1 ELSE 0 END) as entradas_hoy,
        SUM(CASE WHEN entradasalida = 'salida' THEN 1 ELSE 0 END) as salidas_hoy,
        COUNT(DISTINCT cedula) as auxiliares_hoy
      FROM registros 
      WHERE DATE(tiempo) = ?
    `, [hoy]);

    // Actividad por días
    const actividadDiaria = await executeQuery(`
      SELECT 
        DATE(tiempo) as fecha,
        COUNT(*) as total_registros,
        SUM(CASE WHEN entradasalida = 'entrada' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN entradasalida = 'salida' THEN 1 ELSE 0 END) as salidas,
        COUNT(DISTINCT cedula) as auxiliares_activos
      FROM registros 
      WHERE DATE(tiempo) BETWEEN ? AND ?
      GROUP BY DATE(tiempo)
      ORDER BY fecha DESC
    `, [fechaInicio, fechaFin]);

    res.json({
      success: true,
      data: {
        periodo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        resumen: {
          ...statsGeneral,
          ...auxStats,
          ...statsHoy
        },
        actividad_diaria: actividadDiaria
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/actividad-tiempo-real - Actividad en tiempo real
router.get('/actividad-tiempo-real', async (req, res, next) => {
  try {
    const horaActual = new Date();
    const hace30Min = new Date(horaActual.getTime() - 30 * 60 * 1000);

    // Últimos registros (30 minutos) con información detallada
    const registrosRecientes = await executeQuery(`
      SELECT 
        r.cedula, 
        r.nombre, 
        r.entradasalida, 
        r.lugar, 
        r.latitud, 
        r.longitud, 
        r.tiempo,
        r.dispositivo,
        r.tipo_red,
        r.metodo_ubicacion,
        TIMESTAMPDIFF(MINUTE, r.tiempo, NOW()) as minutos_transcurridos
      FROM registros r
      WHERE r.tiempo >= ?
      ORDER BY r.tiempo DESC
      LIMIT 20
    `, [hace30Min.toISOString()]);

    // Auxiliares actualmente en sus ubicaciones (última entrada sin salida)
    const auxiliaresPresentes = await executeQuery(`
      SELECT DISTINCT 
        r1.cedula, 
        r1.nombre, 
        r1.lugar, 
        r1.tiempo as entrada,
        r1.latitud, 
        r1.longitud,
        TIMESTAMPDIFF(MINUTE, r1.tiempo, NOW()) as minutos_en_ubicacion,
        r1.dispositivo,
        r1.tipo_red
      FROM registros r1
      LEFT JOIN registros r2 ON 
        r2.cedula = r1.cedula 
        AND r2.entradasalida = 'salida' 
        AND r2.tiempo > r1.tiempo
      WHERE 
        r1.entradasalida = 'entrada'
        AND r2.cedula IS NULL
        AND DATE(r1.tiempo) = CURDATE()
      ORDER BY r1.tiempo DESC
    `);

    // Estadísticas de la última hora con métricas adicionales
    const hace1Hora = new Date(horaActual.getTime() - 60 * 60 * 1000);
    const [statsUltimaHora] = await executeQuery(`
      SELECT 
        COUNT(*) as registros_ultima_hora,
        SUM(CASE WHEN entradasalida = 'entrada' THEN 1 ELSE 0 END) as entradas_ultima_hora,
        SUM(CASE WHEN entradasalida = 'salida' THEN 1 ELSE 0 END) as salidas_ultima_hora,
        COUNT(DISTINCT cedula) as auxiliares_activos_ultima_hora,
        COUNT(DISTINCT lugar) as lugares_visitados_ultima_hora,
        AVG(CASE 
          WHEN entradasalida = 'entrada' 
          THEN (
            SELECT TIMESTAMPDIFF(MINUTE, r1.tiempo, MIN(r2.tiempo))
            FROM registros r2 
            WHERE r2.cedula = r.cedula 
            AND r2.entradasalida = 'salida'
            AND r2.tiempo > r.tiempo
          )
        END) as promedio_tiempo_estadia
      FROM registros r
      WHERE tiempo >= ?
    `, [hace1Hora.toISOString()]);

    // Lugares más activos en la última hora
    const lugaresActivos = await executeQuery(`
      SELECT 
        lugar,
        COUNT(*) as total_registros,
        COUNT(DISTINCT cedula) as total_auxiliares,
        MAX(tiempo) as ultimo_registro
      FROM registros
      WHERE tiempo >= ?
      GROUP BY lugar
      ORDER BY total_registros DESC
      LIMIT 5
    `, [hace1Hora.toISOString()]);

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        registros_recientes: registrosRecientes.map(registro => ({
          ...registro,
          tiempo_relativo: `hace ${registro.minutos_transcurridos} minutos`
        })),
        auxiliares_presentes: auxiliaresPresentes.map(auxiliar => ({
          ...auxiliar,
          tiempo_en_ubicacion: `${auxiliar.minutos_en_ubicacion} minutos`
        })),
        stats_ultima_hora: {
          ...statsUltimaHora,
          promedio_tiempo_estadia: Math.round(statsUltimaHora.promedio_tiempo_estadia || 0)
        },
        lugares_activos: lugaresActivos
      }
    });
  } catch (error) {
    logger.error('Error al obtener actividad en tiempo real:', error);
    next(error);
  }
});

// GET /api/dashboard/mapa-calor - Datos para mapa de calor
router.get('/mapa-calor', async (req, res, next) => {
  try {
    const { 
      fechaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fechaFin = new Date().toISOString().split('T')[0] 
    } = req.query;

    // Datos para mapa de calor - ubicaciones más visitadas
    const ubicacionesCalor = await executeQuery(`
      SELECT 
        lugar,
        latitud,
        longitud,
        COUNT(*) as intensidad,
        COUNT(DISTINCT cedula) as auxiliares_unicos,
        SUM(CASE WHEN entradasalida = 'entrada' THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN entradasalida = 'salida' THEN 1 ELSE 0 END) as salidas
      FROM registros 
      WHERE DATE(tiempo) BETWEEN ? AND ?
      GROUP BY lugar, latitud, longitud
      HAVING intensidad > 1
      ORDER BY intensidad DESC
    `, [fechaInicio, fechaFin]);

    // Rutas más comunes (secuencia de ubicaciones por auxiliar)
    const rutasComunes = await executeQuery(`
      SELECT 
        cedula,
        nombre,
        GROUP_CONCAT(
          CONCAT(lugar, ' (', TIME(tiempo), ')')
          ORDER BY tiempo 
          SEPARATOR ' → '
        ) as ruta_diaria,
        COUNT(*) as paradas,
        DATE(tiempo) as fecha
      FROM registros 
      WHERE DATE(tiempo) BETWEEN ? AND ?
      GROUP BY cedula, nombre, DATE(tiempo)
      HAVING paradas >= 2
      ORDER BY fecha DESC, paradas DESC
      LIMIT 10
    `, [fechaInicio, fechaFin]);

    res.json({
      success: true,
      data: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        ubicaciones_calor: ubicacionesCalor,
        rutas_comunes: rutasComunes
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/alertas - Sistema de alertas básico
router.get('/alertas', async (req, res, next) => {
  try {
    const alertas = [];
    const hoy = new Date().toISOString().split('T')[0];

    // Alerta: Auxiliares sin registros hoy
    const auxiliaresSinRegistros = await executeQuery(`
      SELECT a.cedula, a.nombre
      FROM auxiliares a
      WHERE a.activo = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM registros r 
        WHERE r.cedula = a.cedula 
        AND DATE(r.tiempo) = ?
      )
    `, [hoy]);

    if (auxiliaresSinRegistros.length > 0) {
      alertas.push({
        tipo: 'sin_actividad',
        nivel: 'warning',
        titulo: 'Auxiliares sin actividad hoy',
        mensaje: `${auxiliaresSinRegistros.length} auxiliares no han registrado actividad hoy`,
        datos: auxiliaresSinRegistros,
        timestamp: new Date().toISOString()
      });
    }

    // Alerta: Registros fuera del horario laboral
    const registrosFueraHorario = await executeQuery(`
      SELECT cedula, nombre, lugar, tiempo
      FROM registros 
      WHERE DATE(tiempo) = ?
      AND (HOUR(tiempo) < 6 OR HOUR(tiempo) > 18)
      ORDER BY tiempo DESC
      LIMIT 10
    `, [hoy]);

    if (registrosFueraHorario.length > 0) {
      alertas.push({
        tipo: 'fuera_horario',
        nivel: 'info',
        titulo: 'Registros fuera del horario laboral',
        mensaje: `${registrosFueraHorario.length} registros fuera del horario estándar (6AM-6PM)`,
        datos: registrosFueraHorario,
        timestamp: new Date().toISOString()
      });
    }

    // Alerta: Ubicaciones inusuales (muy pocas visitas históricamente)
    const ubicacionesInusuales = await executeQuery(`
      SELECT lugar, COUNT(*) as visitas_historicas
      FROM registros 
      WHERE DATE(tiempo) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY lugar
      HAVING visitas_historicas = 1
      ORDER BY lugar
    `);

    if (ubicacionesInusuales.length > 0) {
      alertas.push({
        tipo: 'ubicacion_inusual',
        nivel: 'info',
        titulo: 'Ubicaciones poco frecuentes',
        mensaje: `${ubicacionesInusuales.length} ubicaciones visitadas solo una vez en los últimos 30 días`,
        datos: ubicacionesInusuales,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        total_alertas: alertas.length,
        alertas: alertas
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/exportar - Exportar datos (CSV básico)
router.get('/exportar', async (req, res, next) => {
  try {
    const { 
      tipo = 'registros',
      fechaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fechaFin = new Date().toISOString().split('T')[0],
      formato = 'json'
    } = req.query;

    let datos = [];
    let nombreArchivo = '';

    if (tipo === 'registros') {
      datos = await executeQuery(`
        SELECT cedula, nombre, entradasalida, lugar, latitud, longitud, 
               ip, tiempo, created_at
        FROM registros 
        WHERE DATE(tiempo) BETWEEN ? AND ?
        ORDER BY tiempo DESC
      `, [fechaInicio, fechaFin]);
      nombreArchivo = `registros_${fechaInicio}_${fechaFin}`;
    } else if (tipo === 'auxiliares') {
      datos = await executeQuery(`
        SELECT cedula, nombre, email, telefono, cargo, activo, created_at
        FROM auxiliares
        ORDER BY nombre
      `);
      nombreArchivo = `auxiliares_${new Date().toISOString().split('T')[0]}`;
    }

    if (formato === 'csv') {
      // Convertir a CSV básico
      if (datos.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No hay datos para exportar'
        });
      }

      const headers = Object.keys(datos[0]);
      let csv = headers.join(',') + '\n';
      
      datos.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Escapar comillas y envolver en comillas si contiene comas
          if (value && value.toString().includes(',')) {
            return `"${value.toString().replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        csv += values.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.csv"`);
      res.send(csv);
    } else {
      // Formato JSON por defecto
      res.json({
        success: true,
        data: {
          tipo,
          periodo: { fechaInicio, fechaFin },
          total_registros: datos.length,
          datos: datos
        }
      });
    }

    logger.info(`Datos exportados: ${tipo} - ${datos.length} registros`, {
      periodo: { fechaInicio, fechaFin },
      formato,
      ip: req.ip
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 