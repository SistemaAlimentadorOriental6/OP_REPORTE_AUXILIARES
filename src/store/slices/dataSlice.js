import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../lib/api'

// Async thunk para obtener registros
export const fetchRegistros = createAsyncThunk(
  'data/fetchRegistros',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.getRegistros(params)
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Error al obtener registros')
    }
  }
)

// Async thunk para obtener auxiliares
export const fetchAuxiliares = createAsyncThunk(
  'data/fetchAuxiliares',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getAuxiliares()
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Error al obtener auxiliares')
    }
  }
)

// Async thunk para exportar datos
export const exportData = createAsyncThunk(
  'data/exportData',
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      const response = await apiClient.exportData(format, filters)
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Error al exportar datos')
    }
  }
)

// Async thunk para eliminar registro
export const deleteRegistro = createAsyncThunk(
  'data/deleteRegistro',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.deleteRegistro(id)
      return id
    } catch (error) {
      return rejectWithValue(error.message || 'Error al eliminar registro')
    }
  }
)

// Async thunk para actualizar registro
export const updateRegistro = createAsyncThunk(
  'data/updateRegistro',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.updateRegistro(id, data)
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'Error al actualizar registro')
    }
  }
)

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    registros: [],
    auxiliares: [],
    filteredRegistros: [],
    filters: {},
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    searchTerm: '',
    isLoading: false,
    isExporting: false,
    error: null,
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.currentPage = 1
    },
    clearFilters: (state) => {
      state.filters = {}
      state.searchTerm = ''
      state.currentPage = 1
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload
      state.currentPage = 1
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    setItemsPerPage: (state, action) => {
      state.itemsPerPage = action.payload
      state.currentPage = 1
    },
    applyFilters: (state) => {
      let filtered = [...state.registros]
      
      // Apply column filters
      Object.entries(state.filters).forEach(([key, value]) => {
        if (value) {
          filtered = filtered.filter(registro => 
            String(registro[key]).toLowerCase().includes(String(value).toLowerCase())
          )
        }
      })
      
      // Apply search term
      if (state.searchTerm) {
        filtered = filtered.filter(registro =>
          Object.values(registro).some(val =>
            String(val).toLowerCase().includes(state.searchTerm.toLowerCase())
          )
        )
      }
      
      state.filteredRegistros = filtered
      state.totalItems = filtered.length
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch registros cases
      .addCase(fetchRegistros.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRegistros.fulfilled, (state, action) => {
        state.isLoading = false
        const registrosData = action.payload.data || action.payload || []
        state.registros = Array.isArray(registrosData) ? registrosData : []
        state.totalItems = action.payload.pagination?.total_items || registrosData.length
        state.filteredRegistros = Array.isArray(registrosData) ? registrosData : []
        state.error = null
      })
      .addCase(fetchRegistros.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Fetch auxiliares cases
      .addCase(fetchAuxiliares.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAuxiliares.fulfilled, (state, action) => {
        state.isLoading = false
        state.auxiliares = action.payload.auxiliares || action.payload
        state.error = null
      })
      .addCase(fetchAuxiliares.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Export data cases
      .addCase(exportData.pending, (state) => {
        state.isExporting = true
        state.error = null
      })
      .addCase(exportData.fulfilled, (state) => {
        state.isExporting = false
        state.error = null
      })
      .addCase(exportData.rejected, (state, action) => {
        state.isExporting = false
        state.error = action.payload
      })
      // Delete registro cases
      .addCase(deleteRegistro.fulfilled, (state, action) => {
        state.registros = state.registros.filter(registro => registro.id !== action.payload)
        state.filteredRegistros = state.filteredRegistros.filter(registro => registro.id !== action.payload)
        state.totalItems = state.totalItems - 1
      })
      .addCase(deleteRegistro.rejected, (state, action) => {
        state.error = action.payload
      })
      // Update registro cases
      .addCase(updateRegistro.fulfilled, (state, action) => {
        const index = state.registros.findIndex(registro => registro.id === action.payload.id)
        if (index !== -1) {
          state.registros[index] = action.payload
        }
        const filteredIndex = state.filteredRegistros.findIndex(registro => registro.id === action.payload.id)
        if (filteredIndex !== -1) {
          state.filteredRegistros[filteredIndex] = action.payload
        }
      })
      .addCase(updateRegistro.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const {
  setFilters,
  clearFilters,
  setSearchTerm,
  setCurrentPage,
  setItemsPerPage,
  applyFilters,
  clearError
} = dataSlice.actions

export default dataSlice.reducer 