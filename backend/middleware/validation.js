const Joi = require('joi');
const logger = require('../utils/logger');
const { body, param, query, validationResult } = require('express-validator');

// Esquemas de validación
const schemas = {
  // Validación para cédula
  cedula: Joi.object({
    cedula: Joi.string()
      .pattern(/^\d{8,10}$/)
      .required()
      .messages({
        'string.pattern.base': 'La cédula debe tener entre 8 y 10 dígitos',
        'any.required': 'La cédula es requerida'
      })
  }),

  // Validación para nuevo auxiliar
  nuevoAuxiliar: Joi.object({
    cedula: Joi.string()
      .pattern(/^\d{8,10}$/)
      .required()
      .messages({
        'string.pattern.base': 'La cédula debe tener entre 8 y 10 dígitos',
        'any.required': 'La cédula es requerida'
      }),
    nombre: Joi.string()
      .min(2)
      .max(255)
      .required()
      .messages({
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede exceder 255 caracteres',
        'any.required': 'El nombre es requerido'
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'El email debe tener un formato válido'
      }),
    telefono: Joi.string()
      .pattern(/^\d{10}$/)
      .optional()
      .messages({
        'string.pattern.base': 'El teléfono debe tener 10 dígitos'
      }),
    cargo: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'El cargo no puede exceder 100 caracteres'
      })
  }),

  // Validación para registro GPS
  registroGPS: Joi.object({
    cedula: Joi.string()
      .pattern(/^\d{8,10}$/)
      .required()
      .messages({
        'string.pattern.base': 'La cédula debe tener entre 8 y 10 dígitos',
        'any.required': 'La cédula es requerida'
      }),
    entradasalida: Joi.string()
      .valid('entrada', 'salida')
      .required()
      .messages({
        'any.only': 'La opción debe ser "entrada" o "salida"',
        'any.required': 'El tipo de registro es requerido'
      }),
    lugar: Joi.string()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.min': 'El lugar es requerido',
        'string.max': 'El lugar no puede exceder 255 caracteres',
        'any.required': 'El lugar es requerido'
      }),
    latitud: Joi.number()
      .min(-90)
      .max(90)
      .precision(8)
      .required()
      .messages({
        'number.min': 'La latitud debe estar entre -90 y 90',
        'number.max': 'La latitud debe estar entre -90 y 90',
        'any.required': 'La latitud es requerida'
      }),
    longitud: Joi.number()
      .min(-180)
      .max(180)
      .precision(8)
      .required()
      .messages({
        'number.min': 'La longitud debe estar entre -180 y 180',
        'number.max': 'La longitud debe estar entre -180 y 180',
        'any.required': 'La longitud es requerida'
      })
  }),

  // Validación para obtener datos por fecha
  obtenerDatos: Joi.object({
    fecha: Joi.date()
      .iso()
      .required()
      .messages({
        'date.base': 'La fecha debe tener un formato válido',
        'any.required': 'La fecha es requerida'
      }),
    cedula: Joi.string()
      .pattern(/^\d{8,10}$/)
      .optional(),
    tipo: Joi.string()
      .valid('entrada', 'salida')
      .optional()
  }),

  // Validación para filtros avanzados
  filtrosAvanzados: Joi.object({
    fechaInicio: Joi.date().iso().optional(),
    fechaFin: Joi.date().iso().optional(),
    cedula: Joi.string().pattern(/^\d{8,10}$/).optional(),
    lugar: Joi.string().max(255).optional(),
    tipo: Joi.string().valid('entrada', 'salida').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }).custom((value, helpers) => {
    if (value.fechaInicio && value.fechaFin && value.fechaInicio > value.fechaFin) {
      return helpers.error('custom.dateRange');
    }
    return value;
  }).messages({
    'custom.dateRange': 'La fecha de inicio no puede ser mayor a la fecha fin'
  })
};

// Middleware de validación
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schemas[schema].validate(
      { ...req.body, ...req.query, ...req.params },
      { abortEarly: false, stripUnknown: true }
    );

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn(`Validation error: ${errorMessage}`, {
        url: req.originalUrl,
        method: req.method,
        data: req.body
      });

      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        timestamp: new Date().toISOString()
      });
    }

    // Actualizar req con datos validados y sanitizados
    Object.assign(req.body, value);
    Object.assign(req.query, value);
    next();
  };
};

// Validación personalizada para coordenadas GPS
const validateGPSCoordinates = (req, res, next) => {
  const { latitud, longitud } = req.body;
  
  // Verificar que las coordenadas estén en Colombia (aproximadamente)
  const colombiaLatMin = -4.2;
  const colombiaLatMax = 15.5;
  const colombiaLonMin = -81.8;
  const colombiaLonMax = -66.9;

  if (latitud < colombiaLatMin || latitud > colombiaLatMax ||
      longitud < colombiaLonMin || longitud > colombiaLonMax) {
    logger.warn(`GPS coordinates outside Colombia: ${latitud}, ${longitud}`, {
      ip: req.ip,
      cedula: req.body.cedula
    });
    
    return res.status(400).json({
      success: false,
      error: 'Las coordenadas GPS deben estar dentro del territorio colombiano',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Validación para la ruta de historial
const validateHistorialRequest = [
  param('cedula')
    .isString()
    .notEmpty()
    .withMessage('La cédula es requerida'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Los días deben ser un número entre 1 y 90'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validate,
  validateGPSCoordinates,
  validateHistorialRequest,
  schemas
}; 