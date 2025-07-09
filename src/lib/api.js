import { getDeviceInfo } from './utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('token')
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // Métodos de autenticación
  async login(cedula) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: { cedula }
    })
    
    if (response.token) {
      this.token = response.token
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    
    return response
  }

  logout() {
    this.token = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Métodos de auxiliares
  async getAuxiliares() {
    return this.request('/api/auxiliares')
  }

  async getAuxiliar(cedula) {
    return this.request(`/api/auxiliares/${cedula}`)
  }

  async createAuxiliar(data) {
    return this.request('/api/auxiliares', {
      method: 'POST',
      body: data
    })
  }

  async updateAuxiliar(cedula, data) {
    return this.request(`/api/auxiliares/${cedula}`, {
      method: 'PUT',
      body: data
    })
  }

  async deleteAuxiliar(cedula) {
    return this.request(`/api/auxiliares/${cedula}`, {
      method: 'DELETE'
    })
  }

  // Métodos de registros
  async getRegistros(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/api/registros${queryString ? `?${queryString}` : ''}`
    return this.request(endpoint)
  }

  async createRegistro(data) {
    // Obtener información del dispositivo
    const deviceInfo = await getDeviceInfo();
    
    // Combinar datos del registro con información del dispositivo
    const registroData = {
      ...data,
      ...deviceInfo
    };

    return this.request('/api/registros', {
      method: 'POST',
      body: registroData
    });
  }

  async updateRegistro(id, data) {
    return this.request(`/api/registros/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async deleteRegistro(id) {
    return this.request(`/api/registros/${id}`, {
      method: 'DELETE'
    })
  }

  // Métodos de dashboard
  async getDashboardStats() {
    return this.request('/api/dashboard/stats')
  }

  async getDashboardRealtime() {
    return this.request('/api/dashboard/realtime')
  }

  async getDashboardHeatmap() {
    return this.request('/api/dashboard/heatmap')
  }

  async getDashboardAlerts() {
    return this.request('/api/dashboard/alerts')
  }

  async exportData(format = 'csv', filters = {}) {
    const params = new URLSearchParams({ format, ...filters })
    return this.request(`/api/dashboard/export?${params}`)
  }

  // Método para obtener datos del mapa por fecha
  async getMapData(fecha) {
    return this.request(`/api/registros/mapa?fecha=${fecha}`)
  }

  // Método para verificar salud del servidor
  async healthCheck() {
    return this.request('/api/health')
  }

  // Método para obtener el historial de ubicaciones de un empleado
  async getEmployeeHistory(cedula, days = 7) {
    return this.request(`/api/registros/historial/${cedula}?days=${days}`);
  }
}

// Instancia singleton
const apiClient = new ApiClient()

export default apiClient

// Exportar métodos individuales para compatibilidad
export const {
  login,
  logout,
  getAuxiliares,
  getAuxiliar,
  createAuxiliar,
  updateAuxiliar,
  deleteAuxiliar,
  getRegistros,
  createRegistro,
  updateRegistro,
  deleteRegistro,
  getDashboardStats,
  getDashboardRealtime,
  getDashboardHeatmap,
  getDashboardAlerts,
  exportData,
  getMapData,
  healthCheck,
  getEmployeeHistory
} = apiClient 