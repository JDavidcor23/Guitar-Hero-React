import { useState, useCallback } from 'react'
import { useGuitarGame } from './hooks/useGuitarGame.hook'
import { useSongLoader } from './hooks/useSongLoader.hook'
import { GameMenu } from './components/GameMenu'
import { GameResults } from './components/GameResults'
import type { GameState, GameStats } from './types/GuitarGame.types'
import './GuitarGame.css'

/**
 * Componente principal del juego Guitar Hero
 *
 * Maneja los estados del juego:
 * - menu: Pantalla de selección de canción
 * - playing: Jugando la canción
 * - paused: Juego pausado
 * - finished: Canción terminada, mostrando resultados
 */
export const GuitarGame = () => {
  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================

  // Estado actual: menu, playing, paused, finished
  const [gameState, setGameState] = useState<GameState>('menu')

  // Estadísticas finales (se guardan cuando termina el juego)
  const [finalStats, setFinalStats] = useState<GameStats | null>(null)

  // ==========================================
  // HOOK: Cargar canciones
  // ==========================================
  const { song, error, isLoading, loadFromFile, loadTestSong, clearSong } = useSongLoader()

  // ==========================================
  // CALLBACKS: Manejo de eventos del juego
  // ==========================================

  /**
   * Se llama cuando el usuario presiona "Empezar a jugar"
   */
  const handleStartGame = useCallback(() => {
    if (song) {
      setFinalStats(null) // Limpiar stats anteriores
      setGameState('playing')
    }
  }, [song])

  /**
   * Se llama cuando el usuario presiona ESPACIO (pausar/reanudar)
   */
  const handlePauseToggle = useCallback(() => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'))
  }, [])

  /**
   * Se llama cuando la canción termina
   */
  const handleGameEnd = useCallback((stats: GameStats) => {
    setFinalStats(stats)
    setGameState('finished')
  }, [])

  /**
   * Se llama cuando el usuario presiona "Jugar de nuevo"
   */
  const handlePlayAgain = useCallback(() => {
    setFinalStats(null)
    setGameState('playing')
  }, [])

  /**
   * Se llama cuando el usuario presiona "Cambiar canción"
   */
  const handleBackToMenu = useCallback(() => {
    setFinalStats(null)
    clearSong()
    setGameState('menu')
  }, [clearSong])

  // ==========================================
  // HOOK: Lógica del juego (canvas)
  // ==========================================
  const { canvasRef, canvasWidth, canvasHeight } = useGuitarGame({
    song,
    gameState,
    onGameEnd: handleGameEnd,
    onPauseToggle: handlePauseToggle,
  })

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="game-container">
      {/* ESTADO: Menú */}
      {gameState === 'menu' && (
        <GameMenu
          song={song}
          error={error}
          isLoading={isLoading}
          onFileSelect={loadFromFile}
          onLoadTestSong={loadTestSong}
          onStartGame={handleStartGame}
        />
      )}

      {/* ESTADO: Jugando o Pausado */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="game-canvas"
        />
      )}

      {/* ESTADO: Terminado (resultados) */}
      {gameState === 'finished' && finalStats && song && (
        <GameResults
          stats={finalStats}
          song={song}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  )
}
