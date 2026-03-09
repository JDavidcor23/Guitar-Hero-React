import { useState, useCallback, useRef, useEffect } from 'react'
import type { GameState, GameStats, SongData } from '../types/GuitarGame.types'

const COUNTDOWN_INTERVAL = 1000
const COUNTDOWN_START = 3

interface UseGameFlowParams {
  song: SongData | null
  audioPlayer: any // Evaluated at compile time for hook injection
  clearSong: () => void
}

export const useGameFlow = ({ song, audioPlayer, clearSong }: UseGameFlowParams) => {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [countdownNumber, setCountdownNumber] = useState<number>(COUNTDOWN_START)
  const [finalStats, setFinalStats] = useState<GameStats | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const startCountdown = useCallback(() => {
    clearCountdownInterval()
    setCountdownNumber(COUNTDOWN_START)
    setGameState('countdown')

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          clearCountdownInterval()
          if (audioPlayer.isLoaded) {
            audioPlayer.play(0)
          }
          setGameState('playing')
          return 0
        }
        return prev - 1
      })
    }, COUNTDOWN_INTERVAL)
  }, [audioPlayer, clearCountdownInterval])

  const handleStartGame = useCallback(() => {
    if (song) {
      setFinalStats(null)
      startCountdown()
    }
  }, [song, startCountdown])

  const handlePauseToggle = useCallback(async () => {
    if (gameState === 'playing') {
      if (audioPlayer.isLoaded) {
        await audioPlayer.pause()
      }
      setGameState('paused')
    } else if (gameState === 'paused') {
      if (audioPlayer.isLoaded) {
        await audioPlayer.resume()
      }
      setGameState('playing')
    }
  }, [gameState, audioPlayer])

  const handleGameEnd = useCallback(
    (stats: GameStats) => {
      if (audioPlayer.isLoaded) {
        audioPlayer.stop()
      }
      setFinalStats(stats)
      setGameState('finished')
    },
    [audioPlayer]
  )

  const handlePlayAgain = useCallback(() => {
    setFinalStats(null)
    startCountdown()
  }, [startCountdown])

  const handleRestartSong = useCallback(() => {
    if (audioPlayer.isLoaded) {
      audioPlayer.stop()
    }
    setFinalStats(null)
    startCountdown()
  }, [audioPlayer, startCountdown])

  const handleExitDuringGame = useCallback(() => {
    if (audioPlayer.isLoaded) {
      audioPlayer.stop()
    }
    setFinalStats(null)
    clearSong()
    audioPlayer.cleanup()
    setGameState('menu')
  }, [audioPlayer, clearSong])

  const handleBackToMenu = useCallback(() => {
    setFinalStats(null)
    clearSong()
    audioPlayer.cleanup()
    setGameState('menu')
  }, [clearSong, audioPlayer])

  const handleCalibrationChange = useCallback(
    (delta: number) => {
      const currentOffset = audioPlayer.getCalibrationOffset()
      const newOffset = Math.max(-200, Math.min(200, currentOffset + delta))
      audioPlayer.setCalibrationOffset(newOffset)
    },
    [audioPlayer]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState === 'playing' || gameState === 'paused') {
        if (event.key === '+' || event.key === '=') {
          handleCalibrationChange(10)
        } else if (event.key === '-' || event.key === '_') {
          handleCalibrationChange(-10)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, handleCalibrationChange])

  useEffect(() => {
    return () => clearCountdownInterval()
  }, [clearCountdownInterval])

  return {
    gameState,
    countdownNumber,
    finalStats,
    handleStartGame,
    handlePauseToggle,
    handleGameEnd,
    handlePlayAgain,
    handleRestartSong,
    handleExitDuringGame,
    handleBackToMenu,
  }
}
