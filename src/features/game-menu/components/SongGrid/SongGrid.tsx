import type { SongData, SongMetadata } from '../../../gameplay/types/GuitarGame.types'
import type { PreloadedSong, UserLoadedSong } from '../../types/GameMenu.types'
import { PRELOADED_SONGS } from '../../utils/preloadedSongs'
import { CassettePlayer } from '../CassettePlayer/CassettePlayer'

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
  onSongSelect?: (song: SongData) => void
  /** Callback to delete a user-loaded song */
  onDeleteSong?: (id: string) => void
}

/** Cassette grid showing all available songs (preloaded + user-loaded) */
export const SongGrid = ({
  song,
  userSongs,
  onPreloadedSongSelect,
  onSongSelect,
  onDeleteSong,
}: SongGridProps) => (
  <div className="game-menu__preloaded-section">
    <h2 className="game-menu__section-title">
      <span className="game-menu__section-icon">🎵</span>
      Available Songs
    </h2>

    <div className="game-menu__cassette-grid">
      {/* Preloaded songs */}
      {PRELOADED_SONGS.map((ps: PreloadedSong) => (
        <div
          key={ps.id}
          className={`game-menu__cassette-wrapper ${song?.metadata.songName === ps.name ? 'game-menu__cassette-wrapper--active' : ''}`}
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
      {userSongs.map((us) => (
        <div
          key={us.id}
          className={`game-menu__cassette-wrapper ${song?.metadata.songName === us.name ? 'game-menu__cassette-wrapper--active' : ''}`}
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
                onSongSelect?.(us.songData)
              }
            }}
          />
          {song?.metadata.songName === us.name && (
            <div className="game-menu__selection-badge">✓ SELECCIONADA</div>
          )}
        </div>
      ))}
    </div>
  </div>
)
