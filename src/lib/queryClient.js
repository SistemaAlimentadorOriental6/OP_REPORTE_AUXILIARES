import { QueryClient } from '@tanstack/react-query'

// Configuración ultra optimizada para máximo rendimiento
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 10 minutos - super rápido
      staleTime: 10 * 60 * 1000,
      // Datos válidos por 15 minutos
      cacheTime: 15 * 60 * 1000,
      // Refetch automático cuando vuelve el foco
      refetchOnWindowFocus: true,
      // Reintentos automáticos inteligentes
      retry: (failureCount, error) => {
        if (error.status === 404) return false
        return failureCount < 3
      },
      // Delay exponencial para reintentos
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Prefetch en background para máxima velocidad
      refetchOnMount: 'always',
      // Deduplicación automática de requests
      refetchInterval: false,
      // Optimización de red
      networkMode: 'online',
    },
    mutations: {
      // Reintentos para mutations críticas
      retry: 1,
      // Network mode optimizado
      networkMode: 'online',
    },
  },
})

// Configuraciones de cache avanzadas para diferentes tipos de datos
export const queryKeys = {
  // Keys organizadas para cache inteligente
  auth: ['auth'],
  user: (id) => ['user', id],
  registros: ['registros'],
  filteredRegistros: (filters) => ['registros', 'filtered', filters],
  dashboard: ['dashboard'],
  locations: ['locations'],
}

// Funciones de prefetch para máximo rendimiento
export const prefetchQueries = {
  // Prefetch datos críticos
  prefetchUserData: async (userId) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.user(userId),
      queryFn: () => Promise.resolve({ id: userId }), // Placeholder
      staleTime: 5 * 60 * 1000, // 5 minutos
    })
  },
  
  // Prefetch datos del dashboard
  prefetchDashboardData: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard,
      queryFn: () => Promise.resolve({}), // Placeholder
      staleTime: 2 * 60 * 1000, // 2 minutos para datos críticos
    })
  },
}

// Utilidades para optimización de cache
export const cacheUtils = {
  // Invalidar cache inteligentemente
  invalidateAuth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth }),
  invalidateRegistros: () => queryClient.invalidateQueries({ queryKey: queryKeys.registros }),
  
  // Optimistic updates para UI súper rápida
  updateRegistroOptimistic: (newData) => {
    queryClient.setQueryData(queryKeys.registros, (old) => {
      if (!old) return [newData]
      return [newData, ...old]
    })
  },
  
  // Prefetch inteligente basado en navegación
  prefetchOnHover: (key, fetcher) => {
    queryClient.prefetchQuery({ queryKey: key, queryFn: fetcher })
  },
} 