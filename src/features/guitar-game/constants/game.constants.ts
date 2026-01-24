import type { Lane, GameConfig } from '../types/GuitarGame.types'

export const GAME_CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600,
  hitZoneY: 500,
  noteRadius: 25,
  laneWidth: 80,
  noteSpeed: 200,
}

export const LANES: Lane[] = [
  { x: 100, color: '#00FF00' },  // Verde
  { x: 200, color: '#FF0000' },  // Rojo
  { x: 300, color: '#FFFF00' },  // Amarillo
  { x: 400, color: '#0088FF' },  // Azul
  { x: 500, color: '#FF8800' },  // Naranja
]

export const HIT_ZONE_LINE = {
  startX: 60,
  endX: 540,
}

export const NOTE_SHADOW_OFFSET = 3

export const NOTE_HIGHLIGHT = {
  offsetX: 8,
  offsetY: 8,
  radiusDivisor: 3,
}

export const COLORS = {
  background: '#000000',
  white: '#FFFFFF',
  shadow: '#000000',
  highlightAlpha: '40',
  laneAlpha: '40',
  laneBorderAlpha: '80',
  hitZoneFillAlpha: '30',
}

export const LINE_WIDTHS = {
  hitZoneLine: 3,
  laneBorder: 2,
  hitZoneCircle: 4,
}

export const INITIAL_NOTE_LANE = 2
export const TOTAL_LANES = 5

/**
 * Mapeo de teclas a carriles
 * Cuando presionas 'a', devuelve 0 (carril verde)
 * Cuando presionas 's', devuelve 1 (carril rojo)
 * etc.
 */
export const KEY_TO_LANE: Record<string, number> = {
  a: 0, // Verde
  s: 1, // Rojo
  d: 2, // Amarillo
  f: 3, // Azul
  j: 4, // Naranja
}

/**
 * Ventanas de tiempo para juzgar el timing
 * Son la distancia en pixels entre la nota y la zona de hit
 * Mientras más cerca, mejor el resultado
 */
export const HIT_WINDOWS = {
  perfect: 30, // ±30 pixels = PERFECT
  good: 60, // ±60 pixels = GOOD
  ok: 100, // ±100 pixels = OK
  // Fuera de 100 = MISS
}

/**
 * Duración de efectos visuales (en milisegundos)
 */
export const FEEDBACK_DURATION = {
  flash: 100, // Duración del flash al presionar tecla
  text: 500, // Duración del texto PERFECT/GOOD/etc
}
