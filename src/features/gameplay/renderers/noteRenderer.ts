import { getPerspective } from './perspective'
import type { LaneFlashState } from '../types/GuitarGame.types'
import {
  GAME_CONFIG,
  LANES,
  HIT_ZONE_LINE,
  SUSTAIN_CONFIG,
} from '../constants/game.constants'

/**
 * Dibuja la zona de hit inferior con anillos metálicos 3D.
 *
 * Cada carril tiene un anillo ovalado (aplastado por perspectiva)
 * que se ilumina brevemente cuando el jugador presiona la tecla.
 *
 * @param ctx - Contexto 2D del canvas
 * @param laneFlashes - Estado de flash por carril (timestamp de expiración)
 * @param currentTime - Timestamp actual (performance.now)
 */
export const drawHitZone = (
  ctx: CanvasRenderingContext2D,
  laneFlashes: LaneFlashState,
  currentTime: number
) => {
  const startP = getPerspective(HIT_ZONE_LINE.startX, GAME_CONFIG.hitZoneY)
  const endP = getPerspective(HIT_ZONE_LINE.endX, GAME_CONFIG.hitZoneY)

  // Línea horizontal de la zona de hit
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(startP.x, startP.y)
  ctx.lineTo(endP.x, endP.y)
  ctx.stroke()

  const laneKeys = ['A', 'S', 'D', 'F', 'J']

  LANES.forEach((lane, index) => {
    const p = getPerspective(lane.x, GAME_CONFIG.hitZoneY)
    const isFlashing = laneFlashes[index] && laneFlashes[index] > currentTime
    const radius = isFlashing ? GAME_CONFIG.noteRadius * 1.1 : GAME_CONFIG.noteRadius

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.scale(1, 0.45) // Aplastamiento por perspectiva

    // Anillo metálico exterior
    ctx.strokeStyle = isFlashing ? '#ffffff' : '#888888'
    ctx.lineWidth = 10 / 0.45
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Anillo metálico interior
    ctx.strokeStyle = '#444444'
    ctx.lineWidth = 3 / 0.45
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Relleno de color cuando se presiona
    if (isFlashing) {
      ctx.fillStyle = lane.color + '88'
      ctx.beginPath()
      ctx.arc(0, 0, radius - 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // Letra de la tecla debajo del anillo
    ctx.fillStyle = isFlashing ? '#ffffff' : lane.color
    const fontSize = Math.max(14, Math.round(18 * p.scale))
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(laneKeys[index], p.x, p.y + 30 * p.scale)
  })
}

/**
 * Dibuja una nota como un cilindro 3D (puck) en perspectiva.
 *
 * Componentes del puck (de abajo a arriba):
 * 1. Sombra (elipse oscura desplazada)
 * 2. Paredes del cilindro (gradiente gris)
 * 3. Tapa superior (gradiente metálico radial)
 * 4. Zona interna de color (el color del carril)
 * 5. Núcleo central blanco
 *
 * @param ctx - Contexto 2D del canvas
 * @param lane - Índice del carril (0-4)
 * @param abstractY - Posición Y abstracta (antes de la perspectiva)
 */
export const drawNote = (
  ctx: CanvasRenderingContext2D,
  lane: number,
  abstractY: number
) => {
  const laneData = LANES[lane]
  const p = getPerspective(laneData.x, abstractY)

  // No dibujar notas demasiado pequeñas (muy lejos)
  if (p.scale < 0.01) return

  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.scale(p.scale, p.scale * 0.45) // Escala + aplastamiento

  const radius = GAME_CONFIG.noteRadius

  // 1. Sombra del puck
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.beginPath()
  ctx.arc(0, 15, radius * 1.05, 0, Math.PI * 2)
  ctx.fill()

  // 2. Paredes del cilindro
  const wallGradient = ctx.createLinearGradient(0, -radius, 0, radius + 15)
  wallGradient.addColorStop(0, '#555')
  wallGradient.addColorStop(1, '#111')
  ctx.fillStyle = wallGradient
  ctx.fillRect(-radius, 0, radius * 2, 10)

  // 3. Tapa superior metálica
  const rimGradient = ctx.createRadialGradient(0, -radius / 2, 2, 0, 0, radius)
  rimGradient.addColorStop(0, '#ffffff')
  rimGradient.addColorStop(0.7, '#aaaaaa')
  rimGradient.addColorStop(1, '#555555')
  ctx.fillStyle = rimGradient
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()

  // 4. Zona interna de color
  const innerGradient = ctx.createRadialGradient(0, -radius / 4, 2, 0, 0, radius * 0.7)
  innerGradient.addColorStop(0, '#ffffff')
  innerGradient.addColorStop(0.3, laneData.color)
  innerGradient.addColorStop(1, '#000000')
  ctx.fillStyle = innerGradient
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2)
  ctx.fill()

  // 5. Núcleo central blanco
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * Dibuja la cola de una nota sostenida (sustain) en perspectiva.
 *
 * La cola es un trapecio que conecta la cabeza de la nota (headY)
 * con el final de la cola (tailEndY), con un highlight central.
 *
 * @param ctx - Contexto 2D del canvas
 * @param lane - Índice del carril (0-4)
 * @param headY - AbstractY de la cabeza de la nota
 * @param tailEndY - AbstractY del final de la cola
 * @param isActive - El jugador está sosteniendo
 * @param isComplete - El sustain se completó al 100%
 * @param isReleased - El jugador soltó antes de tiempo
 */
export const drawSustainTail = (
  ctx: CanvasRenderingContext2D,
  lane: number,
  headY: number,
  tailEndY: number,
  isActive: boolean,
  isComplete: boolean,
  isReleased: boolean
) => {
  const laneData = LANES[lane]
  const width = SUSTAIN_CONFIG.tailWidth

  // No dibujar si la cola es muy corta
  if (tailEndY >= headY - 5) return

  // Proyectar las 4 esquinas del trapecio
  const pHeadLeft = getPerspective(laneData.x - width / 2, headY)
  const pHeadRight = getPerspective(laneData.x + width / 2, headY)
  const pTailLeft = getPerspective(laneData.x - width / 2, tailEndY)
  const pTailRight = getPerspective(laneData.x + width / 2, tailEndY)

  // Determinar transparencia según estado
  let alpha = SUSTAIN_CONFIG.tailAlpha
  if (isReleased) alpha = SUSTAIN_CONFIG.releasedAlpha
  else if (isComplete) alpha = SUSTAIN_CONFIG.completeAlpha
  else if (isActive) alpha = SUSTAIN_CONFIG.activeAlpha

  // Cuerpo de la cola
  ctx.fillStyle = laneData.color + alpha
  ctx.beginPath()
  ctx.moveTo(pTailLeft.x, pTailLeft.y)
  ctx.lineTo(pTailRight.x, pTailRight.y)
  ctx.lineTo(pHeadRight.x, pHeadRight.y)
  ctx.lineTo(pHeadLeft.x, pHeadLeft.y)
  ctx.fill()

  // Highlight central
  const pHeadInnerLeft = getPerspective(laneData.x - width / 4, headY)
  const pHeadInnerRight = getPerspective(laneData.x + width / 4, headY)
  const pTailInnerLeft = getPerspective(laneData.x - width / 4, tailEndY)
  const pTailInnerRight = getPerspective(laneData.x + width / 4, tailEndY)

  ctx.fillStyle = 'rgba(255, 255, 255, ' + (isActive ? '0.3' : '0.1') + ')'
  ctx.beginPath()
  ctx.moveTo(pTailInnerLeft.x, pTailInnerLeft.y)
  ctx.lineTo(pTailInnerRight.x, pTailInnerRight.y)
  ctx.lineTo(pHeadInnerRight.x, pHeadInnerRight.y)
  ctx.lineTo(pHeadInnerLeft.x, pHeadInnerLeft.y)
  ctx.fill()
}
