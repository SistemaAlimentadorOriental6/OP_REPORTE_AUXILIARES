'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Moon, Sun, Calendar, Users, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'

const CustomMarker = ({ employees, isDarkMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentEmployee = employees[currentIndex]
  console.log('Estado de entrada/salida:', currentEmployee.entradasalida)
  const markerColor = currentEmployee.entradasalida?.toLowerCase() === 'entrada' ? '#4CAF50' : '#FF5252'
  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  const lat = parseFloat(currentEmployee.latitud)
  const lng = parseFloat(currentEmployee.longitud)

  if (isNaN(lat) || isNaN(lng)) {
    console.error('Coordenadas inválidas para el empleado:', currentEmployee)
    return null
  }

  const nextEmployee = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % employees.length)
  }

  const prevEmployee = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + employees.length) % employees.length)
  }

  return (
    <Marker position={[lat, lng]} icon={customIcon}>
      <Popup>
        <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <h3 className="text-lg font-bold mb-2">{currentEmployee.nombre}</h3>
          <p className="text-sm"><span className="font-medium">Cédula:</span> {currentEmployee.cedula}</p>
          <p className="text-sm"><span className="font-medium">Lugar:</span> {currentEmployee.lugar}</p>
          <p className="text-sm"><span className="font-medium">Tiempo:</span> {new Date(currentEmployee.tiempo).toLocaleString()}</p>
          <p className={`text-sm font-medium ${currentEmployee.entradasalida?.toLowerCase() === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
            Estado: {currentEmployee.entradasalida}
          </p>
          {employees.length > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button onClick={prevEmployee} className="p-1 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300">
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm">{currentIndex + 1} / {employees.length}</span>
              <button onClick={nextEmployee} className="p-1 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

export default function MapaEmpleados() {
  const [employees, setEmployees] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [mapKey, setMapKey] = useState(0)
  const [error, setError] = useState(null)

  const fetchEmployeeData = useCallback(async () => {
    try {
      console.log(`Fetching data for date: ${selectedDate}`)
      const response = await axios.get(`http://127.0.0.1:10000/obtener-datos?fecha=${selectedDate}`)
      console.log('Respuesta completa:', response)
      console.log('Datos recibidos:', response.data)
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        const processedData = response.data.map(emp => ({
          ...emp,
          latitud: parseFloat(emp.latitud),
          longitud: parseFloat(emp.longitud)
        }))
        setEmployees(processedData)
        setMapKey(prevKey => prevKey + 1)
        setError(null)
      } else {
        console.warn('No se recibieron datos de empleados o el array está vacío')
        setEmployees([])
        setError(`No hay datos disponibles para la fecha ${selectedDate}`)
      }
    } catch (error) {
      console.error('Error al obtener datos de empleados:', error)
      setEmployees([])
      setError('Error al cargar los datos. Por favor, intente de nuevo más tarde.')
    }
  }, [selectedDate])

  useEffect(() => {
    fetchEmployeeData()
  }, [fetchEmployeeData])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    setMapKey(prevKey => prevKey + 1)
  }

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value)
  }

  const groupEmployeesByLocation = (employees) => {
    const grouped = {}
    employees.forEach(employee => {
      const key = `${employee.latitud},${employee.longitud}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(employee)
    })
    return grouped
  }

  const groupedEmployees = groupEmployeesByLocation(employees)

  return (
    <motion.div
      className={`relative h-screen w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MapContainer key={mapKey} center={[6.2442, -75.5812]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url={isDarkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {Object.entries(groupedEmployees).map(([key, employeesAtLocation]) => (
          <CustomMarker key={key} employees={employeesAtLocation} isDarkMode={isDarkMode} />
        ))}
      </MapContainer>

      <motion.button
        className={`absolute top-4 right-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-2 rounded-full shadow-lg z-[1000] hover:bg-opacity-80 transition-colors duration-300`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSettings(!showSettings)}
      >
        <Settings size={24} />
      </motion.button>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className={`absolute top-16 right-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-4 rounded-lg shadow-lg z-[1000] w-64`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-bold mb-4">Configuración</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Modo Oscuro</span>
                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-opacity-80 transition-colors duration-300">
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
              <div>
                <label className="block mb-2">Seleccionar Fecha:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className={`w-full p-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={`absolute bottom-4 right-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-6 py-4 rounded-lg shadow-lg z-[1000]`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className="text-2xl font-bold mb-2">Mapa de Empleados</h1>
        <p className="text-sm mb-1"><Calendar className="inline mr-2" size={16} /> Fecha: {selectedDate}</p>
        <p className="text-sm"><Users className="inline mr-2" size={16} /> Total de registros: {employees.length}</p>
      </motion.div>

      <div className={`absolute bottom-4 left-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-4 py-2 rounded-lg shadow-lg z-[1000]`}>
        <p className="text-sm font-bold mb-2">Leyenda:</p>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs">Entrada</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-xs">Salida</span>
        </div>
      </div>

      {error && (
        <motion.div
          className={`absolute top-4 left-1/2 transform -translate-x-1/2 ${isDarkMode ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'} px-6 py-3 rounded-lg shadow-lg z-[1000]`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AlertCircle className="inline mr-2" size={20} />
          {error}
        </motion.div>
      )}
    </motion.div>
  )
}