import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../lib/api'

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (cedula, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(cedula)
      return response
    } catch (error) {
      return rejectWithValue(error.message || 'No se pudo conectar con el servidor.')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ fullName, cedula }, { rejectWithValue }) => {
    try {
      const response = await apiClient.createAuxiliar({
        nombre: fullName,
        cedula: cedula
      })
      
      if (response.success) {
        // Después de registrar, hacer login automáticamente
        const loginResponse = await apiClient.login(cedula)
        return loginResponse
      } else {
        return rejectWithValue(response.message || 'Error al registrar usuario')
      }
    } catch (error) {
      return rejectWithValue(error.message || 'No se pudo completar el registro. Por favor, inténtelo de nuevo.')
    }
  }
)

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (!token || !user) {
        throw new Error('No hay sesión activa')
      }

      // Verificar que el token sea válido haciendo una petición al backend
      await apiClient.healthCheck()
      
      return {
        token,
        user: JSON.parse(user)
      }
    } catch (error) {
      return rejectWithValue('Sesión expirada')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    cedula: '',
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.cedula = ''
      state.token = null
      state.isAuthenticated = false
      apiClient.logout()
    },
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.cedula = action.payload
      state.isAuthenticated = true
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.cedula = action.payload.user.cedula
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.cedula = action.payload.user.cedula
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Verify token cases
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.cedula = action.payload.user.cedula
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(verifyToken.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.cedula = ''
        state.token = null
        state.isAuthenticated = false
        apiClient.logout()
      })
  },
})

export const { logout, clearError, setUser } = authSlice.actions
export default authSlice.reducer 