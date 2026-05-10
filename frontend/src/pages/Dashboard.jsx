import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsers, getAllGames } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const [users, setUsers] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    rank: 1200
  })
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login')
    }
  }, [isAuthenticated, loading, navigate])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!isAuthenticated) return
    
    try {
      const [usersRes, gamesRes] = await Promise.all([
        getAllUsers(),
        getAllGames()
      ])
      
      setUsers(usersRes.data)
      setGames(gamesRes.data)
      
      // Use user data from auth context if available, otherwise fetch from API
      if (user?.rank !== undefined) {
        setStats({
          totalGames: user.gamesPlayed || 0,
          wins: user.wins || 0,
          losses: user.losses || 0,
          rank: user.rank || 1200
        })
      } else {
        const currentUser = usersRes.data.find(u => u.email === user?.email)
        if (currentUser) {
          setStats({
            totalGames: currentUser.gamesPlayed || 0,
            wins: currentUser.wins || 0,
            losses: currentUser.losses || 0,
            rank: currentUser.rank || 1200
          })
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeGames = games.filter(game => game.status === 'ongoing')
  const onlineUsers = users.filter(u => u.status === 'online')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Welcome, {user?.username || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-slate-500">Ready to play some chess?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.rank}</div>
          <div className="text-slate-500 text-sm mt-1">Rank</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.totalGames}</div>
          <div className="text-slate-500 text-sm mt-1">Games Played</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.wins}</div>
          <div className="text-slate-500 text-sm mt-1">Wins</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{stats.losses}</div>
          <div className="text-slate-500 text-sm mt-1">Losses</div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button 
          onClick={() => navigate('/matchmaking')}
          className="btn-primary text-lg px-8 py-4"
        >
          Find Match
        </button>
        <button 
          onClick={() => navigate('/history')}
          className="btn-secondary text-lg px-8 py-4"
        >
          View History
        </button>
      </div>

      {activeGames.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Active Games</h2>
          <div className="space-y-3">
            {activeGames.slice(0, 5).map(game => (
              <div 
                key={game.game_id}
                onClick={() => navigate(`/game/${game.game_id}`)}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">vs</div>
                  <div>
                    <div className="text-slate-900 font-medium">
                      {game.whiteplayer} vs {game.blackplayer}
                    </div>
                    <div className="text-slate-500 text-sm">
                      Turn: {game.turn} • {game.moves?.length || 0} moves
                    </div>
                  </div>
                </div>
                <button className="btn-primary text-sm">Resume</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Online Players ({onlineUsers.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {onlineUsers.slice(0, 6).map(u => (
            <div key={u._id} className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-2 h-2 bg-accent-success rounded-full"></div>
              <div>
                <div className="text-slate-900 font-medium">{u.username}</div>
                <div className="text-slate-500 text-sm">Rank: {u.rank}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
