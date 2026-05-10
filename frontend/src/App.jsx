import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import Matchmaking from './pages/Matchmaking'
import Leaderboard from './pages/Leaderboard'
import History from './pages/History'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/game/:gameId" element={
                  <ProtectedRoute>
                    <Game />
                  </ProtectedRoute>
                } />
                <Route path="/matchmaking" element={
                  <ProtectedRoute>
                    <Matchmaking />
                  </ProtectedRoute>
                } />
                <Route path="/leaderboard" element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
