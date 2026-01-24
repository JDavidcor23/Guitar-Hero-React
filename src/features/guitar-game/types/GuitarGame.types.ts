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
