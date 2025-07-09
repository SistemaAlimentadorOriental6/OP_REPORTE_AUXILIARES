const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');
const { validate, validateGPSCoordinates } = require('../middleware/validation');
const logger = require('../utils/logger');

// GET /api/auxiliares - Obtener todos los auxiliares
router.get('/', async (req, res, next) => {
  try {
    const { activo = 'true', search = '', page = 1, limit = 50 } = req.query;
    
    let query = 'SELECT id, cedula, nombre, email, telefono, cargo, activo, created_at FROM auxiliares WHERE 1=1';
    const params = [];

    // Filtrar por estado activo
    if (activo !== 'all') {
      query += ' AND activo = ?';
      params.push(activo === 'true');
    }

    // Búsqueda por texto
    if (search) {
      query += ' AND (cedula LIKE ? OR nombre LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const auxiliares = await executeQuery(query, params);

    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM auxiliares WHERE 1=1';
    const countParams = [];
    
    if (activo !== 'all') {
      countQuery += ' AND activo = ?';
      countParams.push(activo === 'true');
    }
    
    if (search) {
      countQuery += ' AND (cedula LIKE ? OR nombre LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [{ total }] = await executeQuery(countQuery, countParams);

    logger.info(`Auxiliares consultados: ${auxiliares.length} de ${total}`, {
      search, page, limit, activo
    });

    res.json({
      success: true,
      data: auxiliares,
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

// POST /api/auxiliares/verificar-cedula - Verificar si una cédula existe (del Flask original)
router.post('/verificar-cedula', validate('cedula'), async (req, res, next) => {
  try {
    const { cedula } = req.body;

    const auxiliares = await executeQuery(
      'SELECT cedula, nombre FROM auxiliares WHERE cedula = ? AND activo = TRUE',
      [cedula]
    );

    if (auxiliares.length > 0) {
      const auxiliar = auxiliares[0];
      logger.logAuth('verify-cedula', cedula, req.ip, true);
      
      res.json({
        success: true,
        cedula: auxiliar.cedula,
        nombre: auxiliar.nombre,
        message: 'Cédula verificada exitosamente'
      });
    } else {
      logger.logAuth('verify-cedula', cedula, req.ip, false);
      
      res.status(404).json({
        success: false,
        message: 'Cédula no encontrada o auxiliar inactivo'
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/auxiliares - Crear nuevo auxiliar (del Flask original: guardar-nuevo-registro)
router.post('/', validate('nuevoAuxiliar'), async (req, res, next) => {
  try {
    const { cedula, nombre, email, telefono, cargo } = req.body;

    const result = await executeQuery(
      'INSERT INTO auxiliares (cedula, nombre, email, telefono, cargo) VALUES (?, ?, ?, ?, ?)',
      [cedula, nombre, email || null, telefono || null, cargo || null]
    );

    logger.info(`Nuevo auxiliar creado: ${cedula} - ${nombre}`, {
      ip: req.ip,
      id: result.insertId
    });

    res.status(201).json({
      success: true,
      message: 'Auxiliar registrado exitosamente',
      data: {
        id: result.insertId,
        cedula,
        nombre,
        email,
        telefono,
        cargo
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      logger.warn(`Intento de registro duplicado: ${req.body.cedula}`, { ip: req.ip });
      return res.status(400).json({
        success: false,
        error: 'Ya existe un auxiliar con esta cédula'
      });
    }
    next(error);
  }
});

// GET /api/auxiliares/:cedula - Obtener auxiliar específico
router.get('/:cedula', async (req, res, next) => {
  try {
    const { cedula } = req.params;

    const auxiliares = await executeQuery(
      'SELECT * FROM auxiliares WHERE cedula = ?',
      [cedula]
    );

    if (auxiliares.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auxiliar no encontrado'
      });
    }

    res.json({
      success: true,
      data: auxiliares[0]
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auxiliares/:cedula - Actualizar auxiliar
router.put('/:cedula', validate('nuevoAuxiliar'), async (req, res, next) => {
  try {
    const { cedula } = req.params;
    const { nombre, email, telefono, cargo, activo } = req.body;

    const result = await executeQuery(
      `UPDATE auxiliares 
       SET nombre = ?, email = ?, telefono = ?, cargo = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
       WHERE cedula = ?`,
      [nombre, email || null, telefono || null, cargo || null, activo !== undefined ? activo : true, cedula]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auxiliar no encontrado'
      });
    }

    logger.info(`Auxiliar actualizado: ${cedula}`, { ip: req.ip });

    res.json({
      success: true,
      message: 'Auxiliar actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auxiliares/:cedula - Desactivar auxiliar (soft delete)
router.delete('/:cedula', async (req, res, next) => {
  try {
    const { cedula } = req.params;

    const result = await executeQuery(
      'UPDATE auxiliares SET activo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE cedula = ?',
      [cedula]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Auxiliar no encontrado'
      });
    }

    logger.warn(`Auxiliar desactivado: ${cedula}`, { ip: req.ip });

    res.json({
      success: true,
      message: 'Auxiliar desactivado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auxiliares/:cedula/registros - Obtener registros de un auxiliar específico
router.get('/:cedula/registros', async (req, res, next) => {
  try {
    const { cedula } = req.params;
    const { 
      fechaInicio, 
      fechaFin, 
      tipo, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = `
      SELECT id, cedula, nombre, entradasalida, lugar, latitud, longitud, 
             ip, dispositivo, navegador, tiempo, created_at
      FROM registros 
      WHERE cedula = ?
    `;
    const params = [cedula];

    // Filtros de fecha
    if (fechaInicio) {
      query += ' AND DATE(tiempo) >= ?';
      params.push(fechaInicio);
    }
    if (fechaFin) {
      query += ' AND DATE(tiempo) <= ?';
      params.push(fechaFin);
    }

    // Filtro por tipo
    if (tipo && ['entrada', 'salida'].includes(tipo)) {
      query += ' AND entradasalida = ?';
      params.push(tipo);
    }

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY tiempo DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const registros = await executeQuery(query, params);

    res.json({
      success: true,
      data: registros,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 