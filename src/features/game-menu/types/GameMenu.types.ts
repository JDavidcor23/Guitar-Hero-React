import type { SongData, SongMetadata } from '../../gameplay/types/GuitarGame.types'
import type { InstrumentInfo } from '../hooks/useSongLoader.hook'

/** Props for the GameMenu component */
export interface GameMenuProps {
  /** Currently loaded song (null if none) */
  song: SongData | null
  /** File loading error (null if none) */
  error: string | null
  /** Whether a file is being loaded */
  isLoading: boolean
  /** Whether audio is loaded */
  isAudioLoaded: boolean
  /** Whether audio is currently loading */
  isAudioLoading: boolean
  /** Audio error (null if none) */
  audioError: string | null
  /** Number of loaded audio stems */
  stemsLoaded?: number
  /** Available difficulty levels from the .chart file */
  availableDifficulties: string[]
  /** Available instruments from the MIDI file */
  availableInstruments?: InstrumentInfo[]
  /** Currently selected instrument */
  currentInstrument?: string
  /** Callback when the user selects a .chart file */
  onChartFileSelect: (file: File) => void
  /** Callback when the user selects an audio file */
  onAudioFileSelect: (file: File) => void
  /** Callback when the user selects a song folder */
  onFolderSelect?: (files: FileList) => void
  /** Callback when the user changes the difficulty */
  onDifficultyChange: (difficulty: string) => void
  /** Callback when the user changes the instrument */
  onInstrumentChange?: (trackName: string) => void
  /** Callback when the user selects a preloaded song */
  onPreloadedSongSelect?: (config: {
    chartUrl: string
    audioUrl?: string
    stemsUrls?: string[]
    metadata?: Partial<SongMetadata>
  }) => void
  /** Callback when the user wants to start the game */
  onStartGame: () => void
  /** Callback when the user re-selects an already-loaded song */
  onSongSelect?: (song: SongData) => void
}

/** A song manually loaded by the user via folder selection */
export interface UserLoadedSong {
  id: string
  name: string
  artist: string
  /** Full song data to restore when re-selected */
  songData: SongData
  /** Album cover image URL */
  coverImage?: string
  /** Audio source URL(s) */
  audioSrc?: string | string[]
}

/** A preloaded song discovered from the assets folder */
export interface PreloadedSong {
  id: string
  name: string
  artist: string
  art?: string
  config: {
    chartUrl?: string
    audioUrl?: string
    stemsUrls: string[]
    metadata: Partial<SongMetadata>
  }
}
