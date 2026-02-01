import type { SongData } from '../types/GuitarGame.types'
import type { InstrumentInfo } from '../hooks/useSongLoader.hook'
import { AudioFormatHelp } from './AudioFormatHelp'
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
  /** Número de stems de audio cargados */
  stemsLoaded?: number
  /** Dificultades disponibles en el archivo .chart */
  availableDifficulties: string[]
  /** Instrumentos disponibles en el archivo MIDI */
  availableInstruments?: InstrumentInfo[]
  /** Instrumento actualmente seleccionado */
  currentInstrument?: string
  /** Callback cuando el usuario selecciona un archivo .chart */
  onChartFileSelect: (file: File) => void
  /** Callback cuando el usuario selecciona un archivo de audio */
  onAudioFileSelect: (file: File) => void
  /** Callback cuando el usuario selecciona una carpeta de canción */
  onFolderSelect?: (files: FileList) => void
  /** Callback cuando el usuario cambia la dificultad */
  onDifficultyChange: (difficulty: string) => void
  /** Callback cuando el usuario cambia el instrumento */
  onInstrumentChange?: (trackName: string) => void
  /** Callback cuando el usuario quiere empezar a jugar */
  onStartGame: () => void
}

/**
 * Componente del menú principal
 *
 * Carga archivos .chart/.mid de Clone Hero con selector de dificultad
 * Soporta cargar carpetas completas con chart + audio stems
 */
export const GameMenu = ({
  song,
  error,
  isLoading,
  isAudioLoaded,
  isAudioLoading,
  audioError,
  stemsLoaded = 0,
  availableDifficulties,
  availableInstruments = [],
  currentInstrument = 'PART GUITAR',
  onChartFileSelect,
  onAudioFileSelect,
  onFolderSelect,
  onDifficultyChange,
  onInstrumentChange,
  onStartGame,
}: GameMenuProps) => {
  /**
   * Maneja el cambio del input file .chart
   */
  const handleChartFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onChartFileSelect(file)
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
   * Maneja la selección de una carpeta de canción
   */
  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && onFolderSelect) {
      onFolderSelect(files)
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
  const canStartGame = song !== null

  return (
    <div className="game-menu">
      {/* Título */}
      <h1 className="game-menu__title">Guitar Hero React</h1>
      <p className="game-menu__subtitle">Selecciona una cancion para jugar</p>

      {/* Sección de carga de archivos */}
      <div className="game-menu__load-section">
        {/* ======================================
            OPCIÓN 1: CARGAR CARPETA COMPLETA
            ====================================== */}
        {onFolderSelect && (
          <>
            <div className="game-menu__file-group game-menu__file-group--primary">
              <span className="game-menu__file-label">Carpeta de canción:</span>

              {/* Input carpeta oculto */}
              <input
                type="file"
                id="folder-input"
                onChange={handleFolderChange}
                className="game-menu__file-input"
                {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              />

              {/* Botón para cargar carpeta */}
              <label htmlFor="folder-input" className="game-menu__button game-menu__button--folder">
                {isLoading || isAudioLoading ? 'Cargando...' : 'Seleccionar Carpeta'}
              </label>
            </div>

            <div className="game-menu__divider">
              <span>o carga archivos individuales</span>
            </div>
          </>
        )}

        {/* ======================================
            OPCIÓN 2: CARGAR ARCHIVO .CHART/.MID
            ====================================== */}
        <div className="game-menu__file-group">
          <span className="game-menu__file-label">1. Archivo de chart:</span>

          {/* Input file oculto */}
          <input
            type="file"
            id="chart-file"
            accept=".chart,.txt,.mid,.midi"
            onChange={handleChartFileChange}
            className="game-menu__file-input"
          />

          {/* Botón para cargar .chart */}
          <label htmlFor="chart-file" className="game-menu__button game-menu__button--file">
            {isLoading ? 'Cargando...' : song ? 'Cambiar Chart' : 'Seleccionar Chart'}
          </label>

          {/* Estado del .chart */}
          {song && (
            <span className="game-menu__status game-menu__status--success">Cargado</span>
          )}
        </div>

        {/* ======================================
            SELECTOR DE INSTRUMENTO
            ====================================== */}
        {song && availableInstruments.length > 1 && onInstrumentChange && (
          <div className="game-menu__instrument-selector">
            <span className="game-menu__file-label">Instrumento:</span>
            <select
              onChange={(e) => onInstrumentChange(e.target.value)}
              value={currentInstrument}
              className="game-menu__select"
            >
              {availableInstruments.map((inst) => (
                <option key={inst.trackName} value={inst.trackName}>
                  {inst.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ======================================
            SELECTOR DE DIFICULTAD
            ====================================== */}
        {song && availableDifficulties.length > 1 && (
          <div className="game-menu__difficulty-selector">
            <span className="game-menu__file-label">Dificultad:</span>
            <select
              onChange={(e) => onDifficultyChange(e.target.value)}
              value={song.metadata.difficulty?.toLowerCase()}
              className="game-menu__select"
            >
              {availableDifficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ======================================
            CARGAR ARCHIVO DE AUDIO
            ====================================== */}
        <div className="game-menu__file-group">
          <span className="game-menu__file-label">2. Archivo de audio (opcional):</span>

          {/* Input file oculto */}
          <input
            type="file"
            id="audio-file"
            accept=".mp3,.wav,.ogg,.m4a,.opus,.flac"
            onChange={handleAudioFileChange}
            className="game-menu__file-input"
          />

          {/* Botón para cargar audio */}
          <label htmlFor="audio-file" className="game-menu__button game-menu__button--file">
            {isAudioLoading
              ? 'Cargando...'
              : isAudioLoaded
                ? 'Cambiar Audio'
                : 'Seleccionar Audio'}
          </label>

          {/* Estado del audio */}
          {isAudioLoaded && (
            <span className="game-menu__status game-menu__status--success">
              {stemsLoaded > 1 ? `${stemsLoaded} stems` : 'Cargado'}
            </span>
          )}
          {!isAudioLoaded && !isAudioLoading && (
            <span className="game-menu__status game-menu__status--optional">
              Sin audio (silencio)
            </span>
          )}
        </div>
      </div>

      {/* Mensajes de error */}
      {error && <p className="game-menu__error">{error}</p>}
      {audioError && (
        <>
          <p className="game-menu__error">{audioError}</p>
          <AudioFormatHelp />
        </>
      )}

      {/* Info de la canción cargada */}
      {song && (
        <div className="game-menu__song-info">
          <h2 className="game-menu__song-name">{song.metadata.songName}</h2>
          {song.metadata.artist && (
            <p className="game-menu__song-artist">{song.metadata.artist}</p>
          )}
          {song.metadata.charter && (
            <p className="game-menu__song-charter">Charter: {song.metadata.charter}</p>
          )}

          {/* Indicadores de dificultad del chart */}
          <div className="game-menu__difficulty-indicators">
            {/* Dificultad general del chart (0-6) */}
            {song.metadata.chartDifficulty !== undefined && song.metadata.chartDifficulty >= 0 && (
              <div className="game-menu__indicator">
                <span className="game-menu__indicator-label">Dificultad Chart:</span>
                <span
                  className={`game-menu__indicator-value game-menu__chart-diff-${Math.min(6, song.metadata.chartDifficulty)}`}
                >
                  {
                    [
                      '⭐ Muy Fácil',
                      '⭐ Fácil',
                      '⭐⭐ Fácil+',
                      '⭐⭐ Medio',
                      '⭐⭐⭐ Medio+',
                      '⭐⭐⭐ Difícil',
                      '⭐⭐⭐⭐ Muy Difícil',
                    ][Math.min(6, song.metadata.chartDifficulty)] || 'N/A'
                  }
                </span>
              </div>
            )}

            {/* NPS Promedio */}
            {song.metadata.averageNPS !== undefined && (
              <div className="game-menu__indicator">
                <span className="game-menu__indicator-label">NPS Promedio:</span>
                <span className="game-menu__indicator-value">{song.metadata.averageNPS}</span>
              </div>
            )}

            {/* NPS Máximo */}
            {song.metadata.maxNPS !== undefined && (
              <div className="game-menu__indicator">
                <span className="game-menu__indicator-label">NPS Máximo:</span>
                <span className="game-menu__indicator-value">{song.metadata.maxNPS}</span>
              </div>
            )}
          </div>

          {/* Estado de carga */}
          <div className="game-menu__load-status">
            <div className="game-menu__load-item">
              <span className="game-menu__load-icon game-menu__load-icon--success">&#10003;</span>
              <span>Chart cargado</span>
            </div>
            <div className="game-menu__load-item">
              <span
                className={`game-menu__load-icon ${isAudioLoaded ? 'game-menu__load-icon--success' : 'game-menu__load-icon--pending'}`}
              >
                {isAudioLoaded ? '\u2713' : '\u2014'}
              </span>
              <span>
                {isAudioLoaded
                  ? stemsLoaded > 1
                    ? `Audio (${stemsLoaded} pistas)`
                    : 'Audio cargado'
                  : 'Sin audio'}
              </span>
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
