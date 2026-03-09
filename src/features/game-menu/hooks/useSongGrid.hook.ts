import { useState } from 'react'
import type { SongData, SongMetadata } from '../../gameplay/types/GuitarGame.types'
import type { UserLoadedSong } from '../types/GameMenu.types'
import { PRELOADED_SONGS } from '../utils/preloadedSongs'
import { useGamepadNavigation } from '../../../hooks/useGamepadNavigation'

interface UseSongGridOptions {
  song: SongData | null
  userSongs: UserLoadedSong[]
  isFocused?: boolean
  onFocusDown?: () => void
  onPreloadedSongSelect?: (config: {
    chartUrl: string
    audioUrl?: string
    stemsUrls?: string[]
    metadata?: Partial<SongMetadata>
  }) => void
  onSongSelect?: (song: UserLoadedSong) => void
}

export const useSongGrid = ({
  song,
  userSongs,
  isFocused = false,
  onFocusDown,
  onPreloadedSongSelect,
  onSongSelect,
}: UseSongGridOptions) => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const totalSongs = PRELOADED_SONGS.length + userSongs.length

  const handleSelect = (idx: number) => {
    if (idx < PRELOADED_SONGS.length) {
      const ps = PRELOADED_SONGS[idx]
      if (ps.config.chartUrl) {
        onPreloadedSongSelect?.(ps.config as {
          chartUrl: string
          audioUrl?: string
          stemsUrls?: string[]
          metadata?: Partial<SongMetadata>
        })
      }
    } else {
      const us = userSongs[idx - PRELOADED_SONGS.length]
      onSongSelect?.(us)
    }
  }

  useGamepadNavigation({
    enabled: isFocused,
    onLeft: () => setFocusedIndex(prev => Math.max(0, prev - 1)),
    onRight: () => setFocusedIndex(prev => Math.min(Math.max(0, totalSongs - 1), prev + 1)),
    onDown: () => {
      // Si hay una canción seleccionada, permitir moverse al panel inferior
      if (song) {
        onFocusDown?.()
      }
    },
    onUp: () => {}, // Disable going up out of the grid for now
    onConfirm: () => handleSelect(focusedIndex)
  })

  return {
    focusedIndex,
  }
}
