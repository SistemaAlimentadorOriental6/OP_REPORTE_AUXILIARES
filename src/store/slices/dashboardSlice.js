import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../lib/api'

// Async thunk para enviar registro
export const sendRecord = createAsyncThunk(
  'dashboard/sendRecord',
  async ({ cedula, registro, lugarIntegraciones, position }, { rejectWithValue }) => {
    try {
      const response = await apiClient.createRegistro({
        cedula,
        entradasalida: registro.toLowerCase(), // Cambiado de opcion a entradasalida
        lugar: lugarIntegraciones,
        latitud: position[0],
        longitud: position[1]
      })

      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Hubo un problema al enviar los datos')
    }
  }
)

// Async thunk para obtener estadísticas del dashboard
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getDashboardStats()
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Error al obtener estadísticas')
    }
  }
)

// Async thunk para obtener datos en tiempo real
export const fetchRealtimeData = createAsyncThunk(
  'dashboard/fetchRealtime',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getDashboardRealtime()
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Error al obtener datos en tiempo real')
    }
  }
)

// Async thunk para obtener alertas
export const fetchAlerts = createAsyncThunk(
  'dashboard/fetchAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getDashboardAlerts()
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Error al obtener alertas')
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    // Form data
    registro: '',
    lugarIntegraciones: '',
    position: null,
    
    // UI state
    isReporteModalOpen: false,
    isLugarModalOpen: false,
    isConfirmModalOpen: false,
    isMapModalOpen: false,
    isSuccessModalOpen: false,
    isErrorModalOpen: false,
    
    // Search and filters
    searchTerm: '',
    
    // Loading states
    isLoading: false,
    isUpdatingLocation: false,
    
    // Error handling
    error: null,
    
    // Dashboard data
    stats: null,
    realtimeData: null,
    alerts: [],
    
    // Constants
    lugaresIntegracion: [
      'Prado Occidente', 'Prado Oriente', 'Hospital Sur', 'Acevedo', 'La Y', 
      'Tricentenario', 'Hospital Norte', 'Exposiciones', 'La Uva', 'San Antonio', 
      'Universidad', 'Gardel', 'Alejandro - Oriente'
    ]
  },
  reducers: {
    // Form actions
    setRegistro: (state, action) => {
      state.registro = action.payload
    },
    setLugarIntegraciones: (state, action) => {
      state.lugarIntegraciones = action.payload
    },
    setPosition: (state, action) => {
      state.position = action.payload
    },
    
    // Modal actions
    setReporteModalOpen: (state, action) => {
      state.isReporteModalOpen = action.payload
    },
    setLugarModalOpen: (state, action) => {
      state.isLugarModalOpen = action.payload
    },
    setConfirmModalOpen: (state, action) => {
      state.isConfirmModalOpen = action.payload
    },
    setMapModalOpen: (state, action) => {
      state.isMapModalOpen = action.payload
    },
    setSuccessModalOpen: (state, action) => {
      state.isSuccessModalOpen = action.payload
    },
    setErrorModalOpen: (state, action) => {
      state.isErrorModalOpen = action.payload
    },
    
    // Search actions
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
    },
    
    // Loading actions
    setIsLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setIsUpdatingLocation: (state, action) => {
      state.isUpdatingLocation = action.payload
    },
    
    // Error actions
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    
    // Reset form
    resetForm: (state) => {
      state.registro = ''
      state.lugarIntegraciones = ''
      state.searchTerm = ''
    }
  },
  extraReducers: (builder) => {
    builder
      // Send record cases
      .addCase(sendRecord.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(sendRecord.fulfilled, (state) => {
        state.isLoading = false
        state.isSuccessModalOpen = true
        state.registro = ''
        state.lugarIntegraciones = ''
        state.error = null
      })
      .addCase(sendRecord.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isErrorModalOpen = true
      })
      // Dashboard stats cases
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.error = action.payload
      })
      // Realtime data cases
      .addCase(fetchRealtimeData.fulfilled, (state, action) => {
        state.realtimeData = action.payload
      })
      .addCase(fetchRealtimeData.rejected, (state, action) => {
        state.error = action.payload
      })
      // Alerts cases
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const {
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
  clearError,
  resetForm
} = dashboardSlice.actions

export default dashboardSlice.reducer 