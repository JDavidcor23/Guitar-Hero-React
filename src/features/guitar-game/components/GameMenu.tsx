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
  /** Indica si el audio está cargado */
  isAudioLoaded: boolean
  /** Indica si está cargando el audio */
  isAudioLoading: boolean
  /** Error del audio (null si no hay error) */
  audioError: string | null
  /** Callback cuando el usuario selecciona un archivo JSON */
  onJsonFileSelect: (file: File) => void
  /** Callback cuando el usuario selecciona un archivo de audio */
  onAudioFileSelect: (file: File) => void
  /** Callback para cargar la canción de prueba (sin audio) */
  onLoadTestSong: () => void
  /** Callback cuando el usuario quiere empezar a jugar */
  onStartGame: () => void
}

/**
 * Componente del menú principal
 *
 * PASO 5: Ahora carga 2 archivos:
 * - Archivo JSON con las notas
 * - Archivo de audio (MP3, WAV, OGG)
 */
export const GameMenu = ({
  song,
  error,
  isLoading,
  isAudioLoaded,
  isAudioLoading,
  audioError,
  onJsonFileSelect,
  onAudioFileSelect,
  onLoadTestSong,
  onStartGame,
}: GameMenuProps) => {
  /**
   * Maneja el cambio del input file JSON
   */
  const handleJsonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onJsonFileSelect(file)
    }
  }

  /**
   * Maneja el cambio del input file de audio
   */
  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onAudioFileSelect(file)
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

  // Determinar si se puede empezar a jugar
  // Se puede jugar si hay canción cargada
  // El audio es opcional (para canción de prueba)
  const canStartGame = song !== null

  return (
    <div className="game-menu">
      {/* Título */}
      <h1 className="game-menu__title">Guitar Hero React</h1>
      <p className="game-menu__subtitle">Selecciona una cancion para jugar</p>

      {/* Sección de carga de archivos */}
      <div className="game-menu__load-section">
        {/* ======================================
            CARGAR ARCHIVO JSON
            ====================================== */}
        <div className="game-menu__file-group">
          <span className="game-menu__file-label">1. Archivo de notas (JSON):</span>

          {/* Input file oculto */}
          <input
            type="file"
            id="json-file"
            accept=".json"
            onChange={handleJsonFileChange}
            className="game-menu__file-input"
          />

          {/* Botón para cargar JSON */}
          <label htmlFor="json-file" className="game-menu__button game-menu__button--file">
            {isLoading ? 'Cargando...' : song ? 'Cambiar JSON' : 'Seleccionar JSON'}
          </label>

          {/* Estado del JSON */}
          {song && (
            <span className="game-menu__status game-menu__status--success">
              Cargado
            </span>
          )}
        </div>

        {/* ======================================
            CARGAR ARCHIVO DE AUDIO
            ====================================== */}
        <div className="game-menu__file-group">
          <span className="game-menu__file-label">2. Archivo de audio (opcional):</span>

          {/* Input file oculto */}
          <input
            type="file"
            id="audio-file"
            accept=".mp3,.wav,.ogg,.m4a"
            onChange={handleAudioFileChange}
            className="game-menu__file-input"
          />

          {/* Botón para cargar audio */}
          <label htmlFor="audio-file" className="game-menu__button game-menu__button--file">
            {isAudioLoading ? 'Cargando...' : isAudioLoaded ? 'Cambiar Audio' : 'Seleccionar Audio'}
          </label>

          {/* Estado del audio */}
          {isAudioLoaded && (
            <span className="game-menu__status game-menu__status--success">
              Cargado
            </span>
          )}
          {!isAudioLoaded && !isAudioLoading && (
            <span className="game-menu__status game-menu__status--optional">
              Sin audio (silencio)
            </span>
          )}
        </div>

        {/* Separador */}
        <div className="game-menu__divider">
          <span>o usa la cancion de prueba</span>
        </div>

        {/* Botón para canción de prueba */}
        <button
          type="button"
          onClick={onLoadTestSong}
          className="game-menu__button game-menu__button--secondary"
        >
          Usar cancion de prueba (sin audio)
        </button>
      </div>

      {/* Mensajes de error */}
      {error && <p className="game-menu__error">{error}</p>}
      {audioError && <p className="game-menu__error">{audioError}</p>}

      {/* Info de la canción cargada */}
      {song && (
        <div className="game-menu__song-info">
          <h2 className="game-menu__song-name">{song.metadata.songName}</h2>
          {song.metadata.artist && (
            <p className="game-menu__song-artist">{song.metadata.artist}</p>
          )}

          {/* Estado de carga */}
          <div className="game-menu__load-status">
            <div className="game-menu__load-item">
              <span className="game-menu__load-icon game-menu__load-icon--success">&#10003;</span>
              <span>JSON cargado</span>
            </div>
            <div className="game-menu__load-item">
              <span className={`game-menu__load-icon ${isAudioLoaded ? 'game-menu__load-icon--success' : 'game-menu__load-icon--pending'}`}>
                {isAudioLoaded ? '\u2713' : '\u2014'}
              </span>
              <span>{isAudioLoaded ? 'Audio cargado' : 'Sin audio'}</span>
            </div>
          </div>

          <div className="game-menu__song-details">
            <span>Duracion: {formatDuration(song.metadata.duration)}</span>
            <span>Notas: {song.metadata.totalNotes}</span>
            {song.metadata.difficulty && <span>Dificultad: {song.metadata.difficulty}</span>}
          </div>

          {/* Botón para empezar */}
          <button
            type="button"
            onClick={onStartGame}
            disabled={!canStartGame}
            className="game-menu__button game-menu__button--start"
          >
            {isAudioLoaded ? 'EMPEZAR A JUGAR' : 'JUGAR SIN AUDIO'}
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
        <p>
          <span className="game-menu__key">+</span>
          <span className="game-menu__key">-</span>
          - Ajustar sincronizacion
        </p>
      </div>
    </div>
  )
}
