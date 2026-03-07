import { getPerspective } from './perspective'
import {
  GAME_CONFIG,
  LANES,
  COLORS,
  SPAWN_Y,
  SPAWN_AHEAD_TIME,
} from '../constants/game.constants'

/**
 * Dibuja el fondo del Note Highway con perspectiva 3D.
 *
 * Incluye:
 * - Cuerpo oscuro del highway (gradiente)
 * - Bordes laterales metálicos
 * - Trastes horizontales animados (se mueven con gameTime)
 * - Cuerdas verticales (una por carril)
 *
 * @param ctx - Contexto 2D del canvas
 * @param canvas - Elemento canvas
 * @param gameTime - Tiempo actual de la canción (para animar frets)
 */
export const drawHighway = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gameTime: number
) => {
  // Fondo total negro
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const abstractYBottom = GAME_CONFIG.hitZoneY + 150

  // Esquinas del highway en perspectiva
  const pTopLeft = getPerspective(LANES[0].x - GAME_CONFIG.laneWidth / 2, SPAWN_Y)
  const pTopRight = getPerspective(LANES[LANES.length - 1].x + GAME_CONFIG.laneWidth / 2, SPAWN_Y)
  const pBottomLeft = getPerspective(LANES[0].x - GAME_CONFIG.laneWidth / 2, abstractYBottom)
  const pBottomRight = getPerspective(LANES[LANES.length - 1].x + GAME_CONFIG.laneWidth / 2, abstractYBottom)

  // Highway Body (Gradient oscuro)
  const gradient = ctx.createLinearGradient(0, pTopLeft.y, 0, pBottomLeft.y)
  gradient.addColorStop(0, '#111116')
  gradient.addColorStop(1, '#050508')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(pTopLeft.x, pTopLeft.y)
  ctx.lineTo(pTopRight.x, pTopRight.y)
  ctx.lineTo(pBottomRight.x, pBottomRight.y)
  ctx.lineTo(pBottomLeft.x, pBottomLeft.y)
  ctx.fill()

  // Highway Borders (bordes laterales)
  ctx.strokeStyle = '#555555'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(pTopLeft.x, pTopLeft.y)
  ctx.lineTo(pBottomLeft.x, pBottomLeft.y)
  ctx.moveTo(pTopRight.x, pTopRight.y)
  ctx.lineTo(pBottomRight.x, pBottomRight.y)
  ctx.stroke()

  // Trastes horizontales animados
  const noteSpeed = (GAME_CONFIG.hitZoneY - SPAWN_Y) / SPAWN_AHEAD_TIME
  const beatInterval = 0.5 // Un traste cada medio segundo
  const offset = (gameTime % beatInterval) * noteSpeed
  const fretSpacing = beatInterval * noteSpeed

  ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)'
  ctx.lineWidth = 2

  for (let i = 0; i < 20; i++) {
    const fretAbstractY = SPAWN_Y + offset + i * fretSpacing
    if (fretAbstractY > abstractYBottom) break

    const fLeft = getPerspective(LANES[0].x - GAME_CONFIG.laneWidth / 2, fretAbstractY)
    const fRight = getPerspective(LANES[LANES.length - 1].x + GAME_CONFIG.laneWidth / 2, fretAbstractY)

    ctx.beginPath()
    ctx.moveTo(fLeft.x, fLeft.y)
    ctx.lineTo(fRight.x, fRight.y)
    ctx.stroke()
  }

  // Cuerdas verticales (una por carril)
  LANES.forEach((lane) => {
    const topCenter = getPerspective(lane.x, SPAWN_Y)
    const bottomCenter = getPerspective(lane.x, abstractYBottom)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(topCenter.x, topCenter.y)
    ctx.lineTo(bottomCenter.x, bottomCenter.y)
    ctx.stroke()
  })
}
