import type { GameStats, LastHitInfo } from '../types/GuitarGame.types'
import type { MultiplierInfo } from '../utils/scoring'
import { GAME_CONFIG, COLORS } from '../constants/game.constants'

/**
 * Formatea segundos a "M:SS"
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Dibuja el HUD completo del juego.
 *
 * Secciones:
 * - Esquina superior izquierda: Score, Combo, Max Combo, Multiplicador
 * - Centro superior: Nombre de canción, Tiempo, Barra de progreso
 * - Esquina superior derecha: Conteo de Perfect/Good/OK/Miss
 * - Centro: Feedback del último hit (PERFECT!, GOOD, OK, MISS)
 *
 * @param ctx - Contexto 2D del canvas
 * @param stats - Estadísticas actuales del juego
 * @param lastHit - Info del último hit (para feedback visual)
 * @param currentTime - Timestamp actual (performance.now)
 * @param gameTime - Tiempo de la canción en segundos
 * @param songDuration - Duración total de la canción
 * @param songName - Nombre de la canción
 * @param getMultiplierFn - Función que calcula el multiplicador según el combo
 */
export const drawHUD = (
  ctx: CanvasRenderingContext2D,
  stats: GameStats,
  lastHit: LastHitInfo,
  currentTime: number,
  gameTime: number,
  songDuration: number,
  songName: string,
  getMultiplierFn: (combo: number) => MultiplierInfo
) => {
  const { multiplier, color: multiplierColor } = getMultiplierFn(stats.combo)

  const pad = 30 // margen general desde los bordes
  const W = GAME_CONFIG.canvasWidth
  const centerX = W / 2

  // ==========================================
  // ESQUINA SUPERIOR IZQUIERDA: Score y Combo
  // ==========================================
  ctx.textAlign = 'left'

  // Score (grande y prominente)
  ctx.fillStyle = COLORS.white
  ctx.font = "bold 36px 'Orbitron', sans-serif"
  ctx.fillText(`${stats.score.toLocaleString('en-US')}`, pad, 45)

  // Combo
  ctx.font = "22px 'Share Tech Mono', monospace"
  ctx.fillStyle = stats.combo > 0 ? multiplierColor : COLORS.white
  ctx.fillText(`Combo: ${stats.combo}`, pad, 78)

  // Max Combo
  ctx.fillStyle = '#888888'
  ctx.font = "16px 'Share Tech Mono', monospace"
  ctx.fillText(`Max: ${stats.maxCombo}`, pad, 102)

  // Multiplicador (si es mayor a 1)
  if (multiplier > 1) {
    ctx.fillStyle = multiplierColor
    ctx.font = "bold 26px 'Orbitron', sans-serif"
    ctx.fillText(`x${multiplier}`, 180, 78)
  }

  // ==========================================
  // CENTRO SUPERIOR: Nombre de canción y tiempo
  // ==========================================
  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.white
  ctx.font = "16px 'Orbitron', sans-serif"
  ctx.fillText(songName, centerX, 28)

  // Tiempo transcurrido / duración total
  ctx.font = "14px 'Share Tech Mono', monospace"
  ctx.fillStyle = '#AAAAAA'
  ctx.fillText(
    `${formatTime(gameTime)} / ${formatTime(songDuration)}`,
    centerX,
    50
  )

  // Barra de progreso
  const progressWidth = 240
  const progressHeight = 8
  const progressX = (W - progressWidth) / 2
  const progressY = 62
  const progress = Math.min(gameTime / songDuration, 1)

  // Fondo de la barra
  ctx.fillStyle = '#333333'
  ctx.beginPath()
  ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 4)
  ctx.fill()

  // Progreso
  ctx.fillStyle = '#00FF00'
  ctx.beginPath()
  ctx.roundRect(progressX, progressY, progressWidth * progress, progressHeight, 4)
  ctx.fill()

  // ==========================================
  // ESQUINA SUPERIOR DERECHA: Estadísticas
  // ==========================================
  ctx.textAlign = 'right'
  ctx.font = "15px 'Share Tech Mono', monospace"
  const rightX = W - pad

  ctx.fillStyle = '#00FF00'
  ctx.fillText(`Perfect: ${stats.perfects}`, rightX, 32)

  ctx.fillStyle = '#88FF00'
  ctx.fillText(`Good: ${stats.goods}`, rightX, 54)

  ctx.fillStyle = '#FFFF00'
  ctx.fillText(`OK: ${stats.oks}`, rightX, 76)

  ctx.fillStyle = '#FF0000'
  ctx.fillText(`Miss: ${stats.misses}`, rightX, 98)

  // ==========================================
  // CENTRO: Feedback del último hit
  // ==========================================
  if (lastHit.result && lastHit.expireTime > currentTime) {
    const resultColors: Record<string, string> = {
      perfect: '#00FF00',
      good: '#88FF00',
      ok: '#FFFF00',
      miss: '#FF0000',
    }

    const resultText: Record<string, string> = {
      perfect: 'PERFECT!',
      good: 'GOOD',
      ok: 'OK',
      miss: 'MISS',
    }

    // Texto grande del resultado
    ctx.fillStyle = resultColors[lastHit.result] || COLORS.white
    ctx.font = "bold 52px 'Orbitron', sans-serif"
    ctx.textAlign = 'center'
    ctx.fillText(resultText[lastHit.result] || '', centerX, 160)

    // Puntos ganados (si no es miss)
    if (lastHit.result !== 'miss' && lastHit.points > 0) {
      ctx.font = "bold 24px 'Orbitron', sans-serif"
      ctx.fillText(`+${lastHit.points}`, centerX, 192)
    }
  }
}

/**
 * Dibuja el overlay de pausa sobre todo el canvas.
 *
 * Muestra un fondo semi-transparente con "PAUSE" y la instrucción
 * para continuar.
 */
export const drawPauseOverlay = (ctx: CanvasRenderingContext2D) => {
  // Overlay semi-transparente
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight)

  // Texto PAUSA
  ctx.fillStyle = COLORS.white
  ctx.font = "bold 64px 'Orbitron', sans-serif"
  ctx.textAlign = 'center'
  ctx.fillText('PAUSE', GAME_CONFIG.canvasWidth / 2, GAME_CONFIG.canvasHeight / 2 - 20)

  // Instrucción
  ctx.font = "20px 'Share Tech Mono', monospace"
  ctx.fillStyle = '#AAAAAA'
  ctx.fillText(
    'Press SPACE to continue',
    GAME_CONFIG.canvasWidth / 2,
    GAME_CONFIG.canvasHeight / 2 + 30
  )
}
