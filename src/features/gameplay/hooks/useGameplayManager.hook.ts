import { useCallback, useEffect } from 'react'
import { useGameplay } from './useGameplay.hook'
import { useAudioPlayer } from './useAudioPlayer.hook'
import { useControlsConfig } from './useControlsConfig.hook'
import { useSongLoader } from '../../game-menu'
import { useUserProfiles } from '../../user-profiles'

import { useGameFlow } from './useGameFlow.hook'
import { useGameAudioLoader } from './useGameAudioLoader.hook'
import { useGameScoring } from './useGameScoring.hook'
import { PRELOADED_SONGS } from '../../game-menu/utils/preloadedSongs'

export const useGameplayManager = () => {
  const songLoader = useSongLoader()
  const profilesHook = useUserProfiles()
  const audioPlayer = useAudioPlayer()
  const controlsConfig = useControlsConfig()

  // 1. Manejo del ciclo de vida del juego (pestañas, pausa, reinicios, fin)
  const {
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
  } = useGameFlow({
    song: songLoader.song,
    audioPlayer,
    clearSong: songLoader.clearSong,
  })

  // 2. Carga y parseo inicial de archivos/urls al gestor de audio central
  const {
    isAudioLoading,
    handleAudioFileSelect,
    handleFolderSelect,
    handlePreloadedSongSelect,
    handleUserSongSelect,
  } = useGameAudioLoader({
    audioPlayer,
    loadFromFile: songLoader.loadFromFile,
    loadFromFolder: songLoader.loadFromFolder,
    loadFromUrls: songLoader.loadFromUrls,
    setSong: songLoader.setSong,
  })

  // 3. Sistema de Score
  const { handleSaveScore } = useGameScoring({
    song: songLoader.song,
    hasActiveUser: profilesHook.hasActiveUser,
    addScore: profilesHook.addScore,
  })

  // 4. Pre-selección automática de "Smoke on the Water" al inicio
  useEffect(() => {
    if (!songLoader.song && !songLoader.isLoading && !isAudioLoading) {
      console.log('[DEBUG] 🔄 No hay canción detectada. Intentando cargar "Smoke on the Water" por defecto.');
      const smokeSong = PRELOADED_SONGS.find(s => s.id === 'Deep Purple - Smoke on the Water')
      if (smokeSong && smokeSong.config.chartUrl) {
        handlePreloadedSongSelect(smokeSong.config as {
          chartUrl: string
          audioUrl?: string
          stemsUrls?: string[]
          metadata?: Partial<import('../types/GuitarGame.types').SongMetadata>
        })
      }
    } else {
      console.log('[DEBUG] 🛑 Omitiendo carga por defecto. Estado:', { 
        hasSong: !!songLoader.song, 
        isLoading: songLoader.isLoading, 
        isAudioLoading 
      });
    }
  }, [handlePreloadedSongSelect, isAudioLoading, songLoader.isLoading, songLoader.song])
 // Solo al montar o hasta cargar

  // ==========================================
  // 4. INTEGRACIÓN CON CANVAS (useGameplay)
  // ==========================================
  const getGameTime = useCallback((): number => {
    if (audioPlayer.isLoaded && audioPlayer.isPlaying) {
      return audioPlayer.getCurrentTime()
    }
    return -1
  }, [audioPlayer])

  const gameplay = useGameplay({
    song: songLoader.song,
    gameState,
    onGameEnd: handleGameEnd,
    onPauseToggle: handlePauseToggle,
    getAudioTime: audioPlayer.isLoaded ? getGameTime : undefined,
    calibrationOffset: audioPlayer.getCalibrationOffset(),
    keyToLane: controlsConfig.keyToLane,
    gamepadButtonToLane: controlsConfig.gamepadButtonToLane,
    gamepadPauseButton: controlsConfig.gamepadPauseButton,
  })

  return {
    // Estado general
    gameState,
    countdownNumber,
    finalStats,
    isAudioLoading,
    
    // Canción (passthrough)
    song: songLoader.song,
    error: songLoader.error,
    isLoading: songLoader.isLoading,
    availableDifficulties: songLoader.availableDifficulties,
    availableInstruments: songLoader.availableInstruments,
    currentInstrument: songLoader.currentInstrument,
    
    // Perfiles de usuario (passthrough)
    profiles: profilesHook.profiles,
    currentUser: profilesHook.currentUser,
    hasProfiles: profilesHook.hasProfiles,
    hasActiveUser: profilesHook.hasActiveUser,
    
    // Información del motor de audio (simplificada)
    audioPlayer: {
      isLoaded: audioPlayer.isLoaded,
      error: audioPlayer.error,
      stemsLoaded: audioPlayer.stemsLoaded,
      calibrationOffset: audioPlayer.getCalibrationOffset(),
    },
    
    // Referencia al canvas y medidas (desde useGameplay)
    canvasRef: gameplay.canvasRef,
    canvasWidth: gameplay.canvasWidth,
    canvasHeight: gameplay.canvasHeight,
    
    // Variables del Gamepad (desde useGameplay -> useGamepad)
    isGamepadConnected: gameplay.isGamepadConnected,
    gamepadName: gameplay.gamepadName,
    
    // Tiempo actual para el debug
    gameTime: audioPlayer.isLoaded ? audioPlayer.getCurrentTime() : 0,
    
    // Opciones de configuración
    controlsConfig,
    
    // Acciones y eventos (todos los handlers combinados)
    handleAudioFileSelect,
    handleFolderSelect,
    handleStartGame,
    handlePauseToggle,
    handlePlayAgain,
    handleRestartSong,
    handleExitDuringGame,
    handleBackToMenu,
    handleSaveScore,
    loadFromFile: songLoader.loadFromFile,
    loadFromUrls: songLoader.loadFromUrls,
    handlePreloadedSongSelect,
    handleUserSongSelect,
    changeDifficulty: songLoader.changeDifficulty,
    changeInstrument: songLoader.changeInstrument,
    registerUser: profilesHook.registerUser,
    switchUser: profilesHook.switchUser,
    deleteUser: profilesHook.deleteUser,
    setSong: songLoader.setSong,
  }
}

