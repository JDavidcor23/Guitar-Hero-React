import { useCallback } from 'react'
import { useGameplay } from './useGameplay.hook'
import { useAudioPlayer } from './useAudioPlayer.hook'
import { useControlsConfig } from './useControlsConfig.hook'
import { useSongLoader } from '../../game-menu'
import { useUserProfiles } from '../../user-profiles'

import { useGameFlow } from './useGameFlow.hook'
import { useGameAudioLoader } from './useGameAudioLoader.hook'
import { useGameScoring } from './useGameScoring.hook'

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

