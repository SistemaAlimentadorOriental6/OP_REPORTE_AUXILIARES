import { useEffect, useMemo, useCallback, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/Button"
import {
  Check,
  ChevronsUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Search,
  Sparkles,
  Activity,
  Users,
  Clock,
} from "lucide-react"
import { cn } from "../lib/utils"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/Table"
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover"
import { Command, CommandList, CommandGroup, CommandInput, CommandItem, CommandEmpty } from "../components/command"
import { Input } from "../components/Input"
import { fetchRegistros, setFilters, setSearchTerm, setCurrentPage } from "../store/slices/dataSlice"

export default function DataVisualization() {
  const dispatch = useDispatch()
  const [analytics, setAnalytics] = useState(null)
  const [isWorkerSupported, setIsWorkerSupported] = useState(false)
  const [processingTime, setProcessingTime] = useState(0)

  const { registros, filters, currentPage, itemsPerPage, searchTerm, isLoading, error } = useSelector(
    (state) => state.data,
  )

  // Datos filtrados optimizados
  const filteredRegistros = useMemo(() => {
    if (!registros.length) return []

    let filtered = [...registros]
    
    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(registro => 
          String(registro[key]).toLowerCase().includes(String(value).toLowerCase())
        )
      }
    })
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(registro =>
        Object.values(registro).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    
    return filtered
  }, [registros, filters, searchTerm])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsWorkerSupported(!!window.Worker)
    }
    dispatch(fetchRegistros())
  }, [dispatch])

  // Descarga optimizada
  const downloadXLSX = useCallback(
    async (data) => {
      try {
        const formattedData = data.map((registro) => ({
          ...registro,
          tiempo: registro.tiempo ? formatDate(new Date(registro.tiempo)) : formatDate(new Date()),
        }))
        
        const worksheet = XLSX.utils.json_to_sheet(formattedData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros")
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
        const data_blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        })

        const today = new Date().toISOString().split("T")[0]
        saveAs(data_blob, `registros-${today}.xlsx`)
      } catch (error) {
        console.error("Error en exportación:", error)
        alert("Error al exportar datos. Por favor, intente de nuevo.")
      }
    },
    [],
  )

  // Análisis de datos
  const generateAnalytics = useCallback(async () => {
    if (!filteredRegistros.length) {
      setAnalytics({
        totalRecords: 0,
        entryExitRatio: { entries: 0, exits: 0 },
      })
      return
    }

    try {
      const porTipo = filteredRegistros.reduce((acc, registro) => {
        const tipo = registro.entradasalida?.toLowerCase()
        if (tipo === "entrada" || tipo === "salida") {
          acc[tipo] = (acc[tipo] || 0) + 1
        }
        return acc
      }, {})

      const analysis = {
        totalRecords: filteredRegistros.length,
        entryExitRatio: {
          entries: porTipo.entrada || 0,
          exits: porTipo.salida || 0,
        },
      }
      setAnalytics(analysis)
    } catch (error) {
      console.error("Error en análisis:", error)
    }
  }, [filteredRegistros])

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")
    return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`
  }

  const getUniqueValues = (key) => {
    if (!Array.isArray(registros)) {
      return [] // Devuelve un array vacío si registros no es un array
    }
    return Array.from(new Set(registros.map((registro) => String(registro[key]))))
  }

  const FilterPopover = ({ column }) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const values = getUniqueValues(column)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
              className="justify-between bg-green-50/80 backdrop-blur-sm border-green-200/60 text-green-700 hover:bg-green-100/80 hover:border-green-300 transition-all duration-300 rounded-xl h-9 text-xs shadow-sm"
          >
            {value || `Filtrar ${column}`}
              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-white/95 backdrop-blur-xl border-green-200/60 rounded-xl shadow-xl">
          <Command>
            <CommandInput placeholder={`Buscar ${column}...`} className="border-none focus:ring-0" />
            <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {values.map((item) => (
                <CommandItem
                  key={item}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                      dispatch(setFilters({ [column]: currentValue === value ? undefined : currentValue }))
                    setOpen(false)
                  }}
                    className="hover:bg-green-50 cursor-pointer"
                >
                  <Check
                      className={cn("mr-2 h-4 w-4 text-green-600", value === item ? "opacity-100" : "opacity-0")}
                  />
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // Paginación optimizada
  const paginationData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredRegistros.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage)

    return { currentItems, totalPages, indexOfFirstItem, indexOfLastItem }
  }, [filteredRegistros, currentPage, itemsPerPage])

  const paginate = useCallback(
    (pageNumber) => {
      dispatch(setCurrentPage(pageNumber))
    },
    [dispatch],
  )

  // Generar analytics automáticamente cuando cambien los datos
  useEffect(() => {
    generateAnalytics()
  }, [generateAnalytics])

  return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-25 to-green-100 p-4 relative overflow-hidden">
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

      <motion.div 
          className="w-full max-w-7xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <motion.div 
            className="bg-white/90 backdrop-filter backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-green-100/50 relative"
            whileHover={{
              boxShadow: "0 0 40px rgba(34, 197, 94, 0.15), 0 0 80px rgba(34, 197, 94, 0.05)",
            }}
          transition={{ duration: 0.3 }}
        >
            {/* Subtle top gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500" />

            <div className="p-8 relative">
              {/* Decorative corner elements */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-sm" />
              <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-tr from-emerald-200/20 to-green-200/20 rounded-full blur-sm" />

              {/* Header con métricas de rendimiento */}
              <motion.div
                className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="relative"
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <Activity className="h-8 w-8 text-green-600" />
                    <motion.div
                      className="absolute -top-1 -right-1 text-green-400"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                    </motion.div>
                  </motion.div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <motion.div
                    className="text-xs text-emerald-700 bg-emerald-100/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-emerald-200/50 font-medium shadow-sm"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    ⚡ {processingTime.toFixed(2)}ms
                  </motion.div>
                </div>
              </motion.div>

              {/* Panel de Analytics */}
              <AnimatePresence>
                {analytics && (
                  <motion.div
                    className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, staggerChildren: 0.1 }}
                  >
                    <motion.div
                      className="bg-gradient-to-br from-green-100/80 to-emerald-100/80 backdrop-blur-sm p-6 rounded-2xl border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-600 font-semibold mb-1">Total Registros</p>
                          <p className="text-2xl font-bold text-green-800">{analytics.totalRecords}</p>
                        </div>
                        <div className="p-3 bg-green-200/50 rounded-xl">
                          <BarChart3 className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="bg-gradient-to-br from-teal-100/80 to-green-100/80 backdrop-blur-sm p-6 rounded-2xl border border-teal-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.02, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-teal-600 font-semibold mb-1">Entradas/Salidas</p>
                          <p className="text-2xl font-bold text-teal-800">
                            {analytics.entryExitRatio?.entries || 0}/{analytics.entryExitRatio?.exits || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-teal-200/50 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search and Controls */}
              <motion.div
                className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex-1 min-w-0 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 z-10" />
                    <Input
                      type="text"
                      placeholder="Búsqueda ultra rápida en todos los campos..."
                      value={searchTerm}
                      onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                      className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400/30 bg-white/80 backdrop-blur-sm h-12 rounded-xl transition-all duration-300 hover:bg-white/90 w-full"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/5 to-emerald-400/5 pointer-events-none" />
                  </div>
              </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <motion.div
                    className="text-sm text-green-700 bg-green-50/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-green-200/50 font-medium"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  >
                    {filteredRegistros.length} de {registros.length} registros
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => downloadXLSX(filteredRegistros)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 h-12 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                      disabled={filteredRegistros.length === 0}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Download className="mr-2 h-4 w-4 relative z-10" />
                      <span className="relative z-10">Exportar Excel</span>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Table */}
              <motion.div
                className="overflow-hidden rounded-2xl border border-green-200/50 shadow-lg bg-white/50 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border-green-200/50">
                        <TableHead className="text-green-700 font-semibold">
                          <div className="flex items-center gap-2">
                            Cédula
                            <FilterPopover column="cedula" />
                          </div>
                        </TableHead>
                        <TableHead className="text-green-700 font-semibold">
                          <div className="flex items-center gap-2">
                            Nombre
                            <FilterPopover column="nombre" />
                          </div>
                        </TableHead>
                        <TableHead className="text-green-700 font-semibold">
                          <div className="flex items-center gap-2">
                            Entrada/Salida
                            <FilterPopover column="entradasalida" />
                          </div>
                        </TableHead>
                        <TableHead className="text-green-700 font-semibold">
                          <div className="flex items-center gap-2">
                            Lugar
                            <FilterPopover column="lugar" />
                          </div>
                        </TableHead>
                        <TableHead className="text-green-700 font-semibold">Latitud</TableHead>
                        <TableHead className="text-green-700 font-semibold">Longitud</TableHead>
                        <TableHead className="text-green-700 font-semibold">
                          <div className="flex items-center gap-2">
                            IP
                            <FilterPopover column="ip" />
                          </div>
                        </TableHead>
                        <TableHead className="text-green-700 font-semibold">
                          <div className="flex items-center gap-2">
                            Tiempo
                            <FilterPopover column="tiempo" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {paginationData.currentItems.map((registro, index) => (
                          <motion.tr
                            key={index}
                            className="hover:bg-green-50/50 transition-colors duration-200 border-green-100/50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.05)" }}
                          >
                            <TableCell className="font-medium text-green-800">{registro.cedula}</TableCell>
                            <TableCell className="text-green-700">{registro.nombre}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-lg text-xs font-medium",
                                  registro.entradasalida === "Entrada"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {registro.entradasalida}
                              </span>
                            </TableCell>
                            <TableCell className="text-green-700">{registro.lugar}</TableCell>
                            <TableCell className="text-green-600 font-mono text-sm">{registro.latitud}</TableCell>
                            <TableCell className="text-green-600 font-mono text-sm">{registro.longitud}</TableCell>
                            <TableCell className="text-green-600 font-mono text-sm">{registro.ip}</TableCell>
                            <TableCell className="text-green-700 text-sm">
                              {new Date(registro.tiempo).toLocaleString()}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </motion.div>

              {/* Enhanced Pagination */}
              <motion.div
                className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-sm text-green-700 font-medium">
                  Mostrando {paginationData.indexOfFirstItem + 1} -{" "}
                  {Math.min(paginationData.indexOfLastItem, filteredRegistros.length)} de{" "}
                  {filteredRegistros.length} registros
                </p>
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-green-100/80 backdrop-blur-sm text-green-700 hover:bg-green-200/80 border border-green-200/50 rounded-xl h-10 px-3 transition-all duration-300 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </motion.div>

                  <div className="flex gap-1">
                    {[...Array(Math.min(paginationData.totalPages, 5)).keys()].map((number) => {
                      const pageNumber = number + 1
                      const isActive = currentPage === pageNumber

                      return (
                        <motion.div key={pageNumber} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={() => paginate(pageNumber)}
                            className={cn(
                              "h-10 w-10 rounded-xl transition-all duration-300 font-semibold",
                              isActive
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                                : "bg-green-100/80 backdrop-blur-sm text-green-700 hover:bg-green-200/80 border border-green-200/50",
                            )}
                          >
                            {pageNumber}
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === paginationData.totalPages}
                      className="bg-green-100/80 backdrop-blur-sm text-green-700 hover:bg-green-200/80 border border-green-200/50 rounded-xl h-10 px-3 transition-all duration-300 disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced animated bottom border */}
            <motion.div
              className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 via-green-500 to-emerald-400"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
            />
          </motion.div>
        </motion.div>
      </div>
    )
  }