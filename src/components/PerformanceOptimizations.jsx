import React, { memo, useMemo, useCallback, Suspense } from 'react'
import { motion } from 'framer-motion'

// Componente optimizado con React.memo
export const OptimizedButton = memo(({ onClick, children, loading, className, ...props }) => {
  const handleClick = useCallback((e) => {
    if (!loading) {
      onClick?.(e)
    }
  }, [onClick, loading])

  return (
    <motion.button
      onClick={handleClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
        loading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
      } ${className || ''}`}
      whileHover={!loading ? { scale: 1.05 } : {}}
      whileTap={!loading ? { scale: 0.95 } : {}}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Cargando...
        </div>
      ) : (
        children
      )}
    </motion.button>
  )
})

OptimizedButton.displayName = 'OptimizedButton'

// Modal optimizado con lazy loading
export const OptimizedModal = memo(({ isOpen, onClose, children, title }) => {
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-2xl font-bold text-emerald-800 mb-4">{title}</h2>
        )}
        <Suspense fallback={<div className="animate-pulse">Cargando...</div>}>
          {children}
        </Suspense>
      </motion.div>
    </div>
  )
})

OptimizedModal.displayName = 'OptimizedModal'

// Input optimizado con debounce
export const OptimizedInput = memo(({ value, onChange, debounceMs = 300, ...props }) => {
  const [localValue, setLocalValue] = React.useState(value)
  const timeoutRef = React.useRef()

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback((e) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange?.(e)
    }, debounceMs)
  }, [onChange, debounceMs])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      className={`w-full px-4 py-2 rounded-lg border border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 ${props.className || ''}`}
    />
  )
})

OptimizedInput.displayName = 'OptimizedInput'

// Lista virtualizada simple
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 50, 
  maxHeight = 400,
  className = '' 
}) => {
  const [scrollTop, setScrollTop] = React.useState(0)
  const [containerHeight, setContainerHeight] = React.useState(maxHeight)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }))
  }, [items, scrollTop, containerHeight, itemHeight])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ height: Math.min(maxHeight, items.length * itemHeight) }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
})

VirtualizedList.displayName = 'VirtualizedList'

// Hook para optimización de rendimiento
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    renderCount: 0,
    lastRenderTime: 0
  })

  React.useEffect(() => {
    const startTime = performance.now()
    
    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: startTime
    }))
    
    return () => {
      const endTime = performance.now()
      if (process.env.NODE_ENV === 'development') {
        console.log(`Render time: ${endTime - startTime}ms`)
      }
    }
  })

  return metrics
}

// Componente para medir rendimiento
export const PerformanceMonitor = memo(({ children }) => {
  const metrics = usePerformanceMonitor()
  
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          Renders: {metrics.renderCount}
        </div>
      )}
    </>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor' 