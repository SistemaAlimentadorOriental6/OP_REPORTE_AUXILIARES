import React, { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import { queryKeys, cacheUtils } from '../lib/queryClient'
import axios from 'axios'

// Hook ultra optimizado para autenticación
export const useOptimizedAuth = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  
  // Combinar Redux con React Query para máximo rendimiento
  const authState = useSelector(state => state.auth)
  
  // Mutation optimizada para login
  const loginMutation = useMutation({
    mutationFn: async (cedula) => {
      const response = await axios.post('http://127.0.0.1:10000/verificar-cedula', { cedula })
      return response.data
    },
    onSuccess: (data, variables) => {
      // Actualización optimista ultra rápida
      queryClient.setQueryData(queryKeys.auth, data)
      // Prefetch datos relacionados automáticamente
      cacheUtils.prefetchOnHover(queryKeys.user(variables), () => Promise.resolve({ id: variables }))
    },
    onError: (error) => {
      console.error('Login error:', error)
    },
    // Configuración de performance
    retry: 2,
    retryDelay: 1000,
  })

  // Mutation optimizada para registro
  const registerMutation = useMutation({
    mutationFn: async ({ fullName, cedula }) => {
      const response = await axios.post('http://127.0.0.1:10000/guardar-nuevo-registro', {
        nombre: fullName,
        cedula: cedula
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth, data)
      // Invalidar y refetch datos relacionados
      cacheUtils.invalidateAuth()
    },
    retry: 2,
  })

  return {
    ...authState,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }
}

// Hook súper optimizado para registros con cache inteligente
export const useOptimizedRegistros = (filters = {}) => {
  const queryClient = useQueryClient()
  
  // Query con cache inteligente y prefetch automático
  const registrosQuery = useQuery({
    queryKey: queryKeys.filteredRegistros(filters),
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:10000/obtener-registros')
      if (!response.ok) throw new Error('Network response was not ok')
      return response.json()
    },
    // Configuración ultra optimizada
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh cada 2 minutos
    // Optimización de red
    networkMode: 'online',
    // Prefetch automático cuando está cerca de usarse
    refetchOnMount: true,
  })

  // Mutation optimizada para crear registros
  const createRegistroMutation = useMutation({
    mutationFn: async (newRegistro) => {
      const response = await axios.post('http://127.0.0.1:10000/guardar-registro', newRegistro)
      return response.data
    },
    onMutate: async (newRegistro) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: queryKeys.registros })
      
      // Snapshot del estado anterior para rollback
      const previousRegistros = queryClient.getQueryData(queryKeys.registros)
      
      // Optimistic update - UI súper rápida
      cacheUtils.updateRegistroOptimistic(newRegistro)
      
      return { previousRegistros }
    },
    onError: (error, newRegistro, context) => {
      // Rollback en caso de error
      if (context?.previousRegistros) {
        queryClient.setQueryData(queryKeys.registros, context.previousRegistros)
      }
    },
    onSettled: () => {
      // Invalidar para refetch real
      cacheUtils.invalidateRegistros()
    },
  })

  return {
    data: registrosQuery.data || [],
    isLoading: registrosQuery.isLoading,
    isError: registrosQuery.isError,
    error: registrosQuery.error,
    refetch: registrosQuery.refetch,
    createRegistro: createRegistroMutation.mutate,
    isCreating: createRegistroMutation.isPending,
    createError: createRegistroMutation.error,
  }
}

// Hook optimizado para dashboard con prefetch inteligente
export const useOptimizedDashboard = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  
  const dashboardState = useSelector(state => state.dashboard)
  
  // Prefetch automático de datos relacionados
  const prefetchRelatedData = async () => {
    // Prefetch ubicaciones cuando se abre el modal de lugares
    if (dashboardState.isLugarModalOpen) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.locations,
        queryFn: () => Promise.resolve([]), // Placeholder
        staleTime: 30 * 60 * 1000, // 30 minutos para datos estáticos
      })
    }
  }

  // Auto-prefetch basado en estado
  useEffect(() => {
    prefetchRelatedData()
  }, [dashboardState.isLugarModalOpen])

  return {
    ...dashboardState,
    dispatch,
    prefetchRelatedData,
  }
}

// Hook para geolocalización optimizada con cache
export const useOptimizedGeolocation = () => {
  const queryClient = useQueryClient()
  
  const geolocationQuery = useQuery({
    queryKey: ['geolocation'],
    queryFn: () => new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'))
        return
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          resolve([latitude, longitude])
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000, // Cache por 5 minutos
        }
      )
    }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    retry: 3,
    retryDelay: 1000,
  })

  const updateLocation = () => {
    queryClient.invalidateQueries({ queryKey: ['geolocation'] })
    return geolocationQuery.refetch()
  }

  return {
    position: geolocationQuery.data,
    isLoading: geolocationQuery.isLoading,
    isError: geolocationQuery.isError,
    error: geolocationQuery.error,
    updateLocation,
  }
}

// Utilidades adicionales para máximo rendimiento
export const usePerformanceOptimization = () => {
  const queryClient = useQueryClient()
  
  // Función para limpiar cache no utilizado
  const cleanUnusedCache = () => {
    queryClient.removeQueries({
      predicate: (query) => {
        return query.getObserversCount() === 0
      }
    })
  }

  // Prefetch inteligente basado en patrones de usuario
  const smartPrefetch = (userBehavior) => {
    if (userBehavior.frequentlyVisitsDatos) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.registros,
        queryFn: () => Promise.resolve([]), // Placeholder
      })
    }
  }

  return {
    cleanUnusedCache,
    smartPrefetch,
    queryClient,
  }
} 