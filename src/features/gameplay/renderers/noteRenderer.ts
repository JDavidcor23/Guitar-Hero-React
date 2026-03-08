import { getPerspective } from './perspective'
import type { LaneFlashState } from '../types/GuitarGame.types'
import {
  GAME_CONFIG,
  LANES,
  HIT_ZONE_LINE,
} from '../constants/game.constants'

/**
 * Dibuja la zona de hit inferior con estilo púrpura/dorado
 * que coincide con la estética del menú de la app.
 *
 * Cada carril tiene un botón circular con borde dorado sutil,
 * fondo púrpura oscuro y glow del color del carril al presionar.
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

  // Línea horizontal púrpura/dorada
  const lineGrad = ctx.createLinearGradient(startP.x, startP.y, endP.x, endP.y)
  lineGrad.addColorStop(0, 'rgba(138, 79, 255, 0.1)')
  lineGrad.addColorStop(0.15, 'rgba(191, 166, 104, 0.8)')
  lineGrad.addColorStop(0.5, 'rgba(191, 166, 104, 1.0)')
  lineGrad.addColorStop(0.85, 'rgba(191, 166, 104, 0.8)')
  lineGrad.addColorStop(1, 'rgba(138, 79, 255, 0.1)')
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(startP.x, startP.y)
  ctx.lineTo(endP.x, endP.y)
  ctx.stroke()

  const laneKeys = ['A', 'S', 'D', 'F', 'J']

  LANES.forEach((lane, index) => {
    const p = getPerspective(lane.x, GAME_CONFIG.hitZoneY)
    const isFlashing = laneFlashes[index] && laneFlashes[index] > currentTime
    const radius = GAME_CONFIG.noteRadius
    const scaledRadius = radius * p.scale

    // Glow exterior cuando se presiona
    if (isFlashing) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.scale(1, 0.45)
      const glowGrad = ctx.createRadialGradient(0, 0, scaledRadius * 0.5 / p.scale, 0, 0, scaledRadius * 2.0 / p.scale)
      glowGrad.addColorStop(0, lane.color + '60')
      glowGrad.addColorStop(0.5, lane.color + '20')
      glowGrad.addColorStop(1, lane.color + '00')
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(0, 0, scaledRadius * 2.0 / p.scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.scale(1, 0.45) // Aplastamiento por perspectiva

    const r = radius

    // Fondo del botón — púrpura oscuro
    const bgGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
    if (isFlashing) {
      bgGrad.addColorStop(0, lane.color + '40')
      bgGrad.addColorStop(0.6, lane.color + '18')
      bgGrad.addColorStop(1, 'rgba(26, 10, 46, 0.9)')
    } else {
      bgGrad.addColorStop(0, 'rgba(50, 25, 80, 0.9)')
      bgGrad.addColorStop(1, 'rgba(20, 5, 35, 0.95)')
    }
    ctx.fillStyle = bgGrad
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    // Borde dorado/púrpura
    const borderColor = isFlashing
      ? lane.color
      : 'rgba(191, 166, 104, 0.7)'
    ctx.strokeStyle = borderColor
    ctx.lineWidth = isFlashing ? 3.5 / 0.45 : 2.5 / 0.45
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()

    // Anillo interior
    ctx.strokeStyle = isFlashing
      ? lane.color + '90'
      : 'rgba(138, 79, 255, 0.35)'
    ctx.lineWidth = 1.5 / 0.45
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2)
    ctx.stroke()

    // Punto central
    if (isFlashing) {
      ctx.fillStyle = lane.color + 'AA'
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = 'rgba(138, 79, 255, 0.45)'
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()

    // Letra de la tecla debajo del botón
    const fontSize = Math.max(12, Math.round(14 * p.scale))
    ctx.font = `bold ${fontSize}px 'Orbitron', sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = isFlashing ? lane.color : 'rgba(191, 166, 104, 0.85)'
    ctx.fillText(laneKeys[index], p.x, p.y + 28 * p.scale)
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
 * La cola es un trapecio de color sólido con el extremo lejano
 * redondeado (semicírculo), sin efectos 3D.
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
  const width = 30

  // No dibujar si la cola es muy corta
  if (tailEndY >= headY - 5) return

  // Proyectar las 4 esquinas del trapecio
  const pHeadLeft = getPerspective(laneData.x - width / 2, headY)
  const pHeadRight = getPerspective(laneData.x + width / 2, headY)
  const pTailLeft = getPerspective(laneData.x - width / 2, tailEndY)
  const pTailRight = getPerspective(laneData.x + width / 2, tailEndY)

  // Determinar transparencia según estado
  let alpha = '99'
  if (isReleased) alpha = '40'
  else if (isComplete) alpha = 'FF'
  else if (isActive) alpha = 'CC'

  // Cuerpo de la cola — color sólido con extremo redondeado
  // En vez de un trapecio recto + círculo aparte, dibujamos una forma
  // tipo cápsula: líneas rectas en los lados + curva suave arriba
  const pTailCenter = getPerspective(laneData.x, tailEndY)
  const tailHalfWidth = (pTailRight.x - pTailLeft.x) / 2
  // Cuánto sube la curva — proporcional al ancho para un arco natural
  const curveHeight = tailHalfWidth * 0.6

  ctx.fillStyle = laneData.color + alpha
  ctx.beginPath()
  // Empezar en la esquina inferior izquierda (head)
  ctx.moveTo(pHeadLeft.x, pHeadLeft.y)
  // Subir por el lado izquierdo hasta el tail
  ctx.lineTo(pTailLeft.x, pTailLeft.y)
  // Curva suave de tailLeft a tailRight pasando por el centro (arriba)
  ctx.quadraticCurveTo(
    pTailCenter.x, pTailCenter.y - curveHeight,
    pTailRight.x, pTailRight.y
  )
  // Bajar por el lado derecho hasta head
  ctx.lineTo(pHeadRight.x, pHeadRight.y)
  ctx.closePath()
  ctx.fill()

  // Highlight central sutil
  const pHeadInnerLeft = getPerspective(laneData.x - width / 4, headY)
  const pHeadInnerRight = getPerspective(laneData.x + width / 4, headY)
  const pTailInnerLeft = getPerspective(laneData.x - width / 4, tailEndY)
  const pTailInnerRight = getPerspective(laneData.x + width / 4, tailEndY)
  const pTailInnerCenter = getPerspective(laneData.x, tailEndY)
  const innerHalfWidth = (pTailInnerRight.x - pTailInnerLeft.x) / 2
  const innerCurveHeight = innerHalfWidth * 0.6

  ctx.fillStyle = 'rgba(255, 255, 255, ' + (isActive ? '0.3' : '0.1') + ')'
  ctx.beginPath()
  ctx.moveTo(pHeadInnerLeft.x, pHeadInnerLeft.y)
  ctx.lineTo(pTailInnerLeft.x, pTailInnerLeft.y)
  ctx.quadraticCurveTo(
    pTailInnerCenter.x, pTailInnerCenter.y - innerCurveHeight,
    pTailInnerRight.x, pTailInnerRight.y
  )
  ctx.lineTo(pHeadInnerRight.x, pHeadInnerRight.y)
  ctx.closePath()
  ctx.fill()
}
