import { useState, useEffect } from 'react'
import { useGameplayManager } from './hooks/useGameplayManager.hook'
import { GameMenu } from '../game-menu'
import { GameResults } from '../game-results'
import { ProfileSelector, RegisterForm } from '../user-profiles'
import { ControlsConfig } from './components/ControlsConfig/ControlsConfig'
import { PauseOverlay } from './components/PauseOverlay/PauseOverlay'
import { DebugOverlay } from './components/DebugOverlay/DebugOverlay'
import './Gameplay.css'

/**
 * Componente principal del juego Rock Hero
 *
 * AHORA: Componente puramente presentacional. 
 * Toda la lógica reside en useGameplayManager.
 */
export const Gameplay = () => {
  const {
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
    audioPlayer,
    
    // Canvas
    canvasRef,
    canvasWidth,
    canvasHeight,
    
    // Gamepad
    isGamepadConnected,
    gamepadName,
    
    // Controls Config
    controlsConfig,
    
    // Handlers
    handleAudioFileSelect,
    handleFolderSelect,
    handleStartGame,
    handlePlayAgain,
    handleRestartSong,
    handleExitDuringGame,
    handleBackToMenu,
    handlePauseToggle,
    handleSaveScore,
    loadFromFile,
    handlePreloadedSongSelect,
    changeDifficulty,
    changeInstrument,
    registerUser,
    switchUser,
    deleteUser,
    handleUserSongSelect,
    gameTime: currentGameTime,
  } = useGameplayManager()

  const [showControlsConfig, setShowControlsConfig] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  // Toggle debug with 'D'
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') {
        setShowDebug(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Si no hay perfiles, mostrar formulario de registro inicial
  if (!hasProfiles) {
    return <RegisterForm 
      isInitialSetup={true} 
      onRegister={registerUser} 
    />
  }

  return (
    <div className="game-container">
      {/* Indicador de gamepad Conected */}
      {isGamepadConnected && (
        <div className="game-gamepad-indicator" title={gamepadName || 'Gamepad'}>
          🎮 Connected
        </div>
      )}

      {/* Selector de perfil (visible en menú y resultados) */}
      {(gameState === 'menu' || gameState === 'finished') && hasActiveUser && (
        <div className="game-profile-selector">
          <ProfileSelector
            profiles={profiles}
            currentUser={currentUser}
            onSwitchUser={switchUser}
            onRegisterUser={registerUser}
            onDeleteUser={deleteUser}
          />
        </div>
      )}

      {/* ESTADO: Menú */}
      {gameState === 'menu' && (
        <GameMenu
          song={song}
          error={error}
          isLoading={isLoading}
          isAudioLoaded={audioPlayer.isLoaded}
          isAudioLoading={isAudioLoading}
          audioError={audioPlayer.error}
          stemsLoaded={audioPlayer.stemsLoaded}
          availableDifficulties={availableDifficulties}
          availableInstruments={availableInstruments}
          currentInstrument={currentInstrument}
          onChartFileSelect={loadFromFile}
          onAudioFileSelect={handleAudioFileSelect}
          onFolderSelect={handleFolderSelect}
          onPreloadedSongSelect={handlePreloadedSongSelect}
          onDifficultyChange={changeDifficulty}
          onInstrumentChange={changeInstrument}
          onStartGame={handleStartGame}
          onSongSelect={handleUserSongSelect}
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
          {/* Overlay de pausa con botones interactivos */}
          {gameState === 'paused' && (
            <div className="game-pause-overlay">
              <div className="game-pause-content">
                {showControlsConfig ? (
                  <ControlsConfig
                    controlsConfig={controlsConfig}
                    isGamepadConnected={isGamepadConnected}
                    gamepadName={gamepadName}
                    onBack={() => setShowControlsConfig(false)}
                  />
                ) : (
                  <PauseOverlay
                    onResume={handlePauseToggle}
                    onControls={() => setShowControlsConfig(true)}
                    onRestart={handleRestartSong}
                    onExit={handleExitDuringGame}
                  />
                )}
              </div>
            </div>
          )}
          {/* Offset indicator (only if audio is present) */}
          {audioPlayer.isLoaded && (
            <div className="game-calibration">
              Offset: {audioPlayer.calibrationOffset}ms (+/- to adjust)
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
          onSaveScore={handleSaveScore}
          playerName={currentUser?.profile.name}
        />
      )}

      {/* Debug Overlay */}
      {showDebug && (
        <DebugOverlay
          gameState={gameState}
          songName={song?.metadata?.songName}
          isAudioLoaded={audioPlayer.isLoaded}
          isAudioLoading={isAudioLoading}
          stemsLoaded={audioPlayer.stemsLoaded}
          audioError={audioPlayer.error}
          gameTime={currentGameTime || 0}
        />
      )}
    </div>
  )
}


