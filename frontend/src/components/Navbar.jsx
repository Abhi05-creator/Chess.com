import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { connected, reconnecting } = useSocket()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  if (!isAuthenticated || !user) return null

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">♟️</span>
            <span className="text-xl font-bold text-slate-900">Chess Master</span>
          </Link>
          <div className="flex items-center space-x-1 md:space-x-3">
            {/* User info */}
            <div className="hidden lg:flex items-center space-x-1 mr-2 text-sm">
              <span className="text-slate-600">
                {user?.username || user?.email?.split('@')[0]}
              </span>
              <span className="text-blue-600 font-bold">
                [{user?.rank || 1200}]
              </span>
            </div>

            {/* Connection status */}
            <div className="flex items-center mr-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>

            <Link 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'nav-link-active' : 'nav-link'}
            >
              Dashboard
            </Link>
            <Link 
              to="/matchmaking" 
              className={isActive('/matchmaking') ? 'nav-link-active' : 'nav-link'}
            >
              Play
            </Link>
            <Link 
              to="/leaderboard" 
              className={isActive('/leaderboard') ? 'nav-link-active' : 'nav-link'}
            >
              Leaderboard
            </Link>
            <Link 
              to="/history" 
              className={isActive('/history') ? 'nav-link-active' : 'nav-link'}
            >
              History
            </Link>

            <button 
              onClick={handleLogout}
              className="btn-danger text-sm py-2 px-3"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
