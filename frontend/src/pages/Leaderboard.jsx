import { useState, useEffect } from 'react'
import { getAllUsers } from '../services/api'

const Leaderboard = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('rank')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers()
      const sortedUsers = response.data.sort((a, b) => b.rank - a.rank)
      setUsers(sortedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'rank') return b.rank - a.rank
    if (sortBy === 'wins') return b.wins - a.wins
    if (sortBy === 'gamesPlayed') return b.gamesPlayed - a.gamesPlayed
    return 0
  })

  const getRankColor = (index) => {
    if (index === 0) return 'text-yellow-400'
    if (index === 1) return 'text-gray-300'
    if (index === 2) return 'text-amber-600'
    return 'text-gray-400'
  }

  const getRankIcon = (index) => {
    if (index === 0) return '👑'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}.`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Leaderboard</h1>
        <p className="text-slate-500">Top chess players ranked by performance</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Top Players</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setSortBy('rank')}
              className={`px-3 py-1 rounded text-sm ${sortBy === 'rank' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Rank
            </button>
            <button 
              onClick={() => setSortBy('wins')}
              className={`px-3 py-1 rounded text-sm ${sortBy === 'wins' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Wins
            </button>
            <button 
              onClick={() => setSortBy('gamesPlayed')}
              className={`px-3 py-1 rounded text-sm ${sortBy === 'gamesPlayed' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Games
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {sortedUsers.map((user, index) => (
            <div 
              key={user._id}
              className={`flex items-center p-4 rounded-lg border ${
                index < 3 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={`text-2xl font-bold w-16 ${getRankColor(index)}`}>
                {getRankIcon(index)}
              </div>
              
              <div className="flex-1">
                <div className="text-slate-900 font-medium text-lg">{user.username}</div>
                <div className="text-slate-500 text-sm">
                  {user.gamesPlayed} games • {user.wins}W - {user.losses}L
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{user.rank}</div>
                <div className="text-slate-500 text-sm">Rating</div>
              </div>

              <div className="ml-6">
                <div className={`w-3 h-3 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              </div>
            </div>
          ))}
        </div>

        {sortedUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No players found</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{users.length}</div>
          <div className="text-slate-500 mt-1">Total Players</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">
            {users.filter(u => u.status === 'online').length}
          </div>
          <div className="text-slate-500 mt-1">Online Now</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-indigo-600">
            {Math.round(users.reduce((sum, u) => sum + u.rank, 0) / (users.length || 1))}
          </div>
          <div className="text-slate-500 mt-1">Average Rating</div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
