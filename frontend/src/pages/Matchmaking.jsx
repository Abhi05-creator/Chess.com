import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUsers, createGame, getAllGames, findMatch } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Matchmaking = () => {
  const [users, setUsers] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, gamesRes] = await Promise.all([
        getAllUsers(),
        getAllGames()
      ])
      setUsers(usersRes.data.filter(u => u.username !== user?.username))
      setGames(gamesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startMatchmaking = async () => {
    setSearching(true)
    setError(null)
    
    try {
      // Use the backend matchmaking endpoint
      const response = await findMatch()
      const { opponent } = response.data
      
      if (opponent) {
        // Create game with the found opponent
        const gameResponse = await createGame({
          whiteplayer: user?.username,
          blackplayer: opponent.username
        })
        navigate(`/game/${gameResponse.data.game_id}`)
      }
    } catch (err) {
      console.error('Matchmaking error:', err)
      if (err.response?.status === 404) {
        // No opponent found, we can wait or offer to play against a bot/random offline user
        // For now, let's just show an error or try a random user after a delay
        setTimeout(() => {
          setError('No online opponents in your rank range. Try challenging someone below!')
          setSearching(false)
        }, 1500)
      } else {
        setError('Failed to find a match. Please try again.')
        setSearching(false)
      }
    }
  }

  const challengePlayer = async (opponent) => {
    try {
      const response = await createGame({
        whiteplayer: user?.username,
        blackplayer: opponent.username
      })
      
      navigate(`/game/${response.data.game_id}`)
    } catch (error) {
      console.error('Error creating game:', error)
    }
  }

  const resumeGame = (gameId) => {
    navigate(`/game/${gameId}`)
  }

  const myActiveGames = games.filter(game => 
    game.status === 'ongoing' && 
    (game.whiteplayer === user?.username || game.blackplayer === user?.username)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Find a Match</h1>
        <p className="text-slate-500 mb-8">Challenge other players or find a random match</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md mb-6 max-w-md mx-auto">
            {error}
          </div>
        )}

        <button 
          onClick={startMatchmaking}
          disabled={searching}
          className="btn-primary text-xl px-12 py-6"
        >
          {searching ? (
            <span className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Finding opponent...</span>
            </span>
          ) : (
            'Quick Match'
          )}
        </button>
      </div>

      {myActiveGames.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Active Games</h2>
          <div className="space-y-3">
            {myActiveGames.map(game => (
              <div 
                key={game.game_id}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-md"
              >
                <div>
                    <div className="text-slate-900 font-medium">
                      vs {game.whiteplayer === user?.username ? game.blackplayer : game.whiteplayer}
                    </div>
                    <div className="text-slate-500 text-sm">
                      Turn: {game.turn} • {game.moves?.length || 0} moves
                    </div>
                </div>
                <button 
                  onClick={() => resumeGame(game.game_id)}
                  className="btn-primary"
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Online Players</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.filter(u => u.status === 'outgame').map(opponent => (
              <div 
                key={opponent._id} 
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-slate-900 font-medium">{opponent.username}</div>
                    <div className="text-slate-500 text-sm">Rank: {opponent.rank} • {opponent.gamesPlayed} games</div>
                  </div>
                </div>
              <button 
                onClick={() => challengePlayer(opponent)}
                className="btn-secondary text-sm"
              >
                Challenge
              </button>
            </div>
          ))}
        </div>
        
        {users.filter(u => u.status === 'outgame').length === 0 && (
          <p className="text-slate-500 text-center py-8">No online players available</p>
        )}
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">All Players</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.slice(0, 10).map(opponent => (
            <div 
              key={opponent._id} 
              className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${opponent.status === 'outgame' ? 'bg-green-500' : (opponent.status === 'ingame' ? 'bg-yellow-500' : 'bg-slate-300')}`}></div>
                <div>
                  <div className="text-slate-900 font-medium">{opponent.username}</div>
                  <div className="text-slate-500 text-sm">
                    Rank: {opponent.rank} • {opponent.gamesPlayed} games • {opponent.wins}W/{opponent.losses}L
                  </div>
                </div>
              </div>
              <button 
                onClick={() => challengePlayer(opponent)}
                className="btn-secondary text-sm"
              >
                Challenge
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Matchmaking
