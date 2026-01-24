import type { SongData } from '../types/GuitarGame.types'
import './GameMenu.css'

// ==========================================
// TIPOS PARA LOS PROPS DEL COMPONENTE
// ==========================================

interface GameMenuProps {
  /** Canción actualmente cargada (null si no hay ninguna) */
  song: SongData | null
  /** Error al cargar archivo (null si no hay error) */
  error: string | null
  /** Indica si está cargando un archivo */
  isLoading: boolean
  /** Callback cuando el usuario selecciona un archivo */
  onFileSelect: (file: File) => void
  /** Callback para cargar la canción de prueba */
  onLoadTestSong: () => void
  /** Callback cuando el usuario quiere empezar a jugar */
  onStartGame: () => void
}

/**
 * Componente del menú principal
 *
 * Muestra:
 * - Título del juego
 * - Botón para cargar archivo JSON
 * - Botón para usar canción de prueba
 * - Info de la canción cargada (si hay)
 * - Botón para empezar a jugar
 */
export const GameMenu = ({
  song,
  error,
  isLoading,
  onFileSelect,
  onLoadTestSong,
  onStartGame,
}: GameMenuProps) => {
  /**
   * Maneja el cambio del input file
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  /**
   * Formatea la duración de segundos a "M:SS"
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="game-menu">
      {/* Título */}
      <h1 className="game-menu__title">Guitar Hero React</h1>
      <p className="game-menu__subtitle">Selecciona una cancion para jugar</p>

      {/* Sección de carga de archivos */}
      <div className="game-menu__load-section">
        {/* Input file oculto */}
        <input
          type="file"
          id="song-file"
          accept=".json"
          onChange={handleFileChange}
          className="game-menu__file-input"
        />

        {/* Botón para cargar archivo */}
        <label htmlFor="song-file" className="game-menu__button game-menu__button--primary">
          {isLoading ? 'Cargando...' : 'Cargar archivo JSON'}
        </label>

        {/* Separador */}
        <span className="game-menu__separator">o</span>

        {/* Botón para canción de prueba */}
        <button
          type="button"
          onClick={onLoadTestSong}
          className="game-menu__button game-menu__button--secondary"
        >
          Usar cancion de prueba
        </button>
      </div>

      {/* Mensaje de error */}
      {error && <p className="game-menu__error">{error}</p>}

      {/* Info de la canción cargada */}
      {song && (
        <div className="game-menu__song-info">
          <h2 className="game-menu__song-name">{song.metadata.songName}</h2>
          {song.metadata.artist && (
            <p className="game-menu__song-artist">{song.metadata.artist}</p>
          )}
          <div className="game-menu__song-details">
            <span>Duracion: {formatDuration(song.metadata.duration)}</span>
            <span>Notas: {song.metadata.totalNotes}</span>
            {song.metadata.difficulty && <span>Dificultad: {song.metadata.difficulty}</span>}
          </div>

          {/* Botón para empezar */}
          <button
            type="button"
            onClick={onStartGame}
            className="game-menu__button game-menu__button--start"
          >
            EMPEZAR A JUGAR
          </button>
        </div>
      )}

      {/* Instrucciones */}
      <div className="game-menu__instructions">
        <h3>Controles:</h3>
        <p>
          <span className="game-menu__key">A</span>
          <span className="game-menu__key">S</span>
          <span className="game-menu__key">D</span>
          <span className="game-menu__key">F</span>
          <span className="game-menu__key">J</span>
          - Golpear notas
        </p>
        <p>
          <span className="game-menu__key">ESPACIO</span> - Pausar
        </p>
      </div>
    </div>
  )
}
