'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/Table"
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../components/command"
import { Check, ChevronsUpDown, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { Input } from "../components/Input"

export default function DataVisualization() {
  const [registros, setRegistros] = useState([])
  const [filteredRegistros, setFilteredRegistros] = useState([])
  const [filters, setFilters] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [registros, filters, searchTerm])

  const fetchData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:10000/obtener-registros')
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      setRegistros(data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const applyFilters = () => {
    let filtered = registros
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(registro => 
          String(registro[key]).toLowerCase().includes(String(value).toLowerCase())
        )
      }
    })
    if (searchTerm) {
      filtered = filtered.filter(registro =>
        Object.values(registro).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    setFilteredRegistros(filtered)
    setCurrentPage(1)
  }

  const downloadXLSX = (data) => {
    const formattedData = data.map(registro => ({
      ...registro,
      tiempo: formatDate(new Date(registro.tiempo))
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros")
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const data_blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' })
    saveAs(data_blob, 'registros.xlsx')
  }

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`
  }

  const getUniqueValues = (key) => {
    return Array.from(new Set(registros.map(registro => String(registro[key]))))
  }

  const FilterPopover = ({ column }) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const values = getUniqueValues(column)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          >
            {value || `Filtrar ${column}`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={`Buscar ${column}...`} />
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {values.map((item) => (
                <CommandItem
                  key={item}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setFilters(prev => ({...prev, [column]: currentValue === value ? undefined : currentValue}))
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRegistros.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div 
        className="w-full max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <motion.div 
          className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden"
          whileHover={{ boxShadow: "0 0 30px rgba(52, 211, 153, 0.3)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-8">
            <h1 className="text-3xl font-bold text-emerald-700 mb-6 text-center">Visualización de Datos</h1>
            
            <div className="mb-4 flex justify-between items-center">
              <div className="flex-1 mr-4">
                <Input
                  type="text"
                  placeholder="Buscar en todos los campos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={() => downloadXLSX(filteredRegistros)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Datos (XLSX)
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-emerald-700">
                      Cédula
                      <FilterPopover column="cedula" />
                    </TableHead>
                    <TableHead className="text-emerald-700">
                      Nombre
                      <FilterPopover column="nombre" />
                    </TableHead>
                    <TableHead className="text-emerald-700">
                      Entrada/Salida
                      <FilterPopover column="entradasalida" />
                    </TableHead>
                    <TableHead className="text-emerald-700">
                      Lugar
                      <FilterPopover column="lugar" />
                    </TableHead>
                    <TableHead className="text-emerald-700">Latitud</TableHead>
                    <TableHead className="text-emerald-700">Longitud</TableHead>
                    <TableHead className="text-emerald-700">
                      IP
                      <FilterPopover column="ip" />
                    </TableHead>
                    <TableHead className="text-emerald-700">
                      Tiempo
                      <FilterPopover column="tiempo" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((registro, index) => (
                    <TableRow key={index} className="hover:bg-emerald-50">
                      <TableCell>{registro.cedula}</TableCell>
                      <TableCell>{registro.nombre}</TableCell>
                      <TableCell>{registro.entradasalida}</TableCell>
                      <TableCell>{registro.lugar}</TableCell>
                      <TableCell>{registro.latitud}</TableCell>
                      <TableCell>{registro.longitud}</TableCell>
                      <TableCell>{registro.ip}</TableCell>
                      <TableCell>{new Date(registro.tiempo).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-emerald-700">
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRegistros.length)} de {filteredRegistros.length} registros
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(totalPages).keys()].map((number) => (
                  <Button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={cn(
                      "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                      currentPage === number + 1 && "bg-emerald-500 text-white hover:bg-emerald-600"
                    )}
                  >
                    {number + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}