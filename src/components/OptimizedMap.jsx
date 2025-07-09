import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Target, 
  Crosshair, 
  Satellite, 
  Map as MapIcon, 
  Navigation, 
  Layers,
  Zap,
  Globe,
  RefreshCw,
  Maximize,
  Minimize
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Crear iconos personalizados más precisos
const createCustomIcon = (color = '#10B981', size = 'normal') => {
  const iconSize = size === 'large' ? 40 : 30
  const shadowSize = size === 'large' ? 50 : 40
  
  return L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div style="
        position: relative;
        width: ${iconSize}px;
        height: ${iconSize}px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${iconSize}px;
          height: ${iconSize}px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 3px ${color}20;
          animation: pulse 2s infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          z-index: 10;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 ${color}40; }
          70% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 15px ${color}00; }
          100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 ${color}00; }
        }
      </style>
    `,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2]
  })
}

// Componente para manejar eventos del mapa
const MapEventHandler = ({ onLocationSelect, allowSelection = false }) => {
  useMapEvents({
    click(e) {
      if (allowSelection && onLocationSelect) {
        onLocationSelect([e.latlng.lat, e.latlng.lng])
      }
    },
  })
  return null
}

// Componente para centrar el mapa automáticamente
const MapCenterController = ({ position, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, {
        duration: 1.5,
        easeLinearity: 0.1
      })
    }
  }, [position, map, zoom])
  
  return null
}

// Componente principal del mapa optimizado
const OptimizedMap = ({ 
  position, 
  onPositionChange,
  height = '400px',
  showAccuracyCircle = true,
  allowLocationSelection = false,
  showControls = true,
  className = '',
  accuracy = null,
  isFullscreen = false,
  onFullscreenToggle
}) => {
  const [mapStyle, setMapStyle] = useState('street')
  const [showSatellite, setShowSatellite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [locationAccuracy, setLocationAccuracy] = useState(accuracy || 10)
  const mapRef = useRef()

  // Estilos de mapa disponibles
  const mapStyles = {
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      name: 'Calles'
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
      name: 'Satélite'
    },
    hybrid: {
      url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      name: 'Híbrido'
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      name: 'Oscuro'
    }
  }

  // Obtener ubicación con alta precisión
  const getCurrentLocation = () => {
    setIsLoading(true)
    
    if (!navigator.geolocation) {
      console.error('Geolocalización no soportada')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const newPosition = [latitude, longitude]
        
        setLocationAccuracy(accuracy)
        if (onPositionChange) {
          onPositionChange(newPosition)
        }
        setIsLoading(false)
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error)
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  // Obtener ubicación con watchPosition para mayor precisión
  const startWatchingLocation = () => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const newPosition = [latitude, longitude]
        
        // Solo actualizar si la precisión es mejor
        if (accuracy < locationAccuracy) {
          setLocationAccuracy(accuracy)
          if (onPositionChange) {
            onPositionChange(newPosition)
          }
        }
      },
      (error) => console.error('Error watching location:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }

  useEffect(() => {
    if (position && showAccuracyCircle) {
      const cleanup = startWatchingLocation()
      return cleanup
    }
  }, [position, showAccuracyCircle])

  const handleLocationSelect = (newPosition) => {
    if (onPositionChange) {
      onPositionChange(newPosition)
    }
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Controles del mapa */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] space-y-2">
          {/* Control de pantalla completa */}
          {onFullscreenToggle && (
            <motion.button
              onClick={onFullscreenToggle}
              className="p-3 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl border border-green-200/50 text-green-600 hover:text-green-700 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </motion.button>
          )}

          {/* Control de ubicación */}
          <motion.button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="p-3 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl border border-green-200/50 text-green-600 hover:text-green-700 transition-all duration-300 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
            ) : (
              <Target className="w-5 h-5" />
            )}
          </motion.button>

          {/* Selector de estilo de mapa */}
          <div className="relative">
            <motion.button
              onClick={() => setShowSatellite(!showSatellite)}
              className="p-3 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl border border-green-200/50 text-green-600 hover:text-green-700 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Layers className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
              {showSatellite && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-green-200/50 p-2 min-w-[140px]"
                >
                  {Object.entries(mapStyles).map(([key, style]) => (
                    <motion.button
                      key={key}
                      onClick={() => {
                        setMapStyle(key)
                        setShowSatellite(false)
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                        mapStyle === key 
                          ? 'bg-green-100 text-green-700' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      whileHover={{ x: 2 }}
                    >
                      {style.name}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Información de precisión */}
      {position && locationAccuracy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-green-200/50 p-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${locationAccuracy < 10 ? 'bg-green-500' : locationAccuracy < 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="text-green-700 font-medium">
              Precisión: {Math.round(locationAccuracy)}m
            </span>
          </div>
          {position && (
            <div className="text-xs text-green-600 mt-1">
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          )}
        </motion.div>
      )}

      {/* Instrucciones para selección */}
      {allowLocationSelection && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-green-200/50 p-3"
        >
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Crosshair className="w-4 h-4" />
            <span className="font-medium">Toca el mapa para seleccionar ubicación</span>
          </div>
        </motion.div>
      )}

      {/* Mapa principal */}
      <MapContainer
        ref={mapRef}
        center={position || [6.2442, -75.5812]}
        zoom={18}
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        className="z-10"
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
      >
        <TileLayer
          url={mapStyles[mapStyle].url}
          attribution={mapStyles[mapStyle].attribution}
          maxZoom={20}
          tileSize={256}
        />
        
        <MapCenterController position={position} zoom={18} />
        <MapEventHandler 
          onLocationSelect={handleLocationSelect} 
          allowSelection={allowLocationSelection} 
        />
        
        {position && (
          <>
            {/* Marcador principal */}
            <Marker 
              position={position} 
              icon={createCustomIcon('#10B981', 'large')}
            >
              <Popup className="custom-popup">
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-700">Tu Ubicación</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Lat: {position[0].toFixed(6)}</div>
                    <div>Lng: {position[1].toFixed(6)}</div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${locationAccuracy < 10 ? 'bg-green-500' : locationAccuracy < 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span>±{Math.round(locationAccuracy)}m</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Círculo de precisión */}
            {showAccuracyCircle && (
              <Circle
                center={position}
                radius={locationAccuracy}
                pathOptions={{
                  fillColor: '#10B981',
                  fillOpacity: 0.1,
                  color: '#10B981',
                  weight: 2,
                  opacity: 0.6,
                  dashArray: '5, 5'
                }}
              />
            )}
          </>
        )}
      </MapContainer>

      {/* Overlay de carga */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-[1001]"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full mx-auto mb-3"
              />
              <p className="text-green-700 font-medium">Obteniendo ubicación precisa...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default OptimizedMap