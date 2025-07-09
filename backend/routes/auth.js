const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { validate } = require('../middleware/validation');
const logger = require('../utils/logger');

// POST /api/auth/login - Login por cédula para auxiliares
router.post('/login', async (req, res, next) => {
  try {
    const { cedula } = req.body;

    if (!cedula) {
      logger.warn('Intento de login sin cédula', { ip: req.ip });
      return res.status(400).json({
        success: false,
        error: 'Cédula es requerida'
      });
    }

    // Verificar si la cédula existe en la base de datos
    const auxiliares = await executeQuery(
      'SELECT cedula, nombre FROM auxiliares WHERE cedula = ?',
      [cedula]
    );

    if (auxiliares.length === 0) {
      logger.warn('Intento de login con cédula no encontrada', { cedula, ip: req.ip });
      return res.status(401).json({
        success: false,
        error: 'Cédula no encontrada o auxiliar inactivo'
      });
    }

    const auxiliar = auxiliares[0];

    // Generar JWT token
    const token = jwt.sign(
      { 
        cedula: auxiliar.cedula,
        nombre: auxiliar.nombre,
        rol: 'auxiliar',
        iat: Date.now() 
      },
      process.env.JWT_SECRET || 'sao6_secret_key',
      { expiresIn: '24h' }
    );

    logger.info('Login exitoso', { cedula, ip: req.ip });

    res.json({
      success: true,
      message: 'Login exitoso',
      token: token,
      user: {
        cedula: auxiliar.cedula,
        nombre: auxiliar.nombre,
        rol: 'auxiliar'
      }
    });

  } catch (error) {
    logger.error('Error en login', { error: error.message });
    next(error);
  }
});

// POST /api/auth/verify-token - Verificar si el token es válido
router.post('/verify-token', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token es requerido'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sao6_secret_key');
      
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          usuario: decoded.usuario,
          rol: decoded.rol,
          valid: true
        }
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - Logout (básico)
router.post('/logout', async (req, res, next) => {
  try {
    // En una implementación más avanzada, aquí se invalidaría el token en una lista negra
    // Por ahora solo retornamos confirmación
    
    logger.info('Usuario cerró sesión', { ip: req.ip });

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    next(error);
  }
});

// Middleware para proteger rutas (opcional)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'sao6_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido'
      });
    }
    req.user = user;
    next();
  });
};

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        usuario: req.user.usuario,
        rol: req.user.rol,
        authenticated: true
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken; 