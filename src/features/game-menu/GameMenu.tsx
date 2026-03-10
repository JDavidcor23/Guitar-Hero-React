import { useState, useEffect } from 'react'
import type { GameMenuProps } from './types/GameMenu.types'
import { useGameMenu } from './hooks/useGameMenu.hook'
import { HeroSection } from './components/HeroSection/HeroSection'
import { DownloadInstructions } from './components/DownloadInstructions/DownloadInstructions'
import { SongGrid } from './components/SongGrid/SongGrid'
import { FolderLoader } from './components/FolderLoader/FolderLoader'
import { SongConfig } from './components/SongConfig/SongConfig'
import { ControlsHelp } from './components/ControlsHelp/ControlsHelp'
import { AudioFormatHelp } from './components/AudioFormatHelp'
import './GameMenu.css'

/**
 * Main menu component — Song selection view.
 *
 * Rock Hero-inspired design with a guitarist background,
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
    handleDeleteSong,
    formatDuration,
    canStartGame,
  } = useGameMenu({
    song,
    onChartFileSelect: props.onChartFileSelect,
    onAudioFileSelect: props.onAudioFileSelect,
    onFolderSelect,
  })

  // Controls which panel has gamepad focus
  const [focusedPanel, setFocusedPanel] = useState<'grid' | 'config'>('grid')

  // If no song is loaded, force focus to the grid
  useEffect(() => {
    if (!song) {
      setFocusedPanel('grid')
    }
  }, [song])

  return (
    <div className="game-menu">
      <HeroSection />

      <div className="game-menu__content">
        <DownloadInstructions />

        <SongGrid
          song={song}
          userSongs={userSongs}
          isFocused={focusedPanel === 'grid'}
          onFocusDown={() => song && setFocusedPanel('config')}
          onPreloadedSongSelect={(config) => {
            onPreloadedSongSelect?.(config)
            setFocusedPanel('config')
          }}
          onSongSelect={(us) => {
            onSongSelect?.(us)
            setFocusedPanel('config')
          }}
          onDeleteSong={handleDeleteSong}
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
            isFocused={focusedPanel === 'config'}
            onFocusUp={() => setFocusedPanel('grid')}
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
