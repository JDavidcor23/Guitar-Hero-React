import { useState, useEffect } from 'react'
import type { SongData } from '../../../gameplay/types/GuitarGame.types'
import type { InstrumentInfo } from '../../hooks/useSongLoader.hook'
import { getInstrumentIconClass } from '../../utils/preloadedSongs'
import { DIFFICULTY_STARS, MAX_CHART_DIFFICULTY } from '../../constants/gameMenu.constants'
import { useGamepadNavigation } from '../../../../hooks/useGamepadNavigation'

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
  /** Whether the config panel has gamepad focus */
  isFocused?: boolean
  /** Request focus to shift back up (to grid) */
  onFocusUp?: () => void
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
  isFocused = false,
  onFocusUp,
}: SongConfigProps) => {

  const hasInstruments = availableInstruments.length > 0 && onInstrumentChange !== undefined
  const hasDifficulties = availableDifficulties.length > 1
  
  const getAvailableRows = () => {
    const r = []
    if (hasInstruments) r.push(0)
    if (hasDifficulties) r.push(1)
    r.push(2)
    return r
  }
  const rows = getAvailableRows()

  const [focusedRow, setFocusedRow] = useState(rows[0])

  useEffect(() => {
    if (!rows.includes(focusedRow)) {
      setFocusedRow(rows[0])
    }
  }, [hasInstruments, hasDifficulties, focusedRow])

  const handleUp = () => {
    const currentIndex = rows.indexOf(focusedRow)
    if (currentIndex > 0) {
      setFocusedRow(rows[currentIndex - 1])
    } else if (currentIndex === 0) {
      onFocusUp?.()
    }
  }

  const handleDown = () => {
    const currentIndex = rows.indexOf(focusedRow)
    if (currentIndex < rows.length - 1) {
      setFocusedRow(rows[currentIndex + 1])
    }
  }

  const handleLeft = () => {
    if (focusedRow === 0 && hasInstruments && onInstrumentChange) {
      const idx = availableInstruments.findIndex(i => i.trackName === currentInstrument)
      if (idx > 0) onInstrumentChange(availableInstruments[idx - 1].trackName)
    } else if (focusedRow === 1 && hasDifficulties) {
      const diffStr = song.metadata.difficulty?.toLowerCase()
      const idx = availableDifficulties.findIndex(d => d === diffStr)
      if (idx > 0) onDifficultyChange(availableDifficulties[idx - 1])
    }
  }

  const handleRight = () => {
    if (focusedRow === 0 && hasInstruments && onInstrumentChange) {
      const idx = availableInstruments.findIndex(i => i.trackName === currentInstrument)
      if (idx >= 0 && idx < availableInstruments.length - 1) onInstrumentChange(availableInstruments[idx + 1].trackName)
    } else if (focusedRow === 1 && hasDifficulties) {
      const diffStr = song.metadata.difficulty?.toLowerCase()
      const idx = availableDifficulties.findIndex(d => d === diffStr)
      if (idx >= 0 && idx < availableDifficulties.length - 1) onDifficultyChange(availableDifficulties[idx + 1])
    }
  }

  const handleConfirm = () => {
    if (focusedRow === 2 && canStartGame) {
      onStartGame()
    }
  }

  useGamepadNavigation({
    enabled: isFocused,
    onUp: handleUp,
    onDown: handleDown,
    onLeft: handleLeft,
    onRight: handleRight,
    onConfirm: handleConfirm,
    onCancel: () => onFocusUp?.()
  })

  return (
  <div className="game-menu__song-config">
    {/* Main Glass Panel */}
    <div className="game-menu__config-panel">
      
      {/* Header */}
      <div className="game-menu__song-header">
        <h2 className="game-menu__song-name">{song.metadata.songName}</h2>
        <div className="game-menu__song-meta">
          {song.metadata.artist && (
            <span className="game-menu__song-artist">{song.metadata.artist}</span>
          )}
          {song.metadata.artist && song.metadata.charter && (
            <span className="game-menu__meta-separator">•</span>
          )}
          {song.metadata.charter && (
            <span className="game-menu__song-charter">Charter: {song.metadata.charter}</span>
          )}
        </div>
      </div>

      <div className="game-menu__panel-divider" />

      {/* Stats Grid */}
      <div className="game-menu__stats-grid">
        {(song.metadata.chartDifficulty !== undefined && song.metadata.chartDifficulty >= 0) && (
          <div className="game-menu__stat-card">
            <span className="game-menu__stat-label">Dificultad</span>
            <div className={`game-menu__stat-badge game-menu__chart-diff-${Math.min(MAX_CHART_DIFFICULTY, song.metadata.chartDifficulty)}`}>
              {DIFFICULTY_STARS[Math.min(MAX_CHART_DIFFICULTY, song.metadata.chartDifficulty)] || 'N/A'}
            </div>
          </div>
        )}
        
        {song.metadata.averageNPS !== undefined && (
          <div className="game-menu__stat-card">
            <span className="game-menu__stat-label">NPS Avg</span>
            <span className="game-menu__stat-value">{song.metadata.averageNPS.toFixed(1)}</span>
          </div>
        )}
        
        <div className="game-menu__stat-card">
          <span className="game-menu__stat-label">Duración</span>
          <span className="game-menu__stat-value">{formatDuration(song.metadata.duration)}</span>
        </div>

        <div className="game-menu__stat-card">
          <span className="game-menu__stat-label">Notas</span>
          <span className="game-menu__stat-value">{song.metadata.totalNotes}</span>
        </div>
        
        <div className="game-menu__stat-card game-menu__stat-card--full">
          <span className="game-menu__stat-label">Audio</span>
          <span className={`game-menu__stat-value ${!isAudioLoaded ? 'game-menu__stat-value--error' : 'game-menu__stat-value--success'}`}>
            {isAudioLoaded ? (stemsLoaded > 1 ? `✅ Multitrack (${stemsLoaded})` : '✅ Master') : '❌ Sin audio'}
          </span>
        </div>
      </div>

      {/* Selectors Section */}
      <div className="game-menu__selectors-container">
        {/* Instrument Selector */}
        {availableInstruments.length > 0 && onInstrumentChange && (
          <div className="game-menu__selector-group">
            <label className="game-menu__selector-label">Instrumento</label>
            <div className="game-menu__instruments">
              {availableInstruments.map((inst) => {
                const iconClass = getInstrumentIconClass(inst.trackName)
                const isActive = inst.trackName === currentInstrument
                return (
                  <button
                    key={inst.trackName}
                    type="button"
                    className={`game-menu__instrument-btn ${isActive ? 'game-menu__instrument-btn--active' : ''} ${isFocused && focusedRow === 0 && isActive ? 'game-menu__instrument-btn--focused' : ''}`}
                    onClick={() => onInstrumentChange(inst.trackName)}
                    title={inst.displayName}
                  >
                    <div className="game-menu__instrument-btn-ring" />
                    <div className={`avatar-icon avatar-icon--${iconClass}`} />
                    <span className="game-menu__instrument-name">{inst.displayName}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Difficulty Selector */}
        {availableDifficulties.length > 1 && (
          <div className="game-menu__selector-group">
            <label className="game-menu__selector-label">Nivel</label>
            <div className="game-menu__difficulties">
              {availableDifficulties.map((diff) => {
                const isActive = diff === song.metadata.difficulty?.toLowerCase()
                return (
                  <button
                    key={diff}
                    type="button"
                    className={`game-menu__difficulty-pill ${isActive ? 'game-menu__difficulty-pill--active' : ''} ${isFocused && focusedRow === 1 && isActive ? 'game-menu__difficulty-pill--focused' : ''}`}
                    onClick={() => onDifficultyChange(diff)}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Start Button */}
      <button
        type="button"
        onClick={onStartGame}
        disabled={!canStartGame}
        className={`game-menu__btn-start-modern ${!isAudioLoaded ? 'game-menu__btn-start-modern--warning' : ''} ${isFocused && focusedRow === 2 ? 'game-menu__btn-start-modern--focused' : ''}`}
      >
        <span className="game-menu__btn-start-glow"></span>
        <span className="game-menu__btn-start-icon">⚡</span>
        <span className="game-menu__btn-start-text">
          {isAudioLoaded ? 'INICIAR ROCK' : 'JUGAR SIN AUDIO'}
        </span>
      </button>

    </div>
  </div>
  )
}
