import { useState, useEffect, useRef } from 'react'
import type { SongData } from '../../gameplay/types/GuitarGame.types'
import type { UserLoadedSong } from '../types/GameMenu.types'
import { AUDIO_EXTENSIONS, IMAGE_EXTENSIONS, SECONDS_PER_MINUTE } from '../constants/gameMenu.constants'
import { PRELOADED_SONGS } from '../utils/preloadedSongs'

interface UseGameMenuParams {
  /** Currently loaded song from the parent */
  song: SongData | null
  /** Parent callback for chart file selection */
  onChartFileSelect: (file: File) => void
  /** Parent callback for audio file selection */
  onAudioFileSelect: (file: File) => void
  /** Parent callback for folder selection */
  onFolderSelect?: (files: FileList) => void
}

/**
 * Encapsulates all GameMenu business logic:
 * - Tracking user-loaded songs
 * - Handling file/folder input changes
 * - Formatting helpers
 * - Derived state
 */
export const useGameMenu = ({
  song,
  onChartFileSelect,
  onAudioFileSelect,
  onFolderSelect,
}: UseGameMenuParams) => {
  // Songs manually loaded by the user via folder selection
  const [userSongs, setUserSongs] = useState<UserLoadedSong[]>([])

  // Temporary storage for the assets discovered in the last folder upload
  const lastFolderAssets = useRef<{ coverImage?: string; audioSrc: string[] }>({ audioSrc: [] })

  // When a song is loaded manually, add it to the user songs list
  useEffect(() => {
    if (!song) return
    const songName = song.metadata.songName || 'Unknown Song'
    const artist = song.metadata.artist || 'Unknown Artist'

    const normalize = (s: string) => s.toLowerCase().trim()

    // Skip if it matches a preloaded song
    const isPreloaded = PRELOADED_SONGS.some(
      ps =>
        normalize(ps.name) === normalize(songName) ||
        normalize(ps.id) === normalize(songName) ||
        (song.metadata.artist &&
          normalize(ps.artist) === normalize(artist) &&
          normalize(ps.name) === normalize(songName)),
    )
    if (isPreloaded) return

    // Skip if already in the user songs list
    const alreadyExists = userSongs.some(
      us => normalize(us.name) === normalize(songName) && normalize(us.artist) === normalize(artist),
    )
    if (alreadyExists) return

    setUserSongs(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        name: songName,
        artist,
        songData: song,
        coverImage: lastFolderAssets.current.coverImage,
        audioSrc:
          lastFolderAssets.current.audioSrc.length > 1
            ? lastFolderAssets.current.audioSrc
            : lastFolderAssets.current.audioSrc[0] || '',
      },
    ])

    // Clear the ref after processing
    lastFolderAssets.current = { audioSrc: [] }
  }, [song])

  /** Handle chart file input change */
  const handleChartFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onChartFileSelect(file)
  }

  /** Handle audio file input change */
  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onAudioFileSelect(file)
  }

  /** Handle song folder input change — extracts cover art and audio URLs before delegating */
  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const assets: { coverImage?: string; audioSrc: string[] } = { audioSrc: [] }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const name = file.name.toLowerCase()
      const ext = name.substring(name.lastIndexOf('.'))

      if ((AUDIO_EXTENSIONS as readonly string[]).includes(ext)) {
        assets.audioSrc.push(URL.createObjectURL(file))
      } else if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
        const url = URL.createObjectURL(file)
        if (name.includes('album') || name.includes('cover')) {
          assets.coverImage = url
        } else if (!assets.coverImage) {
          assets.coverImage = url
        }
      }
    }

    lastFolderAssets.current = assets
    onFolderSelect?.(files)
  }

  /** Format a duration in seconds to "M:SS" */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / SECONDS_PER_MINUTE)
    const secs = Math.floor(seconds % SECONDS_PER_MINUTE)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /** Whether there is enough data to start the game */
  const canStartGame = song !== null

  return {
    userSongs,
    handleChartFileChange,
    handleAudioFileChange,
    handleFolderChange,
    formatDuration,
    canStartGame,
  }
}
