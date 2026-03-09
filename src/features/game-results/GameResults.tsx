import type { GameStats, SongData } from '../gameplay/types/GuitarGame.types'
import { useGameResults } from './hooks/useGameResults.hook'
import './GameResults.css'

// ==========================================
// TIPOS PARA LOS PROPS DEL COMPONENTE
// ==========================================

interface GameResultsProps {
  /** Estadísticas finales del juego */
  stats: GameStats
  /** Info de la canción jugada */
  song: SongData
  /** Callback para jugar de nuevo la misma canción */
  onPlayAgain: () => void
  /** Callback para volver al menú y elegir otra canción */
  onBackToMenu: () => void
  /** Callback para guardar la puntuación (opcional) */
  onSaveScore?: (stats: GameStats) => void
  /** Nombre del jugador actual (opcional) */
  playerName?: string
}

/**
 * Componente de pantalla de resultados
 *
 * Muestra:
 * - Nombre de la canción
 * - Puntuación final
 * - Accuracy (porcentaje de aciertos)
 * - Max combo
 * - Desglose de Perfect/Good/OK/Miss
 * - Botones para jugar de nuevo o volver al menú
 */
export const GameResults = ({ stats, song, onPlayAgain, onBackToMenu, onSaveScore, playerName }: GameResultsProps) => {
  const { accuracy, rank, hasSustains, focusedIndex } = useGameResults({
    stats,
    onPlayAgain,
    onBackToMenu,
    onSaveScore,
  })

  return (
    <div className="game-results">
      {/* Título */}
      <h1 className="game-results__title">CANCIÓN COMPLETADA</h1>

      {/* Nombre de la canción */}
      <h2 className="game-results__song-name">{song.metadata.songName}</h2>
      {song.metadata.artist ? (
        <p className="game-results__song-artist">{song.metadata.artist}</p>
      ) : null}
      {playerName ? (
        <p className="game-results__player-name">🎸 {playerName}</p>
      ) : null}

      {/* Rango */}
      <div className={`game-results__rank game-results__rank--${rank.letter.toLowerCase()}`}>
        {rank.letter}
      </div>

      {/* Puntuación */}
      <div className="game-results__score">
        <span className="game-results__score-value">{stats.score.toLocaleString()}</span>
        <span className="game-results__score-label">Puntuación</span>
      </div>

      {/* Stats principales */}
      <div className="game-results__main-stats">
        <div className="game-results__stat">
          <span className="game-results__stat-value">{accuracy}%</span>
          <span className="game-results__stat-label">Precisión</span>
        </div>
        <div className="game-results__stat">
          <span className="game-results__stat-value">x{stats.maxCombo}</span>
          <span className="game-results__stat-label">Max Combo</span>
        </div>
      </div>

      {/* Desglose de hits */}
      <div className="game-results__breakdown">
        <div className="game-results__hit game-results__hit--perfect">
          <span className="game-results__hit-count">{stats.perfects}</span>
          <span className="game-results__hit-label">Perfect</span>
        </div>
        <div className="game-results__hit game-results__hit--good">
          <span className="game-results__hit-count">{stats.goods}</span>
          <span className="game-results__hit-label">Good</span>
        </div>
        <div className="game-results__hit game-results__hit--ok">
          <span className="game-results__hit-count">{stats.oks}</span>
          <span className="game-results__hit-label">OK</span>
        </div>
        <div className="game-results__hit game-results__hit--miss">
          <span className="game-results__hit-count">{stats.misses}</span>
          <span className="game-results__hit-label">Miss</span>
        </div>
      </div>

      {/* Stats de sustains (solo si hubo sustains) */}
      {hasSustains ? (
        <div className="game-results__sustain-stats">
          <div className="game-results__sustain-stat">
            <span className="game-results__sustain-value">{stats.sustainsHit}</span>
            <span className="game-results__sustain-label">Sustains</span>
          </div>
          <div className="game-results__sustain-stat">
            <span className="game-results__sustain-value">{stats.sustainsComplete}</span>
            <span className="game-results__sustain-label">Completos</span>
          </div>
          <div className="game-results__sustain-stat">
            <span className="game-results__sustain-value">{stats.sustainsDropped}</span>
            <span className="game-results__sustain-label">Soltados</span>
          </div>
        </div>
      ) : null}

      {/* Botones */}
      <div className="game-results__buttons">
        <button
          type="button"
          onClick={onPlayAgain}
          className={`game-results__button game-results__button--play-again ${focusedIndex === 0 ? 'game-results__button--focused' : ''}`}
        >
          ▶ Jugar de Nuevo
        </button>
        <button
          type="button"
          onClick={onBackToMenu}
          className={`game-results__button game-results__button--menu ${focusedIndex === 1 ? 'game-results__button--focused' : ''}`}
        >
          ♫ Cambiar Canción
        </button>
      </div>
    </div>
  )
}

