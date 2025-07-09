import { useRef, useCallback, useEffect } from 'react'

// Hook ultra potente para Web Workers
export const useWebWorker = (workerUrl = '/dataWorker.js') => {
  const workerRef = useRef(null)
  const pendingRequests = useRef(new Map())
  const requestIdCounter = useRef(0)

  // Inicializar worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(workerUrl)
        
        // Listener para respuestas del worker
        workerRef.current.onmessage = (e) => {
          const { id, type, result, error } = e.data
          
          if (type === 'WORKER_READY') {
            console.log('🚀 Web Worker está listo para máximo rendimiento!')
            return
          }
          
          const pending = pendingRequests.current.get(id)
          if (pending) {
            pendingRequests.current.delete(id)
            
            if (type === 'SUCCESS') {
              pending.resolve(result)
            } else if (type === 'ERROR') {
              pending.reject(new Error(error.message))
            }
          }
        }
        
        // Manejo de errores
        workerRef.current.onerror = (error) => {
          console.error('Error en Web Worker:', error)
        }
        
      } catch (error) {
        console.error('Error creando Web Worker:', error)
      }
    }
    
    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      pendingRequests.current.clear()
    }
  }, [workerUrl])

  // Función para enviar mensajes al worker
  const postMessage = useCallback((type, payload) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Web Worker no está disponible'))
        return
      }
      
      const id = ++requestIdCounter.current
      
      // Guardar la promesa pendiente
      pendingRequests.current.set(id, { resolve, reject })
      
      // Enviar mensaje al worker
      workerRef.current.postMessage({
        id,
        type,
        payload
      })
      
      // Timeout para evitar promesas colgadas
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id)
          reject(new Error('Timeout en Web Worker'))
        }
      }, 30000) // 30 segundos timeout
    })
  }, [])

  // Funciones específicas ultra optimizadas
  const filterData = useCallback(async (data, filters = {}, searchTerm = '') => {
    return postMessage('FILTER_DATA', { data, filters, searchTerm })
  }, [postMessage])

  const processExport = useCallback(async (data, format = 'xlsx') => {
    return postMessage('PROCESS_EXPORT', { data, format })
  }, [postMessage])

  const analyzeData = useCallback(async (data) => {
    return postMessage('ANALYZE_DATA', { data })
  }, [postMessage])

  const clearCache = useCallback(async () => {
    return postMessage('CLEAR_CACHE', {})
  }, [postMessage])

  // Verificar si el worker está disponible
  const isWorkerAvailable = useCallback(() => {
    return !!workerRef.current && typeof Worker !== 'undefined'
  }, [])

  return {
    filterData,
    processExport,
    analyzeData,
    clearCache,
    isWorkerAvailable,
    postMessage
  }
}

// Hook especializado para datos de tabla con cache inteligente
export const useDataProcessor = () => {
  const { filterData, processExport, analyzeData, isWorkerAvailable } = useWebWorker()
  
  // Cache local para resultados frecuentes
  const cacheRef = useRef(new Map())
  
  // Función de filtrado ultra optimizada con cache
  const optimizedFilter = useCallback(async (data, filters, searchTerm) => {
    const cacheKey = JSON.stringify({ filters, searchTerm, dataLength: data.length })
    
    // Verificar cache local primero
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)
    }
    
    let result
    
    // Usar Web Worker si está disponible, sino procesar en hilo principal
    if (isWorkerAvailable()) {
      result = await filterData(data, filters, searchTerm)
    } else {
      // Fallback para procesamiento en hilo principal
      result = data.filter(item => {
        // Aplicar filtros
        const matchesFilters = Object.entries(filters).every(([key, value]) => {
          if (!value) return true
          return String(item[key]).toLowerCase().includes(String(value).toLowerCase())
        })
        
        // Aplicar búsqueda
        const matchesSearch = !searchTerm || Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
        
        return matchesFilters && matchesSearch
      })
    }
    
    // Guardar en cache
    cacheRef.current.set(cacheKey, result)
    
    // Limpiar cache si está muy grande
    if (cacheRef.current.size > 50) {
      const oldestKey = cacheRef.current.keys().next().value
      cacheRef.current.delete(oldestKey)
    }
    
    return result
  }, [filterData, isWorkerAvailable])

  // Función de exportación optimizada
  const optimizedExport = useCallback(async (data, format = 'xlsx') => {
    if (isWorkerAvailable()) {
      return processExport(data, format)
    } else {
      // Fallback simple
      return {
        data,
        format,
        timestamp: new Date().toISOString(),
        recordCount: data.length
      }
    }
  }, [processExport, isWorkerAvailable])

  // Análisis de datos optimizado
  const optimizedAnalyze = useCallback(async (data) => {
    if (isWorkerAvailable()) {
      return analyzeData(data)
    } else {
      // Análisis básico como fallback
      return {
        totalRecords: data.length,
        uniqueUsers: new Set(data.map(item => item.cedula)).size,
        lastUpdate: new Date().toISOString()
      }
    }
  }, [analyzeData, isWorkerAvailable])

  // Limpiar cache manual
  const clearLocalCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  return {
    filterData: optimizedFilter,
    exportData: optimizedExport,
    analyzeData: optimizedAnalyze,
    clearCache: clearLocalCache,
    isWorkerSupported: isWorkerAvailable()
  }
}

// Hook para métricas de rendimiento
export const usePerformanceMetrics = () => {
  const metricsRef = useRef({
    filterOperations: 0,
    exportOperations: 0,
    averageFilterTime: 0,
    averageExportTime: 0
  })

  const recordFilterTime = useCallback((timeMs) => {
    const metrics = metricsRef.current
    metrics.filterOperations++
    metrics.averageFilterTime = 
      (metrics.averageFilterTime * (metrics.filterOperations - 1) + timeMs) / metrics.filterOperations
  }, [])

  const recordExportTime = useCallback((timeMs) => {
    const metrics = metricsRef.current
    metrics.exportOperations++
    metrics.averageExportTime = 
      (metrics.averageExportTime * (metrics.exportOperations - 1) + timeMs) / metrics.exportOperations
  }, [])

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current }
  }, [])

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      filterOperations: 0,
      exportOperations: 0,
      averageFilterTime: 0,
      averageExportTime: 0
    }
  }, [])

  return {
    recordFilterTime,
    recordExportTime,
    getMetrics,
    resetMetrics
  }
} 