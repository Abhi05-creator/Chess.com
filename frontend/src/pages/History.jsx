import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllGames, getAllUsers } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const History = () => {
  const [games, setGames] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [gamesRes, usersRes] = await Promise.all([
        getAllGames(),
        getAllUsers()
      ])
      setGames(gamesRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const myGames = games.filter(game => 
    game.whiteplayer === user?.username || game.blackplayer === user?.username
  )

  const filteredGames = myGames.filter(game => {
    if (filter === 'all') return true
    if (filter === 'ongoing') return game.status === 'ongoing'
    if (filter === 'finished') return game.status === 'finished'
    const userColor = game.whiteplayer === user?.username ? 'white' : 'black'
    if (filter === 'won') return game.status === 'finished' && game.winner === userColor
    if (filter === 'lost') return game.status === 'finished' && game.winner !== userColor && game.winner !== 'draw'
    return true
  })

  const getGameResult = (game) => {
    if (game.status === 'ongoing') return { text: 'In Progress', color: 'text-yellow-400' }
    if (game.winner === 'draw') return { text: 'Draw', color: 'text-gray-400' }
    const userColor = game.whiteplayer === user?.username ? 'white' : 'black'
    if (game.winner === userColor) return { text: 'Won', color: 'text-accent-success' }
    return { text: 'Lost', color: 'text-accent-danger' }
  }

  const getOpponent = (game) => {
    return game.whiteplayer === user?.username ? game.blackplayer : game.whiteplayer
  }

  const getPlayerColor = (game) => {
    return game.whiteplayer === user?.username ? 'White' : 'Black'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Match History</h1>
        <p className="text-gray-400">Review your past games and performance</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'ongoing', 'finished', 'won', 'lost'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === f 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-dark-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{myGames.length}</div>
            <div className="text-gray-400 text-sm">Total Games</div>
          </div>
          <div className="text-center p-4 bg-dark-700 rounded-lg">
            <div className="text-2xl font-bold text-accent-success">
              {myGames.filter(g => g.winner === (g.whiteplayer === user?.username ? 'white' : 'black')).length}
            </div>
            <div className="text-gray-400 text-sm">Wins</div>
          </div>
          <div className="text-center p-4 bg-dark-700 rounded-lg">
            <div className="text-2xl font-bold text-accent-danger">
              {myGames.filter(g => g.status === 'finished' && g.winner !== (g.whiteplayer === user?.username ? 'white' : 'black') && g.winner !== 'draw').length}
            </div>
            <div className="text-gray-400 text-sm">Losses</div>
          </div>
          <div className="text-center p-4 bg-dark-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-400">
              {myGames.filter(g => g.winner === 'draw').length}
            </div>
            <div className="text-gray-400 text-sm">Draws</div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No games found</p>
            </div>
          ) : (
            filteredGames.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(game => {
              const result = getGameResult(game)
              const opponent = getOpponent(game)
              const playerColor = getPlayerColor(game)
              
              return (
                <div 
                  key={game.game_id}
                  onClick={() => game.status === 'ongoing' && navigate(`/game/${game.game_id}`)}
                  className={`flex items-center justify-between p-4 bg-dark-700 rounded-lg ${
                    game.status === 'ongoing' ? 'cursor-pointer hover:bg-dark-600' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      playerColor === 'White' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'
                    }`}>
                      {playerColor === 'White' ? '♔' : '♚'}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        vs {opponent}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(game.createdAt).toLocaleDateString()} • {playerColor} • {game.moves?.length || 0} moves
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className={`font-bold ${result.color}`}>
                      {result.text}
                    </div>
                    {game.status === 'ongoing' && (
                      <button className="btn-primary text-sm">
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default History
