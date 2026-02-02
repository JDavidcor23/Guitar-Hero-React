import { useEffect, useRef } from 'react'
import type { GameStats, SongData } from '../gameplay/types/GuitarGame.types'
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
  // Ref para evitar guardar la puntuación múltiples veces
  const scoreSavedRef = useRef(false)

  // Guardar puntuación al montar el componente
  useEffect(() => {
    if (onSaveScore && !scoreSavedRef.current) {
      scoreSavedRef.current = true
      onSaveScore(stats)
    }
  }, [onSaveScore, stats])

  /**
   * Calcula el porcentaje de accuracy
   * (Perfect + Good + OK) / Total notas * 100
   */
  const calculateAccuracy = (): number => {
    const totalHits = stats.perfects + stats.goods + stats.oks
    const totalNotes = totalHits + stats.misses
    if (totalNotes === 0) return 0
    return Math.round((totalHits / totalNotes) * 100)
  }

  /**
   * Determina el "rango" basado en el accuracy
   */
  const getRank = (accuracy: number): { letter: string; color: string } => {
    if (accuracy >= 95) return { letter: 'S', color: '#FFD700' } // Oro
    if (accuracy >= 90) return { letter: 'A', color: '#00FF00' } // Verde
    if (accuracy >= 80) return { letter: 'B', color: '#88FF00' } // Verde-amarillo
    if (accuracy >= 70) return { letter: 'C', color: '#FFFF00' } // Amarillo
    if (accuracy >= 60) return { letter: 'D', color: '#FF8800' } // Naranja
    return { letter: 'F', color: '#FF0000' } // Rojo
  }

  const accuracy = calculateAccuracy()
  const rank = getRank(accuracy)

  return (
    <div className="game-results">
      {/* Título */}
      <h1 className="game-results__title">CANCION COMPLETADA</h1>

      {/* Nombre de la canción */}
      <h2 className="game-results__song-name">{song.metadata.songName}</h2>
      {song.metadata.artist && (
        <p className="game-results__song-artist">{song.metadata.artist}</p>
      )}
      {playerName && (
        <p className="game-results__player-name">Jugador: {playerName}</p>
      )}

      {/* Rango */}
      <div className="game-results__rank" style={{ color: rank.color }}>
        {rank.letter}
      </div>

      {/* Puntuación */}
      <div className="game-results__score">
        <span className="game-results__score-value">{stats.score.toLocaleString()}</span>
        <span className="game-results__score-label">Puntuacion</span>
      </div>

      {/* Stats principales */}
      <div className="game-results__main-stats">
        <div className="game-results__stat">
          <span className="game-results__stat-value">{accuracy}%</span>
          <span className="game-results__stat-label">Accuracy</span>
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

      {/* Botones */}
      <div className="game-results__buttons">
        <button
          type="button"
          onClick={onPlayAgain}
          className="game-results__button game-results__button--play-again"
        >
          Jugar de Nuevo
        </button>
        <button
          type="button"
          onClick={onBackToMenu}
          className="game-results__button game-results__button--menu"
        >
          Cambiar Cancion
        </button>
      </div>
    </div>
  )
}
