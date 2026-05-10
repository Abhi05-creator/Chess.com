import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { getGame, makeMove, exitGame } from '../services/api'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'

const Game = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { joinGame, sendMove, onOpponentMove, onOpponentLeft, connected, reconnecting, reconnect } = useSocket()
  
  const [game, setGame] = useState(null)
  const [chess, setChess] = useState(new Chess())
  const [orientation, setOrientation] = useState('white')
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [moveHistory, setMoveHistory] = useState([])
  const [opponentLeft, setOpponentLeft] = useState(false)
  const [error, setError] = useState(null)
  const [boardWidth, setBoardWidth] = useState(560)
  
  const gameRef = useRef(game)
  const chessRef = useRef(chess)
  
  // Update refs when state changes
  useEffect(() => {
    gameRef.current = game
    chessRef.current = chess
  }, [game, chess])

  // Responsive board sizing
  useEffect(() => {
    const updateBoardSize = () => {
      const container = document.getElementById('chessboard-container')
      if (container) {
        const width = Math.min(container.clientWidth - 32, 600)
        setBoardWidth(Math.max(280, width))
      }
    }

    updateBoardSize()
    window.addEventListener('resize', updateBoardSize)
    return () => window.removeEventListener('resize', updateBoardSize)
  }, [])

  const fetchGame = useCallback(async () => {
    try {
      setError(null)
      const response = await getGame(gameId)
      const gameData = response.data
      setGame(gameData)
      
      const newChess = new Chess(gameData.fen)
      setChess(newChess)
      
      const isWhite = gameData.whiteplayer === user?.username
      setOrientation(isWhite ? 'white' : 'black')
      
      const myTurn = (gameData.turn === 'white' && isWhite) || 
                     (gameData.turn === 'black' && !isWhite)
      setIsMyTurn(myTurn)
      
      if (gameData.moves) {
        setMoveHistory(gameData.moves)
      }
      
      if (gameData.status === 'finished') {
        setGameOver(true)
        setWinner(gameData.winner)
      }
    } catch (error) {
      console.error('Error fetching game:', error)
      setError('Failed to load game. Please try again.')
      if (error.response?.status === 404) {
        navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }, [gameId, user?.username, navigate])

  useEffect(() => {
    fetchGame()
  }, [fetchGame])

  useEffect(() => {
    if (game && connected) {
      joinGame(gameId)
    }
  }, [game, connected, gameId, joinGame])

  useEffect(() => {
    const unsubscribeMove = onOpponentMove((move) => {
      console.log('Received opponent move:', move)
      
      setChess(prev => {
        const newChess = new Chess(prev.fen())
        try {
          const result = newChess.move(move)
          if (result) {
            setIsMyTurn(true)
            setMoveHistory(prevHistory => [...prevHistory, move])
          }
        } catch (e) {
          console.error('Invalid opponent move:', e)
        }
        return newChess
      })
      
      // Refresh game state from server
      fetchGame()
    })

    const unsubscribeLeft = onOpponentLeft(() => {
      console.log('Opponent left the game')
      setOpponentLeft(true)
      setGameOver(true)
      setWinner(game?.whiteplayer === user?.username ? 'white' : 'black')
    })

    return () => {
      if (unsubscribeMove) unsubscribeMove()
      if (unsubscribeLeft) unsubscribeLeft()
    }
  }, [onOpponentMove, onOpponentLeft, fetchGame, user?.username])

  const onDrop = useCallback(async (sourceSquare, targetSquare, piece) => {
    if (!isMyTurn || gameOver) {
      console.log('Cannot move - not your turn or game over')
      return false
    }

    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1]?.toLowerCase() || 'q'
    }

    console.log('Attempting move:', move)

    try {
      // Optimistically update local state first
      const tempChess = new Chess(chessRef.current.fen())
      const localResult = tempChess.move(move)
      
      if (!localResult) {
        console.log('Invalid move locally')
        return false
      }

      // Update UI immediately
      setChess(tempChess)
      setIsMyTurn(false)
      setMoveHistory(prev => [...prev, move])

      // Send to server
      const result = await makeMove(gameId, move)
      
      if (result.data?.game) {
        const serverChess = new Chess(result.data.game.fen)
        setChess(serverChess)
        setMoveHistory(result.data.game.moves || [])
        
        if (result.data.game.status === 'finished') {
          setGameOver(true)
          setWinner(result.data.game.winner)
        }
        
        // Send move via socket for real-time sync
        const socketResult = sendMove(gameId, move)
        if (!socketResult) {
          console.warn('Socket move failed, but HTTP succeeded')
        }
        
        return true
      }
    } catch (error) {
      console.error('Move failed:', error)
      // Revert to server state
      fetchGame()
      return false
    }
  }, [isMyTurn, gameOver, gameId, sendMove, fetchGame])

  const handleExit = async () => {
    if (window.confirm('Are you sure you want to resign?')) {
      try {
        await exitGame(gameId)
        navigate('/dashboard')
      } catch (error) {
        console.error('Error exiting game:', error)
        setError('Failed to exit game. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {game?.whiteplayer?.split('@')[0]} vs {game?.blackplayer?.split('@')[0]}
                </h1>
                <div className="flex items-center mt-1 space-x-3">
                  <span className={`text-sm font-semibold ${isMyTurn ? 'text-blue-600' : 'text-slate-500'}`}>
                    {isMyTurn ? "Your Turn" : "Opponent's Turn"}
                  </span>
                  <span className="text-slate-400 text-sm">|</span>
                  <span className="text-slate-500 text-sm">{moveHistory.length} moves</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-slate-600 font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
                {!connected && (
                  <button 
                    onClick={reconnect}
                    className="ml-2 text-xs text-blue-600 hover:underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-accent-danger/20 border border-accent-danger text-accent-danger px-4 py-3 rounded-lg mb-4">
                {error}
                <button 
                  onClick={() => { setError(null); fetchGame(); }}
                  className="ml-4 text-sm underline"
                >
                  Retry
                </button>
              </div>
            )}

            {gameOver && (
              <div className={`mb-4 p-4 rounded-lg text-center font-bold ${
                winner === 'draw' ? 'bg-yellow-500/20 text-yellow-400' :
                winner === (game?.whiteplayer === user?.username ? 'white' : 'black') ? 'bg-accent-success/20 text-accent-success' : 
                'bg-accent-danger/20 text-accent-danger'
              }`}>
                {opponentLeft ? 'Opponent left - You Win!' :
                 winner === 'draw' ? 'Game Drawn!' :
                 winner === (game?.whiteplayer === user?.username ? 'white' : 'black') ? 'You Won!' : 'You Lost!'}
              </div>
            )}

            <div id="chessboard-container" className="flex justify-center py-4">
              <div className="w-full max-w-[600px] border border-slate-200 rounded shadow-sm overflow-hidden">
                <Chessboard 
                  position={chess.fen()}
                  onPieceDrop={onDrop}
                  boardOrientation={orientation}
                  boardWidth={boardWidth}
                  customDarkSquareStyle={{ backgroundColor: '#b58863' }}
                  customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
                  areArrowsAllowed={false}
                />
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-4 flex-wrap gap-2">
              {!gameOver && (
                <button 
                  onClick={handleExit}
                  className="btn-danger"
                >
                  Resign
                </button>
              )}
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Move History</h2>
            <div className="bg-dark-700 rounded-lg p-4 h-64 md:h-96 overflow-y-auto">
              {moveHistory.length === 0 ? (
                <p className="text-gray-400 text-center">No moves yet</p>
              ) : (
                <div className="space-y-1">
                  {moveHistory.map((move, index) => (
                    <div key={index} className="flex text-sm">
                      <span className="text-gray-500 w-12">{Math.floor(index / 2) + 1}.</span>
                      <span className="text-white font-mono">{typeof move === 'string' ? move : `${move.from}-${move.to}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game
