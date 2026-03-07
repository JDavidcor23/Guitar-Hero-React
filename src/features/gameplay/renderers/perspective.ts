import { GAME_CONFIG, SPAWN_Y } from '../constants/game.constants'

/**
 * Resultado de la proyección en perspectiva
 */
export interface PerspectivePoint {
  /** Coordenada X en pantalla */
  x: number
  /** Coordenada Y en pantalla */
  y: number
  /** Factor de escala (1 = tamaño real en el hit zone, <1 = más lejos) */
  scale: number
}

// ==========================================
// CONSTANTES DE PERSPECTIVA
// ==========================================

/** Distancia Z del plano más cercano (hit zone) */
const Z_NEAR = 2
/** Distancia Z del plano más lejano (spawn) */
const Z_FAR = 8
/** Posición Y del horizonte en pantalla */
const HORIZON_Y = 200
/** Factor global que controla qué tan ancho/grande se ve el highway */
const BASE_SCALE_MULTIPLIER = 1.4

/**
 * Convierte coordenadas abstractas (2D planas) a coordenadas de pantalla
 * con proyección en perspectiva 3D.
 *
 * El sistema funciona así:
 * - abstractY va desde SPAWN_Y (-50, arriba) hasta hitZoneY (625, abajo)
 * - Las notas lejanas (arriba) se ven pequeñas y centradas (punto de fuga)
 * - Las notas cercanas (abajo) se ven grandes y separadas
 *
 * @param x - Posición X abstracta (ej: lane.x = 300, 400, 500...)
 * @param abstractY - Posición Y abstracta (SPAWN_Y a hitZoneY)
 * @returns Coordenadas de pantalla y factor de escala
 */
export const getPerspective = (x: number, abstractY: number): PerspectivePoint => {
  // Normalizamos el progreso entre el spawn y la zona de hit (0 a 1)
  const progress = (abstractY - SPAWN_Y) / (GAME_CONFIG.hitZoneY - SPAWN_Y)

  // Interpolar Z: lejos (Z_FAR) → cerca (Z_NEAR)
  const Z = Z_FAR - progress * (Z_FAR - Z_NEAR)

  // Evitar valores negativos (detrás de la cámara)
  const safeZ = Math.max(Z, 0.1)
  const scale = Z_NEAR / safeZ

  // Proyección Y: horizonte → hitZone según escala
  const distanceY = GAME_CONFIG.hitZoneY - HORIZON_Y
  const screenY = HORIZON_Y + distanceY * scale

  // Proyección X: centrar y expandir según escala
  const centerX = GAME_CONFIG.canvasWidth / 2
  const finalScale = scale * BASE_SCALE_MULTIPLIER
  const screenX = centerX + (x - centerX) * finalScale

  return { x: screenX, y: screenY, scale: finalScale }
}
