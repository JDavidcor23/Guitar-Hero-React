import { useGameplayManager } from './hooks/useGameplayManager.hook'
import { GameMenu } from '../game-menu'
import { GameResults } from '../game-results'
import { ProfileSelector, RegisterForm } from '../user-profiles'
import './Gameplay.css'

/**
 * Componente principal del juego Guitar Hero
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
    
    // Handlers
    handleAudioFileSelect,
    handleFolderSelect,
    handleStartGame,
    handlePlayAgain,
    handleBackToMenu,
    handleSaveScore,
    loadFromFile,
    handlePreloadedSongSelect,
    changeDifficulty,
    changeInstrument,
    registerUser,
    switchUser,
    deleteUser,
    setSong,
  } = useGameplayManager()

  // Si no hay perfiles, mostrar formulario de registro inicial
  if (!hasProfiles) {
    return <RegisterForm 
      isInitialSetup={true} 
      onRegister={registerUser} 
    />
  }

  return (
    <div className="game-container">
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
          onSongSelect={setSong}
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
              Offset: {audioPlayer.calibrationOffset}ms (+/- para ajustar)
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
    </div>
  )
}


