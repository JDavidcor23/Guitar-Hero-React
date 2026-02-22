import type { SongData } from '../../../gameplay/types/GuitarGame.types'
import type { InstrumentInfo } from '../../hooks/useSongLoader.hook'
import { getInstrumentIconClass } from '../../utils/preloadedSongs'
import { DIFFICULTY_STARS, MAX_CHART_DIFFICULTY } from '../../constants/gameMenu.constants'

interface SongConfigProps {
  /** The currently loaded song */
  song: SongData
  /** Whether audio is loaded and ready */
  isAudioLoaded: boolean
  /** Number of loaded audio stems */
  stemsLoaded: number
  /** Available difficulty levels */
  availableDifficulties: string[]
  /** Available instruments */
  availableInstruments: InstrumentInfo[]
  /** Currently selected instrument track name */
  currentInstrument: string
  /** Whether the game can be started */
  canStartGame: boolean
  /** Format seconds into "M:SS" */
  formatDuration: (seconds: number) => string
  /** Callback when the user changes the difficulty */
  onDifficultyChange: (difficulty: string) => void
  /** Callback when the user changes the instrument */
  onInstrumentChange?: (trackName: string) => void
  /** Callback when the user clicks "Start" */
  onStartGame: () => void
}

/** Song configuration panel: info, instrument/difficulty selectors, and start button */
export const SongConfig = ({
  song,
  isAudioLoaded,
  stemsLoaded,
  availableDifficulties,
  availableInstruments,
  currentInstrument,
  canStartGame,
  formatDuration,
  onDifficultyChange,
  onInstrumentChange,
  onStartGame,
}: SongConfigProps) => (
  <div className="game-menu__song-config">
    {/* Song info */}
    <div className="game-menu__song-info">
      <div className="game-menu__song-header">
        <h2 className="game-menu__song-name">{song.metadata.songName}</h2>
        {song.metadata.artist && (
          <p className="game-menu__song-artist">{song.metadata.artist}</p>
        )}
        {song.metadata.charter && (
          <p className="game-menu__song-charter">Charter: {song.metadata.charter}</p>
        )}
      </div>

      {/* Chart difficulty indicators */}
      {(song.metadata.chartDifficulty !== undefined || song.metadata.averageNPS !== undefined) && (
        <div className="game-menu__difficulty-indicators">
          {song.metadata.chartDifficulty !== undefined && song.metadata.chartDifficulty >= 0 && (
            <div className="game-menu__indicator">
              <span className="game-menu__indicator-label">Dificultad</span>
              <span className={`game-menu__indicator-value game-menu__chart-diff-${Math.min(MAX_CHART_DIFFICULTY, song.metadata.chartDifficulty)}`}>
                {DIFFICULTY_STARS[Math.min(MAX_CHART_DIFFICULTY, song.metadata.chartDifficulty)] || 'N/A'}
              </span>
            </div>
          )}
          {song.metadata.averageNPS !== undefined && (
            <div className="game-menu__indicator">
              <span className="game-menu__indicator-label">NPS Avg</span>
              <span className="game-menu__indicator-value">{song.metadata.averageNPS}</span>
            </div>
          )}
          {song.metadata.maxNPS !== undefined && (
            <div className="game-menu__indicator">
              <span className="game-menu__indicator-label">NPS Max</span>
              <span className="game-menu__indicator-value">{song.metadata.maxNPS}</span>
            </div>
          )}
        </div>
      )}

      {/* Song details */}
      <div className="game-menu__song-details">
        <span>⏱ {formatDuration(song.metadata.duration)}</span>
        <span>🎵 {song.metadata.totalNotes} notas</span>
        {isAudioLoaded && (
          <span>🔊 {stemsLoaded > 1 ? `${stemsLoaded} pistas` : 'Audio OK'}</span>
        )}
        {!isAudioLoaded && <span className="game-menu__detail--muted">🔇 Sin audio</span>}
      </div>
    </div>

    {/* Instrument selector */}
    {availableInstruments.length > 0 && onInstrumentChange && (
      <div className="game-menu__instrument-section">
        <label className="game-menu__label">Instrumento</label>
        <div className="game-menu__instruments">
          {availableInstruments.map((inst) => {
            const iconClass = getInstrumentIconClass(inst.trackName)
            const isActive = inst.trackName === currentInstrument
            return (
              <button
                key={inst.trackName}
                type="button"
                className={`game-menu__instrument-btn ${isActive ? 'game-menu__instrument-btn--active' : ''}`}
                onClick={() => onInstrumentChange(inst.trackName)}
                title={inst.displayName}
              >
                <div className={`avatar-icon avatar-icon--${iconClass}`} />
                <span className="game-menu__instrument-name">{inst.displayName}</span>
              </button>
            )
          })}
        </div>
      </div>
    )}

    {/* Difficulty selector */}
    {availableDifficulties.length > 1 && (
      <div className="game-menu__difficulty-section">
        <label className="game-menu__label">Dificultad</label>
        <div className="game-menu__difficulties">
          {availableDifficulties.map((diff) => {
            const isActive = diff === song.metadata.difficulty?.toLowerCase()
            return (
              <button
                key={diff}
                type="button"
                className={`game-menu__difficulty-btn ${isActive ? 'game-menu__difficulty-btn--active' : ''}`}
                onClick={() => onDifficultyChange(diff)}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            )
          })}
        </div>
      </div>
    )}

    {/* Start button */}
    <button
      type="button"
      onClick={onStartGame}
      disabled={!canStartGame}
      className="game-menu__btn-start"
    >
      <span className="game-menu__btn-start-icon">⚡</span>
      <span>{isAudioLoaded ? 'EMPEZAR A JUGAR' : 'JUGAR SIN AUDIO'}</span>
    </button>
  </div>
)
