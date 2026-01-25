import { useState, useCallback, useEffect, useRef } from 'react'
import { useGuitarGame } from './hooks/useGuitarGame.hook'
import { useSongLoader } from './hooks/useSongLoader.hook'
import { useAudioPlayer } from './hooks/useAudioPlayer.hook'
import { GameMenu } from './components/GameMenu'
import { GameResults } from './components/GameResults'
import type { GameState, GameStats } from './types/GuitarGame.types'
import './GuitarGame.css'

// ==========================================
// CONSTANTES
// ==========================================

/** Duración de cada número de la cuenta regresiva (ms) */
const COUNTDOWN_INTERVAL = 1000

/** Número inicial de la cuenta regresiva */
const COUNTDOWN_START = 3

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * Componente principal del juego Guitar Hero
 *
 * PASO 5: Ahora incluye:
 * - Carga de audio con Web Audio API
 * - Cuenta regresiva antes de empezar
 * - Sincronización de notas con el audio
 * - Pausa/Resume del audio
 */
export const GuitarGame = () => {
  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================

  // Estado actual: menu, countdown, playing, paused, finished
  const [gameState, setGameState] = useState<GameState>('menu')

  // Número actual de la cuenta regresiva (3, 2, 1, 0 = GO!)
  const [countdownNumber, setCountdownNumber] = useState<number>(COUNTDOWN_START)

  // Estadísticas finales (se guardan cuando termina el juego)
  const [finalStats, setFinalStats] = useState<GameStats | null>(null)

  // Estado para tracking de carga de audio
  const [isAudioLoading, setIsAudioLoading] = useState(false)

  // Ref para el intervalo de countdown
  const countdownIntervalRef = useRef<number | null>(null)

  // ==========================================
  // HOOKS
  // ==========================================

  // Hook para cargar canciones (JSON)
  const { song, error, isLoading, loadFromFile, loadTestSong, clearSong } = useSongLoader()

  // Hook para manejar audio
  const audioPlayer = useAudioPlayer()

  // ==========================================
  // FUNCIONES DE AUDIO
  // ==========================================

  /**
   * Carga un archivo de audio
   */
  const handleAudioFileSelect = useCallback(
    async (file: File) => {
      setIsAudioLoading(true)
      await audioPlayer.loadAudioFile(file)
      setIsAudioLoading(false)
    },
    [audioPlayer]
  )

  // ==========================================
  // CALLBACKS: Manejo de eventos del juego
  // ==========================================

  /**
   * Limpia el intervalo de countdown
   */
  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  /**
   * Inicia la cuenta regresiva y luego el juego
   */
  const startCountdown = useCallback(() => {
    // Limpiar intervalo anterior si existe
    clearCountdownInterval()

    // Resetear contador
    setCountdownNumber(COUNTDOWN_START)
    setGameState('countdown')

    // Iniciar intervalo
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          // Countdown terminado, empezar juego
          clearCountdownInterval()

          // Iniciar audio si está cargado
          if (audioPlayer.isLoaded) {
            audioPlayer.play(0)
          }

          // Cambiar a estado playing
          setGameState('playing')
          return 0
        }
        return prev - 1
      })
    }, COUNTDOWN_INTERVAL)
  }, [audioPlayer, clearCountdownInterval])

  /**
   * Se llama cuando el usuario presiona "Empezar a jugar"
   */
  const handleStartGame = useCallback(() => {
    if (song) {
      setFinalStats(null)
      startCountdown()
    }
  }, [song, startCountdown])

  /**
   * Se llama cuando el usuario presiona ESPACIO (pausar/reanudar)
   */
  const handlePauseToggle = useCallback(async () => {
    if (gameState === 'playing') {
      // Pausar
      if (audioPlayer.isLoaded) {
        await audioPlayer.pause()
      }
      setGameState('paused')
    } else if (gameState === 'paused') {
      // Reanudar
      if (audioPlayer.isLoaded) {
        await audioPlayer.resume()
      }
      setGameState('playing')
    }
  }, [gameState, audioPlayer])

  /**
   * Se llama cuando la canción termina
   */
  const handleGameEnd = useCallback(
    (stats: GameStats) => {
      // Detener audio
      if (audioPlayer.isLoaded) {
        audioPlayer.stop()
      }
      setFinalStats(stats)
      setGameState('finished')
    },
    [audioPlayer]
  )

  /**
   * Se llama cuando el usuario presiona "Jugar de nuevo"
   */
  const handlePlayAgain = useCallback(() => {
    setFinalStats(null)
    startCountdown()
  }, [startCountdown])

  /**
   * Se llama cuando el usuario presiona "Cambiar canción"
   */
  const handleBackToMenu = useCallback(() => {
    setFinalStats(null)
    clearSong()
    audioPlayer.cleanup()
    setGameState('menu')
  }, [clearSong, audioPlayer])

  /**
   * Ajusta el offset de calibración
   */
  const handleCalibrationChange = useCallback(
    (delta: number) => {
      const currentOffset = audioPlayer.getCalibrationOffset()
      const newOffset = Math.max(-200, Math.min(200, currentOffset + delta))
      audioPlayer.setCalibrationOffset(newOffset)
    },
    [audioPlayer]
  )

  // ==========================================
  // EFECTOS
  // ==========================================

  // Limpiar intervalo cuando el componente se desmonta
  useEffect(() => {
    return () => {
      clearCountdownInterval()
    }
  }, [clearCountdownInterval])

  // Manejar teclas de calibración (+/-)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState === 'playing' || gameState === 'paused') {
        if (event.key === '+' || event.key === '=') {
          handleCalibrationChange(10) // +10ms
        } else if (event.key === '-' || event.key === '_') {
          handleCalibrationChange(-10) // -10ms
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, handleCalibrationChange])

  // ==========================================
  // HOOK: Lógica del juego (canvas)
  // ==========================================

  /**
   * Función para obtener el tiempo actual del juego
   * Usa audioContext.currentTime si hay audio, sino performance.now()
   */
  const getGameTime = useCallback((): number => {
    if (audioPlayer.isLoaded && audioPlayer.isPlaying) {
      return audioPlayer.getCurrentTime()
    }
    return -1 // Indica que el hook debe usar su propio sistema de tiempo
  }, [audioPlayer])

  const { canvasRef, canvasWidth, canvasHeight } = useGuitarGame({
    song,
    gameState,
    onGameEnd: handleGameEnd,
    onPauseToggle: handlePauseToggle,
    getAudioTime: audioPlayer.isLoaded ? getGameTime : undefined,
    calibrationOffset: audioPlayer.getCalibrationOffset(),
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
          isAudioLoaded={audioPlayer.isLoaded}
          isAudioLoading={isAudioLoading}
          audioError={audioPlayer.error}
          onJsonFileSelect={loadFromFile}
          onAudioFileSelect={handleAudioFileSelect}
          onLoadTestSong={loadTestSong}
          onStartGame={handleStartGame}
        />
      )}

      {/* ESTADO: Countdown */}
      {gameState === 'countdown' && (
        <div className="game-countdown">
          <div className="game-countdown__number">
            {countdownNumber === 0 ? 'GO!' : countdownNumber}
          </div>
          {song && <div className="game-countdown__song">{song.metadata.songName}</div>}
        </div>
      )}

      {/* ESTADO: Jugando o Pausado */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="game-canvas"
          />
          {/* Indicador de offset (solo si hay audio) */}
          {audioPlayer.isLoaded && (
            <div className="game-calibration">
              Offset: {audioPlayer.getCalibrationOffset()}ms (+/- para ajustar)
            </div>
          )}
        </>
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
