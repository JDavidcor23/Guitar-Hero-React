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
  score: number // Puntuación total
  combo: number // Combo actual
  maxCombo: number // Mejor combo de la partida
  perfects: number // Contador de PERFECT
  goods: number // Contador de GOOD
  oks: number // Contador de OK
  misses: number // Contador de MISS
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
 * - paused: Juego pausado (ESPACIO)
 * - finished: Canción terminada, mostrando resultados
 */
export type GameState = 'menu' | 'countdown' | 'playing' | 'paused' | 'finished'

/**
 * Una nota tal como viene del JSON del Chart Generator
 * El JSON tiene: { segundo: 5.2, carril: 0 }
 */
export interface SongNote {
  segundo: number // Momento exacto en segundos cuando debe golpearse
  carril: number // 0-4 (verde, rojo, amarillo, azul, naranja)
}

/**
 * Metadata de la canción (viene del JSON)
 */
export interface SongMetadata {
  songName: string // Nombre de la canción
  artist?: string // Artista (opcional)
  duration: number // Duración total en segundos
  totalNotes: number // Cantidad total de notas
  difficulty?: string // easy, medium, hard, expert (opcional)
}

/**
 * Estructura completa de una canción cargada del JSON
 */
export interface SongData {
  metadata: SongMetadata
  notes: SongNote[]
}

/**
 * Una nota del juego (extendida con propiedades para el gameplay)
 * Combina la info del JSON con el estado durante el juego
 */
export interface GameNote {
  segundo: number // Cuándo debe golpearse (del JSON)
  carril: number // En qué carril (del JSON)
  y: number // Posición Y actual (calculada)
  spawned: boolean // Ya apareció en pantalla
  hit: boolean // El jugador la golpeó
  missed: boolean // El jugador la falló (pasó sin golpear)
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
