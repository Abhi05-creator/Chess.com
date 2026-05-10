import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const { token, isAuthenticated } = useAuth()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = useRef(1000)

  const connectSocket = useCallback(() => {
    if (!token || !isAuthenticated) {
      console.log('No token or not authenticated, skipping socket connection')
      return null
    }

    console.log('Connecting socket...')
    // No URL needed - it will automatically connect to the domain serving the page!
    const newSocket = io({
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    })

    newSocket.on('connect', () => {
      console.log('Socket connected successfully')
      setConnected(true)
      setReconnecting(false)
      reconnectAttempts.current = 0
      reconnectDelay.current = 1000
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try reconnecting
        setReconnecting(true)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
      setConnected(false)
      
      reconnectAttempts.current++
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached')
        setReconnecting(false)
        newSocket.disconnect()
      } else {
        setReconnecting(true)
        // Exponential backoff
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 5000)
      }
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      setConnected(true)
      setReconnecting(false)
      reconnectAttempts.current = 0
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt', attemptNumber)
      setReconnecting(true)
    })

    newSocket.on('reconnect_failed', () => {
      console.log('Socket reconnection failed')
      setReconnecting(false)
      setConnected(false)
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return newSocket
  }, [token, isAuthenticated])

  useEffect(() => {
    if (!token || !isAuthenticated) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const newSocket = connectSocket()
    if (newSocket) {
      setSocket(newSocket)
    }

    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection')
        newSocket.disconnect()
      }
    }
  }, [token, isAuthenticated, connectSocket])

  const joinGame = useCallback((gameId) => {
    if (socket && connected && gameId) {
      console.log('Joining game:', gameId)
      socket.emit('joinGame', String(gameId))
    } else {
      console.warn('Cannot join game - socket not connected')
    }
  }, [socket, connected])

  const sendMove = useCallback((gameId, move) => {
    if (socket && connected && gameId && move) {
      console.log('Sending move:', move, 'to game:', gameId)
      socket.emit('move', String(gameId), move)
      return true
    } else {
      console.warn('Cannot send move - socket not connected')
      return false
    }
  }, [socket, connected])

  const onOpponentMove = useCallback((callback) => {
    if (socket) {
      socket.on('opponentMove', callback)
      return () => socket.off('opponentMove', callback)
    }
    return () => {}
  }, [socket])

  const onOpponentLeft = useCallback((callback) => {
    if (socket) {
      socket.on('opponentLeft', callback)
      return () => socket.off('opponentLeft', callback)
    }
    return () => {}
  }, [socket])

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
    }
    reconnectAttempts.current = 0
    const newSocket = connectSocket()
    if (newSocket) {
      setSocket(newSocket)
    }
  }, [socket, connectSocket])

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected, 
      reconnecting,
      joinGame, 
      sendMove, 
      onOpponentMove, 
      onOpponentLeft,
      reconnect
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
