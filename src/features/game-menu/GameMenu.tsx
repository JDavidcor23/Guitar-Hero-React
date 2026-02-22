import type { GameMenuProps } from './types/GameMenu.types'
import { useGameMenu } from './hooks/useGameMenu.hook'
import { HeroSection } from './components/HeroSection/HeroSection'
import { SongGrid } from './components/SongGrid/SongGrid'
import { FolderLoader } from './components/FolderLoader/FolderLoader'
import { SongConfig } from './components/SongConfig/SongConfig'
import { ControlsHelp } from './components/ControlsHelp/ControlsHelp'
import { AudioFormatHelp } from './components/AudioFormatHelp'
import './GameMenu.css'

/**
 * Main menu component — Song selection view.
 *
 * Guitar Hero-inspired design with a guitarist background,
 * instrument selector with icons, and difficulty pill buttons.
 *
 * This component is purely presentational; all business logic
 * lives in the useGameMenu hook. Each visual section is delegated
 * to a focused sub-component.
 */
export const GameMenu = (props: GameMenuProps) => {
  const {
    song,
    error,
    isLoading,
    isAudioLoaded,
    isAudioLoading,
    audioError,
    stemsLoaded = 0,
    availableDifficulties,
    availableInstruments = [],
    currentInstrument = 'PART GUITAR',
    onPreloadedSongSelect,
    onDifficultyChange,
    onInstrumentChange,
    onFolderSelect,
    onStartGame,
    onSongSelect,
  } = props

  const {
    userSongs,
    handleFolderChange,
    formatDuration,
    canStartGame,
  } = useGameMenu({
    song,
    onChartFileSelect: props.onChartFileSelect,
    onAudioFileSelect: props.onAudioFileSelect,
    onFolderSelect,
  })

  return (
    <div className="game-menu">
      <HeroSection />

      <div className="game-menu__content">
        <SongGrid
          song={song}
          userSongs={userSongs}
          onPreloadedSongSelect={onPreloadedSongSelect}
          onSongSelect={onSongSelect}
        />

        {onFolderSelect && (
          <FolderLoader
            isLoading={isLoading}
            isAudioLoading={isAudioLoading}
            onFolderChange={handleFolderChange}
          />
        )}

        {/* Error messages */}
        {error && <p className="game-menu__error">{error}</p>}
        {audioError && (
          <>
            <p className="game-menu__error">{audioError}</p>
            <AudioFormatHelp />
          </>
        )}

        {/* Song configuration (visible once a song is loaded) */}
        {song && (
          <SongConfig
            song={song}
            isAudioLoaded={isAudioLoaded}
            stemsLoaded={stemsLoaded}
            availableDifficulties={availableDifficulties}
            availableInstruments={availableInstruments}
            currentInstrument={currentInstrument}
            canStartGame={canStartGame}
            formatDuration={formatDuration}
            onDifficultyChange={onDifficultyChange}
            onInstrumentChange={onInstrumentChange}
            onStartGame={onStartGame}
          />
        )}

        <ControlsHelp />
      </div>
    </div>
  )
}
