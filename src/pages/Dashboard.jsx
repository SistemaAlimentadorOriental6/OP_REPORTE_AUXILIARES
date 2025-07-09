"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin,
  BarChart2,
  Loader,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  Menu,
  Clock,
  User,
  Building,
  Send,
  Zap,
  Globe,
  Target,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "../styles/map.css"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/dropdown-menu"
import { Input } from "../components/Input"
import {
  setRegistro,
  setLugarIntegraciones,
  setPosition,
  setReporteModalOpen,
  setLugarModalOpen,
  setConfirmModalOpen,
  setMapModalOpen,
  setSuccessModalOpen,
  setErrorModalOpen,
  setSearchTerm,
  setIsLoading,
  setIsUpdatingLocation,
  setError,
  sendRecord,
} from "../store/slices/dashboardSlice"
import apiClient from "../lib/api"

const Modal = ({ children, isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-green-200/50 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-green-100/80 hover:bg-green-200/80 text-green-600 transition-all duration-300 z-10"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

const LocationMarker = ({ position, setPosition }) => {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom())
    }
  }, [position, map])

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Tu ubicación actual</Popup>
    </Marker>
  )
}

export default function Dashboard() {
  const [userName, setUserName] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nombreCompleto, setNombreCompleto] = useState("")

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    registro,
    lugarIntegraciones,
    position,
    isReporteModalOpen,
    isLugarModalOpen,
    isConfirmModalOpen,
    isMapModalOpen,
    isSuccessModalOpen,
    isErrorModalOpen,
    searchTerm,
    isLoading,
    isUpdatingLocation,
    error,
    lugaresIntegracion = [],
  } = useSelector((state) => state.dashboard)

  const { cedula } = useSelector((state) => state.auth)

  const filteredLugares = lugaresIntegracion.filter((lugar) => lugar.toLowerCase().includes(searchTerm.toLowerCase()))

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getLocation = useCallback(() => {
    dispatch(setIsLoading(true))

    if (!("geolocation" in navigator)) {
      dispatch(setError("Geolocalización no soportada en este navegador."))
      dispatch(setIsLoading(false))
      return
    }

    let watchId = null
    const cleanupGeolocation = () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
      dispatch(setIsLoading(false))
    }

    const handlePosition = (position) => {
      const { latitude, longitude } = position.coords
      dispatch(setPosition([latitude, longitude]))
      cleanupGeolocation()
    }

    const handleError = (error) => {
      let errorMessage = "Error al obtener la ubicación. "

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage += "Debes permitir el acceso a la ubicación."
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage += "La ubicación no está disponible."
          break
        case error.TIMEOUT:
          errorMessage += "Se agotó el tiempo de espera."
          break
        default:
          errorMessage += "Verifica que el GPS esté activado."
      }

      dispatch(setError(errorMessage))
      cleanupGeolocation()
    }

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    })

    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    })

    return () => cleanupGeolocation()
  }, [dispatch])

  const updateLocation = () => {
    dispatch(setIsUpdatingLocation(true))

    const handlePosition = (position) => {
      const { latitude, longitude } = position.coords
      dispatch(setPosition([latitude, longitude]))
      dispatch(setIsUpdatingLocation(false))
    }

    const handleError = (error) => {
      dispatch(setError("No se pudo actualizar la ubicación. Verifica el GPS."))
      dispatch(setIsUpdatingLocation(false))
    }

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    })
  }

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        if (cedula) {
          setUserName(cedula)
          // Obtener el nombre desde la base de datos
          const response = await apiClient.getAuxiliar(cedula)
          if (response && response.data && response.data.nombre) {
            setNombreCompleto(response.data.nombre)
          }
        }
      } catch (error) {
        console.error("Error al obtener la información del usuario:", error)
      }
    }
    getUserInfo()
    getLocation()
  }, [getLocation, cedula])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (registro === "" || lugarIntegraciones === "") {
      dispatch(setError("Debe seleccionar una opción para el registro y el lugar/integración"))
      dispatch(setErrorModalOpen(true))
      return
    }
    if (!position) {
      dispatch(setError("No se pudo obtener la ubicación."))
      dispatch(setErrorModalOpen(true))
      return
    }
    dispatch(setConfirmModalOpen(true))
  }

  const confirmEnviar = async () => {
    dispatch(setConfirmModalOpen(false))
    dispatch(setMapModalOpen(true))
  }

  const finalConfirmEnviar = async () => {
    dispatch(setMapModalOpen(false))
    const result = await dispatch(
      sendRecord({
        cedula,
        registro,
        lugarIntegraciones,
        position,
      }),
    )
  }

  const handleVisualizarDatos = () => {
    if (cedula === "1035126774") {
      navigate("/datos")
    } else {
      dispatch(setError("No tienes acceso a esta función."))
      dispatch(setErrorModalOpen(true))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-25 to-green-100 flex flex-col relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-r from-green-200/15 to-emerald-200/15 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -80, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-l from-emerald-200/20 to-green-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 120, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-green-100/25 to-emerald-100/25 rounded-full blur-2xl"
          animate={{
            x: [-50, 50, -50],
            y: [-30, 30, -30],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-green-300/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Header */}
      <motion.header
        className="relative z-10 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <img src="/sao6.png" alt="SAO6" className="w-8 h-8" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 text-green-400"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="w-3 h-3" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                SAO6
              </h1>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="p-3 bg-white/90 backdrop-blur-xl text-green-600 hover:bg-green-50/90 rounded-2xl border border-green-200/50 transition-all duration-300 shadow-lg"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white/95 backdrop-blur-xl border border-green-200/50 rounded-2xl shadow-2xl p-2">
              <DropdownMenuItem
                onClick={() => navigate("/maps")}
                className="flex items-center p-3 hover:bg-green-50/80 rounded-xl transition-all duration-300 cursor-pointer"
              >
                <div className="p-2 bg-blue-100/80 rounded-lg mr-3">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium text-green-700">Ver Mapa</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleVisualizarDatos}
                className="flex items-center p-3 hover:bg-green-50/80 rounded-xl transition-all duration-300 cursor-pointer"
              >
                <div className="p-2 bg-purple-100/80 rounded-lg mr-3">
                  <BarChart2 className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-medium text-green-700">Visualizar Datos</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Cards */}
          <motion.div
            className="lg:col-span-1 space-y-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Time Card */}
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100/80 rounded-xl">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-green-700 font-semibold">Hora Actual</h3>
              </div>
              <p className="text-2xl font-bold text-green-800">{currentTime.toLocaleTimeString()}</p>
              <p className="text-green-600 text-sm font-medium">{currentTime.toLocaleDateString()}</p>
            </motion.div>

            {/* User Card */}
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100/80 rounded-xl">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-green-700 font-semibold">Usuario</h3>
              </div>
              <div className="space-y-2">
                <p className="text-green-800 font-medium">{nombreCompleto || "Cargando..."}</p>
                <p className="text-green-600 text-sm font-mono">{userName}</p>
              </div>
            </motion.div>

            {/* Location Card */}
            <motion.div
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100/80 rounded-xl relative">
                  <Globe className="w-5 h-5 text-purple-600" />
                  {isLoading && (
                    <motion.div
                      className="absolute -inset-1 bg-purple-400/30 rounded-xl"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-green-700 font-semibold">Ubicación GPS</h3>
                  {position && (
                    <div className="flex items-center gap-2 mt-1">
                      <motion.div
                        className="w-2 h-2 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      />
                      <span className="text-xs text-green-600 font-medium">Activo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl border border-green-200/50">
                  <p className="text-green-600 text-sm font-medium">
                    {position ? (
                      <span className="font-mono">
                        {position[0].toFixed(6)}, {position[1].toFixed(6)}
                      </span>
                    ) : isLoading ? (
                      "Obteniendo ubicación precisa..."
                    ) : (
                      "Ubicación no disponible"
                    )}
                  </p>
                </div>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-blue-50/80 rounded-2xl border border-blue-200/50"
                  >
                    <motion.div
                      className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                    <div className="flex-1">
                      <span className="text-xs text-blue-700 font-medium">Buscando señal GPS...</span>
                      <div className="w-full bg-blue-200/50 rounded-full h-1.5 mt-1">
                        <motion.div
                          className="bg-blue-500 h-1.5 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: ["0%", "100%"] }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {isUpdatingLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-orange-50/80 rounded-2xl border border-orange-200/50"
                  >
                    <motion.div
                      className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                    <span className="text-xs text-orange-700 font-medium">Mejorando precisión...</span>
                  </motion.div>
                )}

                {position && !isLoading && !isUpdatingLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2 bg-green-50/80 rounded-xl"
                  >
                    <Target className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Ubicación confirmada</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Main Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-green-200/50 shadow-2xl h-full relative">
              {/* Decorative corner elements */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-sm" />
              <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-tr from-emerald-200/20 to-green-200/20 rounded-full blur-sm" />

              <div className="flex items-center gap-3 mb-8">
                <motion.div
                  className="p-3 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-2xl border border-green-200/50"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Target className="w-6 h-6 text-green-600" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    Registro de Actividad
                  </h2>
                  <p className="text-green-600 font-medium">Completa los campos para registrar tu actividad</p>
                </div>
              </div>

              <form onSubmit={handleEnviar} className="space-y-6">
                {/* Reporte Selection */}
                <div>
                  <label className="block text-green-700 text-sm font-semibold mb-3">Tipo de Reporte</label>
                  <motion.button
                    type="button"
                    onClick={() => dispatch(setReporteModalOpen(true))}
                    className="w-full p-4 bg-white/80 backdrop-blur-sm border border-green-200/60 rounded-2xl text-left text-green-800 hover:bg-green-50/80 hover:border-green-300 transition-all duration-300 group shadow-sm hover:shadow-md relative"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/5 to-emerald-400/5 pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100/80 rounded-xl group-hover:bg-orange-200/80 transition-colors">
                          <Building className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-medium">{registro || "Selecciona el tipo de reporte"}</span>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                </div>

                {/* Lugar Selection */}
                <div>
                  <label className="block text-green-700 text-sm font-semibold mb-3">Lugar de Integración</label>
                  <motion.button
                    type="button"
                    onClick={() => dispatch(setLugarModalOpen(true))}
                    className="w-full p-4 bg-white/80 backdrop-blur-sm border border-green-200/60 rounded-2xl text-left text-green-800 hover:bg-green-50/80 hover:border-green-300 transition-all duration-300 group shadow-sm hover:shadow-md relative"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/5 to-emerald-400/5 pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100/80 rounded-xl group-hover:bg-cyan-200/80 transition-colors">
                          <MapPin className="w-4 h-4 text-cyan-600" />
                        </div>
                        <span className="font-medium">{lugarIntegraciones || "Selecciona el lugar"}</span>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  className="w-full p-4 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl relative overflow-hidden group h-14"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!registro || !lugarIntegraciones || isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Loader className="w-5 h-5" />
                        </motion.div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Registro
                      </>
                    )}
                  </div>
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Modals */}
      <Modal isOpen={isReporteModalOpen} onClose={() => dispatch(setReporteModalOpen(false))}>
        <div className="pr-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-6 text-center">
            Tipo de Reporte
          </h2>
          <div className="space-y-3">
            {["entrada", "salida"].map((opcion, index) => (
              <motion.button
                key={opcion}
                onClick={() => {
                  dispatch(setRegistro(opcion))
                  dispatch(setReporteModalOpen(false))
                }}
                className="w-full p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border border-green-200/60 rounded-2xl text-left hover:from-green-100/80 hover:to-emerald-100/80 transition-all duration-300 font-medium shadow-sm hover:shadow-md text-green-800"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full shadow-lg ${opcion === "entrada" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="capitalize">{opcion}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isLugarModalOpen} onClose={() => dispatch(setLugarModalOpen(false))}>
        <div className="pr-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-6 text-center">
            Lugar de Integración
          </h2>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 z-10" />
              <Input
                type="text"
                placeholder="Buscar lugar..."
                value={searchTerm}
                onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                className="pl-10 w-full p-3 bg-white/80 backdrop-blur-sm border border-green-200 rounded-2xl text-green-800 placeholder-green-400 focus:border-green-400 focus:ring-green-400/30 transition-all duration-300"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/5 to-emerald-400/5 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <AnimatePresence>
              {filteredLugares.map((opcion, index) => (
                <motion.button
                  key={opcion}
                  onClick={() => {
                    dispatch(setLugarIntegraciones(opcion))
                    dispatch(setLugarModalOpen(false))
                  }}
                  className="w-full p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border border-green-200/60 rounded-2xl text-left hover:from-green-100/80 hover:to-emerald-100/80 transition-all duration-300 font-medium shadow-sm hover:shadow-md text-green-800"
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {opcion.toUpperCase()}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={() => dispatch(setConfirmModalOpen(false))}>
        <div className="pr-4 text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-6">
            Confirmar Registro
          </h2>
          <p className="mb-6 text-green-700 font-medium">¿Confirmas el envío de estos datos?</p>
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-green-50/80 backdrop-blur-sm rounded-2xl border border-green-200/50">
              <p className="text-green-800 font-medium">
                <strong>Reporte:</strong> {registro}
              </p>
            </div>
            <div className="p-4 bg-emerald-50/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50">
              <p className="text-emerald-800 font-medium">
                <strong>Lugar:</strong> {lugarIntegraciones}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={() => dispatch(setConfirmModalOpen(false))}
              className="flex-1 p-3 bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-2xl border border-gray-200/50 hover:bg-gray-200/80 transition-all duration-300 font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              onClick={confirmEnviar}
              className="flex-1 p-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Confirmar
            </motion.button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isMapModalOpen} onClose={() => dispatch(setMapModalOpen(false))}>
        <div className="w-full max-w-none mx-auto">
          {/* Header simplificado y elegante */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
            <div className="inline-flex items-center gap-3 p-3 bg-green-500 rounded-2xl mb-3">
              <MapPin className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Confirmar Ubicación</h2>
            </div>
            <p className="text-green-600 text-sm">Verifica que tu ubicación sea precisa</p>
          </motion.div>

          {/* Mapa principal más grande */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[50vh] sm:h-[60vh] min-h-[350px] mb-4 rounded-2xl overflow-hidden border border-green-200 shadow-xl relative"
          >
            {/* Status indicator simple */}
            <div className="absolute top-3 left-3 z-[1001] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                />
                <span className="text-green-700 text-sm font-medium">GPS Activo</span>
              </div>
            </div>

            {/* Botón de actualizar simple */}
            <div className="absolute top-3 right-3 z-[1001]">
              <motion.button
                onClick={updateLocation}
                disabled={isUpdatingLocation}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-green-200 text-green-600 hover:bg-green-50 transition-all duration-300 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isUpdatingLocation ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Target className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            {/* Coordenadas en la parte inferior */}
            {position && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 left-3 z-[1001] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-green-600" />
                  <div className="text-green-700">
                    <div className="font-mono text-xs">
                      {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mapa */}
            {position && (
              <MapContainer
                center={position}
                zoom={18}
                style={{ height: "100%", width: "100%" }}
                className="rounded-2xl"
                scrollWheelZoom={true}
                doubleClickZoom={true}
                touchZoom={true}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                  maxZoom={20}
                />

                {/* Marcador principal */}
                <Marker
                  position={position}
                  icon={L.divIcon({
                    className: "custom-location-marker",
                    html: `
                      <div style="
                        position: relative;
                        width: 30px;
                        height: 30px;
                      ">
                        <div style="
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          width: 30px;
                          height: 30px;
                          background: #10B981;
                          border: 3px solid white;
                          border-radius: 50%;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
                          0% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 rgba(16, 185, 129, 0.4); }
                          70% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 15px rgba(16, 185, 129, 0); }
                          100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 rgba(16, 185, 129, 0); }
                        }
                      </style>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                    popupAnchor: [0, -15],
                  })}
                >
                  <Popup>
                    <div className="text-center p-2">
                      <div className="font-semibold text-green-700 mb-1">Tu Ubicación</div>
                      <div className="text-xs text-gray-600">📍 GPS Preciso</div>
                    </div>
                  </Popup>
                </Marker>

                {/* Círculo de precisión simple */}
                <Circle
                  center={position}
                  radius={15}
                  pathOptions={{
                    fillColor: "#10B981",
                    fillOpacity: 0.1,
                    color: "#10B981",
                    weight: 2,
                    opacity: 0.6,
                  }}
                />
                <LocationMarker position={position} setPosition={(pos) => dispatch(setPosition(pos))} />
              </MapContainer>
            )}
          </motion.div>

          {/* Pregunta de confirmación simple */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-4">
            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold">¿Es correcta tu ubicación?</span>
              </div>
              <p className="text-sm text-green-600">Verifica que el marcador esté en tu posición</p>
            </div>
          </motion.div>

          {/* Botones de acción optimizados para móvil */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <motion.button
              onClick={updateLocation}
              className="p-3 sm:p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium shadow-md transition-all duration-300 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isUpdatingLocation}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                {isUpdatingLocation ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.div>
                ) : (
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="text-xs sm:text-sm">Actualizar</span>
              </div>
            </motion.button>
            <motion.button
              onClick={() => dispatch(setMapModalOpen(false))}
              className="p-3 sm:p-4 bg-gray-400 hover:bg-gray-500 text-white rounded-xl font-medium shadow-md transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Cancelar</span>
              </div>
            </motion.button>
            <motion.button
              onClick={finalConfirmEnviar}
              className="p-3 sm:p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium shadow-md transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">Enviar</span>
              </div>
            </motion.button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSuccessModalOpen} onClose={() => dispatch(setSuccessModalOpen(false))}>
        <motion.div
          className="text-center pr-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="mx-auto w-16 h-16 bg-green-100/80 rounded-full flex items-center justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">¡Registro Exitoso!</h2>
          <p className="mb-6 text-green-600 font-medium">Los datos se enviaron correctamente</p>
          <motion.button
            onClick={() => dispatch(setSuccessModalOpen(false))}
            className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continuar
          </motion.button>
        </motion.div>
      </Modal>

      <Modal isOpen={isErrorModalOpen} onClose={() => dispatch(setErrorModalOpen(false))}>
        <motion.div
          className="text-center pr-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="mx-auto w-16 h-16 bg-red-100/80 rounded-full flex items-center justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <AlertCircle className="w-8 h-8 text-red-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-6 text-red-500 font-medium">{error}</p>
          <motion.button
            onClick={() => dispatch(setErrorModalOpen(false))}
            className="w-full p-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cerrar
          </motion.button>
        </motion.div>
      </Modal>
    </div>
  )
}
