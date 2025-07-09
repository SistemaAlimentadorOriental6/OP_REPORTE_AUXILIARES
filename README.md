# Sistema de Registro de Auxiliares SAO6

Sistema completo de registro GPS para auxiliares con frontend React y backend Node.js.

## 🚀 Características

- **Frontend React**: Interfaz moderna con animaciones y diseño responsivo
- **Backend Node.js**: API RESTful con autenticación JWT
- **Base de datos MySQL**: Almacenamiento persistente de datos
- **Geolocalización GPS**: Registro preciso de ubicaciones
- **Mapas interactivos**: Visualización en tiempo real
- **Exportación de datos**: Descarga en Excel/CSV
- **Análisis de datos**: Estadísticas y métricas

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL Server
- npm o yarn
- Navegador web moderno

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd OP_REPORTE_AUXILIARES
```

### 2. Configurar la base de datos
1. Crear una base de datos MySQL llamada `auxiliares_db`
2. Importar el esquema de la base de datos (crear tablas necesarias)

### 3. Configurar el backend
```bash
# Instalar dependencias del backend
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL
```

### 4. Configurar el frontend
```bash
# Desde la raíz del proyecto
npm install
```

### 5. Iniciar la aplicación

#### Opción 1: Scripts automáticos (Windows)
```bash
# Instalar dependencias del backend
./install-backend.bat

# Iniciar backend
./start-backend.bat

# En otra terminal, iniciar frontend
npm run dev
```

#### Opción 2: Manual
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

## 🔧 Configuración

### Variables de entorno del backend (`backend/.env`)
```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=auxiliares_db
DB_USER=root
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Servidor
PORT=3000
NODE_ENV=development
```

### Variables de entorno del frontend (`.env`)
```env
VITE_API_URL=http://localhost:3000
NODE_ENV=development
```

## 📚 Uso

### 1. Acceso al sistema
- Abrir `http://localhost:5173` en el navegador
- Iniciar sesión con una cédula válida registrada

### 2. Funcionalidades principales
- **Dashboard**: Registro de entrada/salida con GPS
- **Mapas**: Visualización de ubicaciones de auxiliares
- **Datos**: Análisis y exportación de registros

### 3. Rutas de la API
- `POST /api/auth/login` - Autenticación
- `GET /api/auxiliares` - Obtener auxiliares
- `POST /api/auxiliares` - Crear auxiliar
- `GET /api/registros` - Obtener registros
- `POST /api/registros` - Crear registro
- `GET /api/dashboard/stats` - Estadísticas
- `GET /api/dashboard/export` - Exportar datos

## 🏗️ Estructura del proyecto

```
OP_REPORTE_AUXILIARES/
├── backend/                 # Servidor Node.js
│   ├── config/             # Configuración de BD
│   ├── middleware/         # Middleware de validación
│   ├── routes/             # Rutas de la API
│   ├── utils/              # Utilidades
│   └── server.js           # Servidor principal
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── pages/              # Páginas principales
│   ├── store/              # Estado Redux
│   ├── lib/                # Utilidades y APIs
│   └── styles/             # Estilos CSS
├── public/                 # Archivos estáticos
└── README.md              # Este archivo
```

## 🔐 Seguridad

- Autenticación JWT
- Validación de datos con Joi
- Rate limiting
- Headers de seguridad con Helmet
- Validación de coordenadas GPS

## 📊 Funcionalidades avanzadas

### Geolocalización inteligente
- Múltiples estrategias de ubicación
- Fallbacks automáticos
- Validación de coordenadas
- Monitoreo continuo

### Análisis de datos
- Estadísticas en tiempo real
- Mapas de calor
- Exportación automática
- Filtros avanzados

### Optimización de rendimiento
- Lazy loading de componentes
- Memoización de datos
- Compresión de respuestas
- Pool de conexiones MySQL

## 🐛 Solución de problemas

### Error de conexión a la base de datos
1. Verificar que MySQL esté ejecutándose
2. Comprobar credenciales en `.env`
3. Asegurarse de que la base de datos existe

### Error de geolocalización
1. Permitir acceso a ubicación en el navegador
2. Usar HTTPS en producción
3. Verificar que el GPS esté activado

### Error de autenticación
1. Verificar que el auxiliar esté registrado
2. Comprobar configuración JWT
3. Limpiar localStorage del navegador

## 📝 Desarrollo

### Comandos útiles
```bash
# Desarrollo frontend
npm run dev

# Build para producción
npm run build

# Linting
npm run lint

# Backend en modo desarrollo
cd backend && npm run dev
```

### Estructura de la base de datos
```sql
-- Tabla auxiliares
CREATE TABLE auxiliares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla registros
CREATE TABLE registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL,
  entradasalida ENUM('Entrada', 'Salida') NOT NULL,
  lugar VARCHAR(255) NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  ip VARCHAR(45),
  tiempo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cedula) REFERENCES auxiliares(cedula)
);
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte técnico o preguntas, contactar al administrador del sistema.

---

**Nota**: Este sistema está optimizado para uso en Colombia y valida coordenadas GPS dentro del territorio nacional. 