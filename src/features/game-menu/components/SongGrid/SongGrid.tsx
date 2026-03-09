import { useState } from 'react'
import type { SongData, SongMetadata } from '../../../gameplay/types/GuitarGame.types'
import type { PreloadedSong, UserLoadedSong } from '../../types/GameMenu.types'
import { PRELOADED_SONGS } from '../../utils/preloadedSongs'
import { CassettePlayer } from '../CassettePlayer/CassettePlayer'
import { useGamepadNavigation } from '../../../../hooks/useGamepadNavigation'

interface SongGridProps {
  /** Currently loaded song (null if none) */
  song: SongData | null
  /** User-loaded songs from folder selection */
  userSongs: UserLoadedSong[]
  /** Callback when a preloaded song is selected */
  onPreloadedSongSelect?: (config: {
    chartUrl: string
    audioUrl?: string
    stemsUrls?: string[]
    metadata?: Partial<SongMetadata>
  }) => void
  /** Callback when a user-loaded song is re-selected */
  onSongSelect?: (song: UserLoadedSong) => void
  /** Callback to delete a user-loaded song */
  onDeleteSong?: (id: string) => void
  /** Whether the grid has gamepad focus */
  isFocused?: boolean
  /** Request focus to shift down (to the config panel) */
  onFocusDown?: () => void
}

export const SongGrid = ({
  song,
  userSongs,
  isFocused = false,
  onFocusDown,
  onPreloadedSongSelect,
  onSongSelect,
  onDeleteSong,
}: SongGridProps) => {
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

  return (
  <div className="game-menu__preloaded-section">
    <h2 className="game-menu__section-title">
      <span className="game-menu__section-icon">🎵</span>
      Available Songs
    </h2>

    <div className="game-menu__cassette-grid">
      {/* Preloaded songs */}
      {PRELOADED_SONGS.map((ps: PreloadedSong, index) => (
        <div
          key={ps.id}
          className={`game-menu__cassette-wrapper ${song?.metadata.songName === ps.name ? 'game-menu__cassette-wrapper--active' : ''} ${isFocused && focusedIndex === index ? 'game-menu__cassette-wrapper--focused' : ''}`}
        >
          <CassettePlayer
            title={ps.name}
            artist={ps.artist}
            coverImage={ps.art}
            audioSrc={ps.config.stemsUrls.length > 0 ? ps.config.stemsUrls : (ps.config.audioUrl || '')}
            icon1={
              <span title="Seleccionar para jugar" className="game-menu__icon-play">🎸</span>
            }
            onIconClick={(idx) => {
              if (idx === 1 && ps.config.chartUrl) {
                onPreloadedSongSelect?.(ps.config as {
                  chartUrl: string
                  audioUrl?: string
                  stemsUrls?: string[]
                  metadata?: Partial<SongMetadata>
                })
              }
            }}
          />
          {song?.metadata.songName === ps.name && (
            <div className="game-menu__selection-badge">✓ SELECCIONADA</div>
          )}
        </div>
      ))}

      {/* User-loaded songs */}
      {userSongs.map((us, idx) => {
        const index = PRELOADED_SONGS.length + idx
        return (
        <div
          key={us.id}
          className={`game-menu__cassette-wrapper ${song?.metadata.songName === us.name ? 'game-menu__cassette-wrapper--active' : ''} ${isFocused && focusedIndex === index ? 'game-menu__cassette-wrapper--focused' : ''}`}
        >
          {onDeleteSong && (
            <button
              className="game-menu__cassette-delete"
              title="Eliminar canción guardada"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteSong(us.id)
              }}
            >
              ✕
            </button>
          )}
          <CassettePlayer
            title={us.name}
            artist={us.artist}
            coverImage={us.coverImage}
            audioSrc={us.audioSrc}
            icon1={
              <span title="Seleccionar para jugar" className="game-menu__icon-play">📂</span>
            }
            onIconClick={(idx) => {
              if (idx === 1) {
                onSongSelect?.(us)
              }
            }}
          />
          {song?.metadata.songName === us.name && (
            <div className="game-menu__selection-badge">✓ SELECCIONADA</div>
          )}
        </div>
      )})}
    </div>
  </div>
  )
}
