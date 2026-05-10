import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    delete api.defaults.headers.common['Authorization']
  }, [])

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Validate token by fetching user data
      const response = await api.get('/users')
      const tokenData = JSON.parse(atob(token.split('.')[1]))
      const currentUser = response.data.find(u => u._id === tokenData.id || u.email === tokenData.email)
      
      if (currentUser) {
        setUser({ 
          id: currentUser._id, 
          email: currentUser.email,
          username: currentUser.username,
          rank: currentUser.rank,
          wins: currentUser.wins,
          losses: currentUser.losses,
          gamesPlayed: currentUser.gamesPlayed
        })
        setIsAuthenticated(true)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Auth error:', error)
      if (error.response?.status === 401) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Setup 401 interceptor
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
        }
        return Promise.reject(error)
      }
    )

    return () => {
      api.interceptors.response.eject(interceptor)
    }
  }, [logout])

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password })
      const { token: newToken } = response.data
      
      if (!newToken) {
        return { success: false, message: 'No token received from server' }
      }

      localStorage.setItem('token', newToken)
      setToken(newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      // Fetch user data immediately after login
      const tokenData = JSON.parse(atob(newToken.split('.')[1]))
      const usersRes = await api.get('/users')
      const currentUser = usersRes.data.find(u => u._id === tokenData.id || u.email === tokenData.email)
      
      if (currentUser) {
        setUser({ 
          id: currentUser._id, 
          email: currentUser.email,
          username: currentUser.username,
          rank: currentUser.rank,
          wins: currentUser.wins,
          losses: currentUser.losses,
          gamesPlayed: currentUser.gamesPlayed
        })
        setIsAuthenticated(true)
      }
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      return { success: false, message }
    }
  }

  const signup = async (username, email, password) => {
    try {
      const response = await api.post('/users/signup', { username, email, password })
      const { token: newToken } = response.data
      
      if (!newToken) {
        return { success: false, message: 'No token received from server' }
      }

      localStorage.setItem('token', newToken)
      setToken(newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      const tokenData = JSON.parse(atob(newToken.split('.')[1]))
      setUser({ 
        id: tokenData.id, 
        email: tokenData.email,
        username: username,
        rank: 1200,
        wins: 0,
        losses: 0,
        gamesPlayed: 0
      })
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Signup failed'
      return { success: false, message }
    }
  }

  const updateUserData = (newData) => {
    setUser(prev => prev ? { ...prev, ...newData } : null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading, isAuthenticated, updateUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
