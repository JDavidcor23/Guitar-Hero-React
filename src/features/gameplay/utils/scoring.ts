import type { HitResult } from '../types/GuitarGame.types'
import {
  COMBO_MULTIPLIERS,
  MULTIPLIER_COLORS,
  POINTS,
} from '../constants/game.constants'

/**
 * Resultado del cálculo de multiplicador
 */
export interface MultiplierInfo {
  multiplier: number
  color: string
}

/**
 * Calcula el multiplicador actual según el combo
 *
 * combo 0-9   → x1 (blanco)
 * combo 10-19 → x2 (amarillo)
 * combo 20-29 → x3 (naranja)
 * combo 30+   → x4 (rojo)
 */
export const getMultiplier = (combo: number): MultiplierInfo => {
  if (combo >= COMBO_MULTIPLIERS.x4.minCombo) {
    return { multiplier: COMBO_MULTIPLIERS.x4.multiplier, color: MULTIPLIER_COLORS.x4 }
  }
  if (combo >= COMBO_MULTIPLIERS.x3.minCombo) {
    return { multiplier: COMBO_MULTIPLIERS.x3.multiplier, color: MULTIPLIER_COLORS.x3 }
  }
  if (combo >= COMBO_MULTIPLIERS.x2.minCombo) {
    return { multiplier: COMBO_MULTIPLIERS.x2.multiplier, color: MULTIPLIER_COLORS.x2 }
  }
  return { multiplier: COMBO_MULTIPLIERS.x1.multiplier, color: MULTIPLIER_COLORS.x1 }
}

/**
 * Calcula los puntos ganados por un hit
 *
 * @param result - Tipo de hit (perfect, good, ok, miss)
 * @param combo - Combo actual (para calcular multiplicador)
 * @returns Puntos ganados = base × multiplicador
 */
export const calculatePoints = (result: HitResult, combo: number): number => {
  if (!result || result === 'miss') return 0
  const basePoints = POINTS[result]
  const { multiplier } = getMultiplier(combo)
  return basePoints * multiplier
}
