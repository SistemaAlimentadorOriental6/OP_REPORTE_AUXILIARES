"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Moon,
  Sun,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  User,
  Building,
  Navigation,
  Search,
  BarChart3,
  Activity,
  LogIn,
  LogOut,
  Phone,
  Mail,
  Badge,
  Timer,
  Eye,
  X,
  Filter,
  Download,
  Bell,
  List,
  MapIcon,
  CheckCircle,
  Share2,
  Shield,
  Wifi,
  SlidersHorizontal,
} from "lucide-react"
import apiClient from "../lib/api"
import "leaflet/dist/leaflet.css"

// Enhanced Employee Detail Modal with consistent design
const EmployeeDetailModal = ({ employee, onClose, onNext, onPrev, currentIndex, totalEmployees }) => {
  const [activeTab, setActiveTab] = useState("info")
  const [historial, setHistorial] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const isEntrada = employee.entradasalida?.toLowerCase() === "entrada"

  useEffect(() => {
    if (activeTab === "history" && employee.cedula) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true)
        try {
          const response = await apiClient.getEmployeeHistory(employee.cedula)
          if (response.success) {
            setHistorial(response.data)
          }
        } catch (error) {
          console.error("Error al cargar historial:", error)
        } finally {
          setIsLoadingHistory(false)
        }
      }
      fetchHistory()
    }
  }, [activeTab, employee.cedula])

  const tabs = [
    { id: "info", label: "Información", icon: User },
    { id: "location", label: "Ubicación", icon: MapPin },
    { id: "history", label: "Historial", icon: Clock },
  ]

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[85vh] overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`relative p-6 ${isEntrada ? "bg-gradient-to-r from-emerald-500 to-green-600" : "bg-gradient-to-r from-red-500 to-rose-600"} text-white`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{employee.nombre}</h2>
              <p className="text-white/80 text-sm">ID: {employee.cedula}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/20`}>
                  {isEntrada ? <LogIn size={12} /> : <LogOut size={12} />}
                  {employee.entradasalida}
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs">
                  <Wifi size={10} />
                  <span>En línea</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "text-emerald-600 border-b-2 border-emerald-500 bg-white"
                  : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "400px" }}>
          <AnimatePresence mode="wait">
            {activeTab === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Badge className="w-5 h-5 text-emerald-600" />
                      Información Personal
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Badge className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Cédula</p>
                          <p className="text-sm font-semibold text-gray-800">{employee.cedula}</p>
                        </div>
                      </div>

                      {employee.telefono && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <Phone className="w-4 h-4 text-white" />
            </div>
                          <div>
                            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Teléfono</p>
                            <p className="text-sm font-semibold text-gray-800">{employee.telefono}</p>
          </div>
                        </div>
                      )}

                      {employee.email && (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <Mail className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Email</p>
                            <p className="text-sm font-semibold text-gray-800">{employee.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-600" />
                      Estado Actual
                    </h3>

          <div className="space-y-3">
                      <div
                        className={`p-4 rounded-xl border ${isEntrada ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${isEntrada ? "bg-emerald-500" : "bg-red-500"}`}>
                            {isEntrada ? (
                              <LogIn className="w-5 h-5 text-white" />
                            ) : (
                              <LogOut className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Estado del Registro</p>
                            <p className={`text-xs font-medium ${isEntrada ? "text-emerald-600" : "text-red-600"}`}>
                              {isEntrada ? "Entrada registrada" : "Salida registrada"}
                            </p>
                          </div>
            </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Timer className="w-3 h-3" />
                          <span>
                            Hace {Math.floor((Date.now() - new Date(employee.tiempo).getTime()) / (1000 * 60))} minutos
              </span>
                        </div>
            </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                          <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                          <p className="text-xs font-medium text-blue-600">Verificado</p>
            </div>
                        <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                          <Shield className="w-6 h-6 text-green-500 mx-auto mb-1" />
                          <p className="text-xs font-medium text-green-600">Autorizado</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "location" && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="p-3 bg-orange-500 rounded-lg">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-600 font-medium uppercase tracking-wide">Ubicación Actual</p>
                    <p className="text-lg font-semibold text-gray-800">{employee.lugar}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <div className="p-3 bg-teal-500 rounded-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-teal-600 font-medium uppercase tracking-wide">Coordenadas GPS</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {Number.parseFloat(employee.latitud).toFixed(6)},{" "}
                      {Number.parseFloat(employee.longitud).toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Precisión: ±5 metros</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="p-3 bg-indigo-500 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-medium uppercase tracking-wide">Timestamp</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(employee.tiempo).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{new Date(employee.tiempo).toLocaleTimeString("es-ES")}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Historial de Ubicaciones
                </h3>

                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : historial.length > 0 ? (
                  <div className="space-y-3">
                    {historial.map((dia, index) => (
                      <div key={index} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-800">
                            {new Date(dia.fecha).toLocaleDateString("es-ES", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              dia.status === "complete"
                                ? "bg-green-100 text-green-600"
                                : dia.status === "incomplete"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {dia.status === "complete"
                              ? "Completo"
                              : dia.status === "incomplete"
                                ? "Incompleto"
                                : "Parcial"}
            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Entradas</p>
                            <p className="font-semibold text-green-600">{dia.entradas}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Salidas</p>
                            <p className="font-semibold text-red-600">{dia.salidas}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Horas</p>
                            <p className="font-semibold text-blue-600">{dia.horas}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No hay registros históricos disponibles</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>

        {/* Navigation Footer */}
        {totalEmployees > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <motion.button
                onClick={onPrev}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-gray-700 hover:text-emerald-600 border border-gray-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft size={16} />
                <span className="font-medium">Anterior</span>
              </motion.button>

              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-lg">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-emerald-700">
                  {currentIndex + 1} de {totalEmployees}
              </span>
              </div>

              <motion.button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-gray-700 hover:text-emerald-600 border border-gray-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="font-medium">Siguiente</span>
                <ChevronRight size={16} />
              </motion.button>
            </div>
            </div>
          )}
      </motion.div>
    </motion.div>
  )
}

// Enhanced clustering function
const clusterEmployeesByProximity = (employees, zoomLevel = 13) => {
  const clusters = []
  const processed = new Set()
  const distanceThreshold = 50 // 50 meters

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c * 1000
  }

  employees.forEach((employee, index) => {
    if (processed.has(index)) return

    const cluster = [employee]
    processed.add(index)

    employees.forEach((otherEmployee, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return

      const distance = calculateDistance(
        employee.latitud,
        employee.longitud,
        otherEmployee.latitud,
        otherEmployee.longitud,
      )

      if (distance < distanceThreshold) {
        cluster.push(otherEmployee)
        processed.add(otherIndex)
      }
    })

    clusters.push(cluster)
  })

  return clusters
}

// Enhanced Custom Marker with polished design
const PolishedCustomMarker = ({ employeeCluster, isDarkMode, onEmployeeClick }) => {
  const [showQuickView, setShowQuickView] = useState(false)
  const employees = employeeCluster
  const employeeCount = employees.length

  const centerLat = employees.reduce((sum, emp) => sum + Number.parseFloat(emp.latitud), 0) / employeeCount
  const centerLng = employees.reduce((sum, emp) => sum + Number.parseFloat(emp.longitud), 0) / employeeCount

  const entradas = employees.filter((emp) => emp.entradasalida?.toLowerCase() === "entrada").length
  const salidas = employees.filter((emp) => emp.entradasalida?.toLowerCase() === "salida").length
  const majorityStatus = entradas > salidas ? "entrada" : salidas > entradas ? "salida" : "mixed"

  const getMarkerStyles = () => {
    const baseSize = 44
    const size = employeeCount === 1 ? baseSize : Math.min(baseSize + employeeCount * 4, 72)

    let bgColor = "#10B981"
    let shadowColor = "#10B98130"

    if (majorityStatus === "salida") {
      bgColor = "#EF4444"
      shadowColor = "#EF444430"
    } else if (majorityStatus === "mixed") {
      bgColor = "#F59E0B"
      shadowColor = "#F59E0B30"
    }

    return { size, bgColor, shadowColor }
  }

  const styles = getMarkerStyles()

  const customIcon = L.divIcon({
    className: "custom-polished-marker",
    html: `
      <div style="
        position: relative;
        width: ${styles.size}px;
        height: ${styles.size}px;
      ">
        <!-- Shadow/Glow effect -->
        <div style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: ${styles.size + 8}px;
          height: ${styles.size + 8}px;
          background: ${styles.shadowColor};
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
        
        <!-- Main marker -->
        <div style="
          position: relative;
          width: ${styles.size}px;
          height: ${styles.size}px;
          background: linear-gradient(135deg, ${styles.bgColor} 0%, ${styles.bgColor}E6 100%);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          
          ${
            employeeCount === 1
              ? `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          `
              : `
            <span style="
              color: white;
              font-weight: 700;
              font-size: ${employeeCount <= 9 ? "16px" : "14px"};
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            ">${employeeCount}</span>
          `
          }
        </div>
        
        ${
          employeeCount > 1
            ? `
          <!-- Status indicators -->
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            display: flex;
            flex-direction: column;
            gap: 1px;
          ">
            ${
              entradas > 0
                ? `
              <div style="
                background: #10B981;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              ">${entradas}</div>
            `
                : ""
            }
            ${
              salidas > 0
                ? `
              <div style="
                background: #EF4444;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                margin-top: ${entradas > 0 ? "1px" : "0"};
              ">${salidas}</div>
            `
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(1); }
        }
      </style>
    `,
    iconSize: [styles.size, styles.size],
    iconAnchor: [styles.size / 2, styles.size / 2],
  })

  const handleMarkerClick = () => {
    if (employeeCount === 1) {
      onEmployeeClick(employees[0], employees)
    } else {
      setShowQuickView(true)
    }
  }

  return (
    <Marker position={[centerLat, centerLng]} icon={customIcon} eventHandlers={{ click: handleMarkerClick }}>
      <Popup className="custom-polished-popup" closeButton={false}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden w-80">
          {/* Compact Header */}
          <div
            className={`p-3 text-white ${
              majorityStatus === "entrada"
                ? "bg-gradient-to-r from-emerald-500 to-green-600"
                : majorityStatus === "salida"
                  ? "bg-gradient-to-r from-red-500 to-rose-600"
                  : "bg-gradient-to-r from-amber-500 to-orange-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {employeeCount === 1 ? employees[0].nombre : `${employeeCount} Empleados`}
                  </h3>
                  <p className="text-xs opacity-90">
                    {employeeCount === 1 ? employees[0].lugar : `en ${employees[0].lugar}`}
                  </p>
                </div>
              </div>

              {employeeCount > 1 && (
                <div className="flex gap-1">
                  {entradas > 0 && (
                    <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                      <LogIn className="w-3 h-3" />
                      {entradas}
                    </div>
                  )}
                  {salidas > 0 && (
                    <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                      <LogOut className="w-3 h-3" />
                      {salidas}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Compact Content */}
          <div className="p-3">
            {employeeCount === 1 ? (
              // Single employee compact view
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <Badge className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">ID: {employees[0].cedula}</p>
                    <p className="text-xs text-gray-600">{new Date(employees[0].tiempo).toLocaleTimeString("es-ES")}</p>
                  </div>
                </div>

                <motion.button
                  onClick={() => onEmployeeClick(employees[0], employees)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalles
                </motion.button>
              </div>
            ) : (
              // Multiple employees compact view
              <div className="space-y-3">
                {/* Compact Summary Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-800">{employeeCount}</p>
                    <p className="text-xs text-blue-600">Total</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
                    <LogIn className="w-4 h-4 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-800">{entradas}</p>
                    <p className="text-xs text-green-600">Entradas</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
                    <LogOut className="w-4 h-4 text-red-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-red-800">{salidas}</p>
                    <p className="text-xs text-red-600">Salidas</p>
                  </div>
                </div>

                {/* Compact Employee List */}
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {employees.slice(0, 3).map((emp, index) => (
                    <div
                      key={`${emp.cedula}-${index}`}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer border border-gray-100 hover:border-emerald-200"
                      onClick={() => onEmployeeClick(emp, employees)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1 rounded-lg ${
                            emp.entradasalida?.toLowerCase() === "entrada" ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        >
                          {emp.entradasalida?.toLowerCase() === "entrada" ? (
                            <LogIn className="w-3 h-3 text-white" />
                          ) : (
                            <LogOut className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-xs">{emp.nombre}</p>
                          <p className="text-xs text-gray-500">{new Date(emp.tiempo).toLocaleTimeString("es-ES")}</p>
                        </div>
                      </div>
                      <Eye className="w-3 h-3 text-gray-400" />
                    </div>
                  ))}
                  {employees.length > 3 && (
                    <div className="text-center py-1 text-xs text-gray-500">+{employees.length - 3} más</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Enhanced Stats Panel with compact design
const PolishedStatsPanel = ({ employees, selectedDate }) => {
  const stats = useMemo(() => {
    const entradas = employees.filter((emp) => emp.entradasalida?.toLowerCase() === "entrada").length
    const salidas = employees.filter((emp) => emp.entradasalida?.toLowerCase() === "salida").length
    const ubicaciones = new Set(employees.map((emp) => emp.lugar)).size
    const empleadosUnicos = new Set(employees.map((emp) => emp.cedula)).size

    return {
      entradas,
      salidas,
      ubicaciones,
      empleadosUnicos,
      totalRegistros: employees.length,
    }
  }, [employees])

  return (
    <motion.div
      className="absolute top-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-[1000] w-72"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Dashboard</h2>
          <p className="text-xs text-gray-600">{selectedDate}</p>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-3 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-1 mb-1">
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">Entradas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-800">{stats.entradas}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-100 p-3 rounded-lg border border-red-200">
          <div className="flex items-center gap-1 mb-1">
            <LogOut className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Salidas</span>
          </div>
          <p className="text-2xl font-bold text-red-800">{stats.salidas}</p>
        </div>
      </div>

      {/* Compact Additional Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Empleados</span>
          </div>
          <span className="text-sm font-bold text-blue-800">{stats.empleadosUnicos}</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center gap-1">
            <Building className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">Ubicaciones</span>
          </div>
          <span className="text-sm font-bold text-purple-800">{stats.ubicaciones}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Enhanced Filter Panel with consistent design
const FilterPanel = ({ isOpen, onClose, filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState({
    estado: filters?.estado || "todos",
    ubicacion: filters?.ubicacion || "",
    timeRange: {
      start: filters?.timeRange?.start || "",
      end: filters?.timeRange?.end || ""
    }
  })

  const ubicaciones = [
    'Prado Occidente',
    'Prado Oriente',
    'Hospital Sur',
    'Acevedo',
    'La Y',
    'Tricentenario',
    'Hospital Norte',
    'Exposiciones',
    'La Uva',
    'San Antonio',
    'Universidad',
    'Gardel',
    'Alejandro - Oriente'
  ]

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-20 right-8 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl z-[1000] w-80 border border-green-200/50"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Filtros</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Estado Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="estado"
                  value="todos"
                  checked={localFilters.estado === "todos"}
                  onChange={(e) => setLocalFilters({ ...localFilters, estado: e.target.value })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-2 text-sm text-gray-600">Todos</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="estado"
                  value="entrada"
                  checked={localFilters.estado === "entrada"}
                  onChange={(e) => setLocalFilters({ ...localFilters, estado: e.target.value })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-2 text-sm text-gray-600">Entrada</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="estado"
                  value="salida"
                  checked={localFilters.estado === "salida"}
                  onChange={(e) => setLocalFilters({ ...localFilters, estado: e.target.value })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="ml-2 text-sm text-gray-600">Salida</span>
              </label>
            </div>
          </div>

          {/* Ubicación Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
            <select
              value={localFilters.ubicacion}
              onChange={(e) => setLocalFilters({ ...localFilters, ubicacion: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Todas las ubicaciones</option>
              {ubicaciones.map((ubicacion) => (
                <option key={ubicacion} value={ubicacion}>
                  {ubicacion}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rango de Tiempo</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={localFilters.timeRange.start}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    timeRange: { ...localFilters.timeRange, start: e.target.value },
                  })
                }
                className="p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <input
                type="time"
                value={localFilters.timeRange.end}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    timeRange: { ...localFilters.timeRange, end: e.target.value },
                  })
                }
                className="p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Apply Button */}
          <motion.button
            onClick={handleApplyFilters}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Aplicar Filtros
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Main Component with polished design
export default function AdvancedMapaEmpleados() {
  const [employees, setEmployees] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [mapKey, setMapKey] = useState(0)
  const [error, setError] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [employeeGroup, setEmployeeGroup] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("map")
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    estado: "todos",
    ubicacion: "",
    timeRange: {
      start: "",
      end: ""
    }
  })

  const fetchEmployeeData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getMapData(selectedDate)

      if (response.success && response.data?.ubicaciones) {
        const allRegistros = response.data.ubicaciones.flatMap((ubicacion) => {
          return ubicacion.registros.map((registro) => ({
            ...registro,
            latitud: Number.parseFloat(ubicacion.latitud),
            longitud: Number.parseFloat(ubicacion.longitud),
            lugar: ubicacion.lugar,
            entradasalida: (registro.entradasalida || "entrada").toLowerCase(),
          }))
        })

        setEmployees(allRegistros)
        setMapKey((prevKey) => prevKey + 1)
        setError(null)
      } else {
        setEmployees([])
        setError(`No hay datos disponibles para la fecha ${selectedDate}`)
      }
    } catch (error) {
      console.error("Error al obtener datos de empleados:", error)
      setEmployees([])
      setError("Error al cargar los datos. Por favor, intente de nuevo más tarde.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchEmployeeData()
  }, [fetchEmployeeData])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    setMapKey((prevKey) => prevKey + 1)
  }

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value)
  }

  const handleEmployeeClick = (employee, group) => {
    setSelectedEmployee(employee)
    setEmployeeGroup(group)
  }

  const handleNextEmployee = () => {
    const currentIndex = employeeGroup.findIndex((emp) => emp.cedula === selectedEmployee.cedula)
    const nextIndex = (currentIndex + 1) % employeeGroup.length
    setSelectedEmployee(employeeGroup[nextIndex])
  }

  const handlePrevEmployee = () => {
    const currentIndex = employeeGroup.findIndex((emp) => emp.cedula === selectedEmployee.cedula)
    const prevIndex = (currentIndex - 1 + employeeGroup.length) % employeeGroup.length
    setSelectedEmployee(employeeGroup[prevIndex])
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const statusMatch =
        filters.estado === "todos" || employee.entradasalida?.toLowerCase() === filters.estado.toLowerCase()

      const ubicacionMatch = !filters.ubicacion || employee.lugar === filters.ubicacion

      let timeMatch = true
      if (filters.timeRange.start || filters.timeRange.end) {
        const employeeTime = new Date(employee.tiempo)
        const employeeHours = employeeTime.getHours()
        const employeeMinutes = employeeTime.getMinutes()
        const employeeTimeString = `${employeeHours.toString().padStart(2, "0")}:${employeeMinutes
          .toString()
          .padStart(2, "0")}`

        if (filters.timeRange.start && employeeTimeString < filters.timeRange.start) timeMatch = false
        if (filters.timeRange.end && employeeTimeString > filters.timeRange.end) timeMatch = false
      }

      return statusMatch && ubicacionMatch && timeMatch
    })
  }, [employees, filters])

  const clusteredEmployees = useMemo(() => {
    return clusterEmployeesByProximity(filteredEmployees, 13)
  }, [filteredEmployees])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Map Container with proper spacing */}
        <motion.div
        className="relative h-screen w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 mx-2 my-2"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={{ height: "calc(100vh - 1rem)" }}
      >
        {viewMode === "map" ? (
          <MapContainer center={[6.2442, -75.5812]} zoom={13} style={{ height: "100%", width: "100%" }} key={mapKey}>
          <TileLayer
            url={
              isDarkMode
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
            {clusteredEmployees.map((cluster, index) => (
              <PolishedCustomMarker
                key={`cluster-${index}`}
                employeeCluster={cluster}
                isDarkMode={isDarkMode}
                onEmployeeClick={handleEmployeeClick}
              />
          ))}
        </MapContainer>
        ) : (
          // List View
          <div className="h-full bg-white p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <List className="w-6 h-6 text-emerald-600" />
                Lista de Empleados
              </h2>

              <div className="grid gap-4">
                {filteredEmployees.map((employee, index) => (
                  <motion.div
                    key={`${employee.cedula}-${index}`}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{employee.nombre}</h3>
                          <p className="text-sm text-gray-600">ID: {employee.cedula}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {employee.lugar}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(employee.tiempo).toLocaleTimeString("es-ES")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            employee.entradasalida === "entrada"
                              ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                              : "bg-red-100 text-red-600 border border-red-200"
                          }`}
                        >
                          {employee.entradasalida === "entrada" ? <LogIn size={12} /> : <LogOut size={12} />}
                          {employee.entradasalida}
                        </div>

                        <motion.button
                          onClick={() => handleEmployeeClick(employee, [employee])}
                          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Compact Stats Panel */}
      <PolishedStatsPanel employees={filteredEmployees} selectedDate={selectedDate} />

      {/* Compact Search Bar */}
      <motion.div
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-[1000] flex items-center gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <Search className="w-4 h-4 text-emerald-600" />
          </div>
          <input
            type="text"
            placeholder="Buscar empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-500 focus:border-emerald-400 focus:ring-emerald-400/30 transition-all text-sm"
          />
        </div>

        {/* Compact View Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
          <motion.button
            onClick={() => setViewMode("map")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "map" ? "bg-white shadow-sm text-emerald-600" : "text-gray-600 hover:text-emerald-600"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MapIcon className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === "list" ? "bg-white shadow-sm text-emerald-600" : "text-gray-600 hover:text-emerald-600"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <List className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Compact Top Action Bar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-[1000]">
        {/* Filter Button */}
        <motion.button
          className="bg-white text-blue-600 p-2 rounded-lg shadow-md hover:bg-blue-50 transition-all border border-gray-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
        </motion.button>

        {/* Notifications Button */}
        <motion.button
          className="bg-white text-orange-600 p-2 rounded-lg shadow-md hover:bg-orange-50 transition-all border border-gray-200 relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={16} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </motion.button>

      {/* Settings Button */}
      <motion.button
          className="bg-white text-emerald-600 p-2 rounded-lg shadow-md hover:bg-emerald-50 transition-all border border-gray-200"
          whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowSettings(!showSettings)}
      >
        <motion.div animate={{ rotate: showSettings ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <Settings size={16} />
        </motion.div>
      </motion.button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="absolute top-20 right-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 z-[1000] w-96"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Settings className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Configuración</h2>
            </div>

            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Moon className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-emerald-700">Modo Oscuro</span>
                    <p className="text-xs text-emerald-600">Cambia el tema del mapa</p>
                  </div>
                </div>
                <motion.button
                  onClick={toggleDarkMode}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    isDarkMode ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ x: isDarkMode ? 26 : 2 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              </div>

              {/* Date Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <label className="font-medium text-gray-700">Seleccionar Fecha:</label>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-emerald-400 focus:ring-emerald-400/30 transition-all"
                />
              </div>

              {/* Export Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Download className="w-4 h-4 text-purple-600" />
                  </div>
                  <label className="font-medium text-gray-700">Exportar Datos:</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                    <span>CSV</span>
                  </motion.button>
                  <motion.button
                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                    <span>PDF</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Legend */}
      <motion.div
        className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 z-[1000]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <Navigation className="w-4 h-4 text-emerald-600" />
        </div>
          <p className="font-bold text-gray-800 text-sm">Leyenda</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full border-2 border-white shadow-sm" />
            <span className="text-xs font-medium text-gray-700">Entrada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-full border-2 border-white shadow-sm" />
            <span className="text-xs font-medium text-gray-700">Salida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full border-2 border-white shadow-sm relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold"></div>
            </div>
            <span className="text-xs font-medium text-gray-700">Múltiples</span>
          </div>
        </div>
      </motion.div>

      {/* Compact Connection Status */}
      <motion.div
        className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2 z-[1000]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-emerald-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <span className="text-xs font-medium text-emerald-700">En línea</span>
        </div>
      </motion.div>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <EmployeeDetailModal
            employee={selectedEmployee}
            onClose={() => setSelectedEmployee(null)}
            onNext={handleNextEmployee}
            onPrev={handlePrevEmployee}
            currentIndex={employeeGroup.findIndex((emp) => emp.cedula === selectedEmployee.cedula)}
            totalEmployees={employeeGroup.length}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
