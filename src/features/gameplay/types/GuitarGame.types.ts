export interface Lane {
  x: number
  color: string
}

export interface Note {
  lane: number
  y: number
  active: boolean
  hit: boolean // true cuando el jugador acertó la nota
}

/**
 * Resultado posible al presionar una tecla
 * 'perfect' | 'good' | 'ok' | 'miss' | null (no había nota)
 */
export type HitResult = 'perfect' | 'good' | 'ok' | 'miss' | null

/**
 * Estado del feedback visual
 * Guarda qué texto mostrar y cuándo desaparece
 */
export interface FeedbackState {
  result: HitResult // El texto a mostrar
  expireTime: number // Cuándo desaparece (timestamp)
}

/**
 * Estado del flash de cada carril
 * Guarda cuándo termina el flash de cada carril
 */
export interface LaneFlashState {
  [lane: number]: number // lane → timestamp cuando expira el flash
}

export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  hitZoneY: number
  noteRadius: number
  laneWidth: number
  noteSpeed: number
}

/**
 * Estado del score y estadísticas del juego
 */
export interface GameStats {
  score: number // Score total
  combo: number // Combo actual
  maxCombo: number // Mejor combo de la partida
  perfects: number // Contador de PERFECT
  goods: number // Contador de GOOD
  oks: number // Contador de OK
  misses: number // Contador de MISS
  // Estadísticas de Notes sostenidas
  sustainsHit: number // Sustains iniciados correctamente
  sustainsComplete: number // Sustains completados (100%)
  sustainsDropped: number // Sustains Released antes de tiempo
}

/**
 * Información del último hit para mostrar en el HUD
 */
export interface LastHitInfo {
  result: HitResult
  points: number // Puntos ganados (con multiplicador)
  expireTime: number
}

// ==========================================
// PASO 4: TIPOS PARA CARGAR CANCIONES
// ==========================================

/**
 * Estados posibles del juego
 * - menu: Pantalla de selección de canción
 * - countdown: Cuenta regresiva antes de empezar (3, 2, 1, GO!)
 * - playing: Jugando la canción
 * - paused: Juego pausado (SPACE)
 * - finished: Canción terminada, mostrando resultados
 */
export type GameState = 'menu' | 'countdown' | 'playing' | 'paused' | 'finished'

/**
 * A note exactly as it comes from the JSON or parser
 */
export interface SongNote {
  second: number // Exact moment in seconds when it should be hit
  lane: number // 0-4 (green, red, yellow, blue, orange)
  duration?: number // Duration in seconds for sustained notes (0 or undefined = normal note)
}

/**
 * Song Metadata
 */
export interface SongMetadata {
  songName: string // Song name
  artist?: string // Artist (optional)
  charter?: string // Charter name
  duration: number // Total duration in seconds
  totalNotes: number // Total number of notes
  difficulty?: string // easy, medium, hard, expert (optional)
  chartDifficulty?: number // General difficulty (0-6)
  averageNPS?: number // Average NPS
  maxNPS?: number // Max NPS
  albumArt?: string // Album art URL or path (optional)
}

/**
 * Complete structure of a loaded song
 */
export interface SongData {
  metadata: SongMetadata
  notes: SongNote[]
}

/**
 * A game note (extended with properties for gameplay)
 * Combines parsed info with state during the game
 */
export interface GameNote {
  second: number // When it should be hit
  lane: number // In which lane
  y: number // Current Y position
  spawned: boolean // Appeared on screen
  hit: boolean // Player hit it
  missed: boolean // Player missed it
  // Properties for sustained notes
  duration: number // Duration in seconds (0 = normal note)
  sustainActive?: boolean // Player is holding this note
  sustainComplete?: boolean // Player completed the sustain
  sustainReleased?: boolean // Player released early
}

/**
 * Estado completo de una partida
 */
export interface GameSession {
  state: GameState // Estado actual del juego
  song: SongData | null // Canción cargada (null si no hay)
  gameTime: number // Tiempo transcurrido desde que empezó (segundos)
  stats: GameStats // Estadísticas de la partida
}
