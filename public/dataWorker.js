// Web Worker ultra optimizado para procesamiento de datos pesados
class DataProcessor {
  constructor() {
    this.cache = new Map()
    this.processingQueue = []
    this.isProcessing = false
  }

  // Procesamiento ultra rápido de filtros
  async filterData(data, filters, searchTerm) {
    const cacheKey = JSON.stringify({ filters, searchTerm })
    
    // Verificar cache para máxima velocidad
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    let filtered = [...data]
    
    // Aplicar filtros con algoritmo optimizado
    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true
          return String(item[key]).toLowerCase().includes(String(value).toLowerCase())
        })
      })
    }
    
    // Búsqueda global ultra rápida
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchLower)
        )
      })
    }

    // Guardar en cache para futuras consultas
    this.cache.set(cacheKey, filtered)
    
    // Limpiar cache si está muy grande
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    return filtered
  }

  // Procesamiento de exportación de datos
  async processExportData(data, format = 'xlsx') {
    const processedData = data.map(item => {
      // Formatear fechas
      const processed = { ...item }
      if (processed.tiempo) {
        const date = new Date(processed.tiempo)
        processed.tiempo = this.formatDate(date)
      }
      return processed
    })

    return {
      data: processedData,
      format,
      timestamp: new Date().toISOString(),
      recordCount: processedData.length
    }
  }

  // Análisis estadístico ultra rápido
  async analyzeData(data) {
    const analysis = {
      totalRecords: data.length,
      uniqueUsers: new Set(data.map(item => item.cedula)).size,
      dateRange: this.getDateRange(data),
      locationStats: this.getLocationStats(data),
      timePatterns: this.getTimePatterns(data),
      entryExitRatio: this.getEntryExitRatio(data)
    }

    return analysis
  }

  // Utilities optimizadas
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`
  }

  getDateRange(data) {
    if (data.length === 0) return null
    
    const dates = data.map(item => new Date(item.tiempo)).filter(date => !isNaN(date))
    if (dates.length === 0) return null

    return {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates))
    }
  }

  getLocationStats(data) {
    const locationCounts = {}
    data.forEach(item => {
      const location = item.lugar
      locationCounts[location] = (locationCounts[location] || 0) + 1
    })

    return Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [location, count]) => {
        acc[location] = count
        return acc
      }, {})
  }

  getTimePatterns(data) {
    const hourCounts = new Array(24).fill(0)
    const dayOfWeekCounts = new Array(7).fill(0)

    data.forEach(item => {
      const date = new Date(item.tiempo)
      if (!isNaN(date)) {
        hourCounts[date.getHours()]++
        dayOfWeekCounts[date.getDay()]++
      }
    })

    return {
      byHour: hourCounts,
      byDayOfWeek: dayOfWeekCounts,
      peakHour: hourCounts.indexOf(Math.max(...hourCounts)),
      peakDay: dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))
    }
  }

  getEntryExitRatio(data) {
    const entryCounts = {}
    const exitCounts = {}

    data.forEach(item => {
      const type = item.opcion
      if (type === 'Entrada') {
        entryCounts[item.cedula] = (entryCounts[item.cedula] || 0) + 1
      } else if (type === 'Salida') {
        exitCounts[item.cedula] = (exitCounts[item.cedula] || 0) + 1
      }
    })

    const totalEntries = Object.values(entryCounts).reduce((sum, count) => sum + count, 0)
    const totalExits = Object.values(exitCounts).reduce((sum, count) => sum + count, 0)

    return {
      entries: totalEntries,
      exits: totalExits,
      ratio: totalExits > 0 ? totalEntries / totalExits : 0,
      uniqueEntryUsers: Object.keys(entryCounts).length,
      uniqueExitUsers: Object.keys(exitCounts).length
    }
  }

  // Limpiar cache manualmente
  clearCache() {
    this.cache.clear()
  }
}

// Instancia del procesador
const processor = new DataProcessor()

// Listener para mensajes del hilo principal
self.onmessage = async function(e) {
  const { id, type, payload } = e.data
  
  try {
    let result

    switch (type) {
      case 'FILTER_DATA':
        result = await processor.filterData(
          payload.data, 
          payload.filters, 
          payload.searchTerm
        )
        break

      case 'PROCESS_EXPORT':
        result = await processor.processExportData(
          payload.data, 
          payload.format
        )
        break

      case 'ANALYZE_DATA':
        result = await processor.analyzeData(payload.data)
        break

      case 'CLEAR_CACHE':
        processor.clearCache()
        result = { success: true }
        break

      default:
        throw new Error(`Tipo de operación no soportado: ${type}`)
    }

    // Enviar resultado de vuelta
    self.postMessage({
      id,
      type: 'SUCCESS',
      result
    })

  } catch (error) {
    // Enviar error de vuelta
    self.postMessage({
      id,
      type: 'ERROR',
      error: {
        message: error.message,
        stack: error.stack
      }
    })
  }
}

// Reportar que el worker está listo
self.postMessage({
  type: 'WORKER_READY',
  message: 'Data Worker está listo para procesar datos ultra rápido!'
}) 