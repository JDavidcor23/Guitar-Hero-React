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
