import React, { memo, useMemo, useCallback, useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table"
import { Button } from './Button'
import { Input } from './Input'
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./command"
import { Check, ChevronsUpDown, Download } from "lucide-react"
import { cn } from "../lib/utils"

// Componente de fila optimizado con React.memo
const OptimizedTableRow = memo(({ index, style, data }) => {
  const { items, columns, onRowClick } = data
  const item = items[index]
  
  const handleClick = useCallback(() => {
    onRowClick?.(item)
  }, [item, onRowClick])

  return (
    <div style={style}>
      <motion.div
        className="flex items-center border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
        onClick={handleClick}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.1 }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={`px-4 py-2 text-sm ${column.className || ''}`}
            style={{ 
              width: column.width || 'auto',
              minWidth: column.minWidth || '100px',
              flex: column.flex || 'none'
            }}
          >
            {column.render ? column.render(item[column.key], item) : item[column.key]}
          </div>
        ))}
      </motion.div>
    </div>
  )
})

OptimizedTableRow.displayName = 'OptimizedTableRow'

// Componente de filtro optimizado
const OptimizedFilter = memo(({ column, values, onFilterChange, currentFilter }) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(currentFilter || "")

  const handleSelect = useCallback((currentValue) => {
    const newValue = currentValue === value ? "" : currentValue
    setValue(newValue)
    onFilterChange(column, newValue)
    setOpen(false)
  }, [column, value, onFilterChange])

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
                onSelect={handleSelect}
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
})

OptimizedFilter.displayName = 'OptimizedFilter'

// Componente principal de tabla optimizada
const OptimizedTable = memo(({ 
  data = [], 
  columns = [], 
  searchTerm = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  onRowClick,
  onDownload,
  itemHeight = 60,
  maxHeight = 600,
  loading = false,
  error = null
}) => {
  // Memorizar datos filtrados para evitar recálculos innecesarios
  const filteredData = useMemo(() => {
    let filtered = [...data]
    
    // Aplicar filtros de columna
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => 
          String(item[key]).toLowerCase().includes(String(value).toLowerCase())
        )
      }
    })
    
    // Aplicar búsqueda global
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    
    return filtered
  }, [data, filters, searchTerm])

  // Memorizar valores únicos para filtros
  const uniqueValues = useMemo(() => {
    const values = {}
    columns.forEach(column => {
      if (column.filterable) {
        values[column.key] = Array.from(new Set(data.map(item => String(item[column.key]))))
      }
    })
    return values
  }, [data, columns])

  // Callback optimizado para cambio de filtros
  const handleFilterChange = useCallback((column, value) => {
    onFilterChange?.({
      ...filters,
      [column]: value || undefined
    })
  }, [filters, onFilterChange])

  // Callback optimizado para búsqueda
  const handleSearchChange = useCallback((e) => {
    onSearchChange?.(e.target.value)
  }, [onSearchChange])

  // Callback optimizado para descarga
  const handleDownload = useCallback(() => {
    onDownload?.(filteredData)
  }, [filteredData, onDownload])

  // Datos para la lista virtualizada
  const listData = useMemo(() => ({
    items: filteredData,
    columns,
    onRowClick
  }), [filteredData, columns, onRowClick])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error.message || 'Ocurrió un error al cargar los datos'}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Barra de herramientas optimizada */}
      <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-0">
          <Input
            type="text"
            placeholder="Buscar en todos los campos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full max-w-md"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredData.length} de {data.length} registros
          </span>
          
          {onDownload && (
            <Button
              onClick={handleDownload}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={filteredData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros optimizados */}
      <div className="mb-4 flex flex-wrap gap-2">
        {columns.filter(col => col.filterable).map(column => (
          <OptimizedFilter
            key={column.key}
            column={column.key}
            values={uniqueValues[column.key] || []}
            onFilterChange={handleFilterChange}
            currentFilter={filters[column.key]}
          />
        ))}
      </div>

      {/* Tabla con virtualización */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b">
          <div className="flex items-center">
            {columns.map((column) => (
              <div
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                style={{ 
                  width: column.width || 'auto',
                  minWidth: column.minWidth || '100px',
                  flex: column.flex || 'none'
                }}
              >
                {column.title}
              </div>
            ))}
          </div>
        </div>

        {/* Tabla virtualizada */}
        <div style={{ height: Math.min(maxHeight, filteredData.length * itemHeight) }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                itemCount={filteredData.length}
                itemSize={itemHeight}
                itemData={listData}
                overscanCount={5} // Renderizar 5 elementos extra para mejor performance
              >
                {OptimizedTableRow}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>

      {/* Información de rendimiento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          Renderizando {Math.min(Math.ceil(maxHeight / itemHeight), filteredData.length)} de {filteredData.length} filas
        </div>
      )}
    </div>
  )
})

OptimizedTable.displayName = 'OptimizedTable'

export default OptimizedTable 