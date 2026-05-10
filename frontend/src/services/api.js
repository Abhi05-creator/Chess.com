import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const normalizedApiUrl = API_URL.endsWith('/') ? API_URL : `${API_URL}/`

const api = axios.create({
  baseURL: normalizedApiUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
})

// Request interceptor - add token and log requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`API ${config.method?.toUpperCase()}: ${config.url}`, config.data)
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error
    
    if (response) {
      // Handle specific error codes
      switch (response.status) {
        case 401:
          console.error('Authentication error - logging out')
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('Forbidden - insufficient permissions')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Server error')
          break
        default:
          console.error(`API Error ${response.status}:`, response.data)
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - no response received')
    } else {
      console.error('Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Auth APIs
export const login = (email, password) => api.post('users/login', { email, password })
export const signup = (username, email, password) => api.post('users/signup', { username, email, password })

// User APIs
export const getAllUsers = () => api.get('users')
export const getUserById = (id) => api.get(`users/${id}`)
export const findMatch = () => api.post('users/match/find')

// Game APIs
export const getAllGames = () => api.get('chess')
export const getGame = (id) => api.get(`chess/${id}`)
export const createGame = (data) => api.post('chess', data)
export const makeMove = (id, move) => api.patch(`chess/${id}`, { move })
export const exitGame = (gameId) => api.post('chess/exit', { gameId })
export const deleteGame = (id) => api.delete(`chess/${id}`)

// Retry wrapper for failed requests
export const withRetry = async (apiCall, maxRetries = 3) => {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      
      // Don't retry on 4xx errors (client errors)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }
  
  throw lastError
}

export default api
