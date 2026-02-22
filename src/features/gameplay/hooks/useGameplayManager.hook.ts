import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameplay } from './useGameplay.hook'
import { useAudioPlayer } from './useAudioPlayer.hook'
import { useSongLoader } from '../../game-menu'
import { useUserProfiles } from '../../user-profiles'
import type { GameState, GameStats, SongMetadata } from '../types/GuitarGame.types'

const COUNTDOWN_INTERVAL = 1000
const COUNTDOWN_START = 3

export const useGameplayManager = () => {
  // ==========================================
  // ESTADO DEL JUEGO
  // ==========================================
  const [gameState, setGameState] = useState<GameState>('menu')
  const [countdownNumber, setCountdownNumber] = useState<number>(COUNTDOWN_START)
  const [finalStats, setFinalStats] = useState<GameStats | null>(null)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const countdownIntervalRef = useRef<number | null>(null)

  // ==========================================
  // HOOKS EXTERNOS
  // ==========================================
  const {
    song,
    error,
    isLoading,
    availableDifficulties,
    availableInstruments,
    currentInstrument,
    loadFromFile,
    loadFromFolder,
    loadFromUrls,
    changeDifficulty,
    changeInstrument,
    clearSong,
    setSong,
  } = useSongLoader()

  const {
    profiles,
    currentUser,
    hasProfiles,
    hasActiveUser,
    registerUser,
    switchUser,
    deleteUser,
    addScore,
  } = useUserProfiles()

  const audioPlayer = useAudioPlayer()

  // ==========================================
  // LÓGICA DE AUDIO
  // ==========================================
  const handleAudioFileSelect = useCallback(
    async (file: File) => {
      setIsAudioLoading(true)
      await audioPlayer.loadAudioFile(file)
      setIsAudioLoading(false)
    },
    [audioPlayer]
  )

  const handleFolderSelect = useCallback(
    async (files: FileList) => {
      await loadFromFolder(files)
      const audioExtensions = ['.ogg', '.opus', '.mp3', '.wav', '.flac']
      const audioFiles: File[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
        if (audioExtensions.includes(ext)) {
          audioFiles.push(file)
        }
      }

      if (audioFiles.length > 0) {
        setIsAudioLoading(true)
        await audioPlayer.loadAudioStems(audioFiles)
        setIsAudioLoading(false)
      }
    },
    [loadFromFolder, audioPlayer]
  )

  const handlePreloadedSongSelect = useCallback(
    async (config: {
      chartUrl: string
      audioUrl?: string
      stemsUrls?: string[]
      metadata?: Partial<SongMetadata>
    }) => {
      setIsAudioLoading(true)
      
      try {
        // Cargar chart
        await loadFromUrls(config.chartUrl, config.metadata)
        
        // Cargar audio (stems o archivo único)
        if (config.stemsUrls && config.stemsUrls.length > 0) {
          await audioPlayer.loadStemsFromUrls(config.stemsUrls)
        } else if (config.audioUrl) {
          await audioPlayer.loadAudioFromUrl(config.audioUrl)
        }
      } catch (err) {
        console.error('Error cargando canción precargada:', err)
      } finally {
        setIsAudioLoading(false)
      }
    },
    [loadFromUrls, audioPlayer]
  )

  // ==========================================
  // CUENTA REGRESIVA Y CONTROL DE JUEGO
  // ==========================================
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

  // ==========================================
  // SISTEMA DE CALIBRACIÓN (KEYS)
  // ==========================================
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

  // ==========================================
  // LÓGICA DE PUNTUACIÓN
  // ==========================================
  const calculateAccuracy = (stats: GameStats): number => {
    const totalHits = stats.perfects + stats.goods + stats.oks
    const totalNotes = totalHits + stats.misses
    if (totalNotes === 0) return 0
    return Math.round((totalHits / totalNotes) * 100)
  }

  const getRank = (accuracy: number): string => {
    if (accuracy >= 95) return 'S'
    if (accuracy >= 90) return 'A'
    if (accuracy >= 80) return 'B'
    if (accuracy >= 70) return 'C'
    if (accuracy >= 60) return 'D'
    return 'F'
  }

  const handleSaveScore = (stats: GameStats) => {
    if (!song || !hasActiveUser) return
    const accuracy = calculateAccuracy(stats)
    addScore({
      songId: song.metadata.songName.toLowerCase().replace(/\s+/g, '_'),
      songName: song.metadata.songName,
      artist: song.metadata.artist,
      score: stats.score,
      accuracy,
      rank: getRank(accuracy),
      maxCombo: stats.maxCombo,
      difficulty: song.metadata.difficulty || 'unknown',
    })
  }

  // ==========================================
  // INTEGRACIÓN CON CANVAS (useGameplay)
  // ==========================================
  const getGameTime = useCallback((): number => {
    if (audioPlayer.isLoaded && audioPlayer.isPlaying) {
      return audioPlayer.getCurrentTime()
    }
    return -1
  }, [audioPlayer])

  const { canvasRef, canvasWidth, canvasHeight } = useGameplay({
    song,
    gameState,
    onGameEnd: handleGameEnd,
    onPauseToggle: handlePauseToggle,
    getAudioTime: audioPlayer.isLoaded ? getGameTime : undefined,
    calibrationOffset: audioPlayer.getCalibrationOffset(),
  })

  return {
    // Estado
    gameState,
    countdownNumber,
    finalStats,
    isAudioLoading,
    
    // Canción
    song,
    error,
    isLoading,
    availableDifficulties,
    availableInstruments,
    currentInstrument,
    
    // Perfiles
    profiles,
    currentUser,
    hasProfiles,
    hasActiveUser,
    
    // Audio Player info
    audioPlayer: {
      isLoaded: audioPlayer.isLoaded,
      error: audioPlayer.error,
      stemsLoaded: audioPlayer.stemsLoaded,
      calibrationOffset: audioPlayer.getCalibrationOffset(),
    },
    
    // Canvas
    canvasRef,
    canvasWidth,
    canvasHeight,
    
    // Handlers
    handleAudioFileSelect,
    handleFolderSelect,
    handleStartGame,
    handlePauseToggle,
    handlePlayAgain,
    handleBackToMenu,
    handleSaveScore,
    loadFromFile,
    loadFromUrls,
    handlePreloadedSongSelect,
    changeDifficulty,
    changeInstrument,
    registerUser,
    switchUser,
    deleteUser,
    setSong,
  }
}
