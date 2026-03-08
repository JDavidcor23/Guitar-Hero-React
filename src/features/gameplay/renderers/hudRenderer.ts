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

  // ==========================================
  // ESQUINA SUPERIOR IZQUIERDA: Score y Combo
  // ==========================================
  ctx.textAlign = 'left'

  // Score (grande)
  ctx.fillStyle = COLORS.white
  ctx.font = "bold 28px 'Orbitron', sans-serif"
  ctx.fillText(`${stats.score.toLocaleString()}`, 20, 35)

  // Combo
  ctx.font = "18px 'Share Tech Mono', monospace"
  ctx.fillStyle = stats.combo > 0 ? multiplierColor : COLORS.white
  ctx.fillText(`Combo: ${stats.combo}`, 20, 60)

  // Max Combo
  ctx.fillStyle = '#888888'
  ctx.font = "14px 'Share Tech Mono', monospace"
  ctx.fillText(`Max: ${stats.maxCombo}`, 20, 82)

  // Multiplicador (si es mayor a 1)
  if (multiplier > 1) {
    ctx.fillStyle = multiplierColor
    ctx.font = "bold 22px 'Orbitron', sans-serif"
    ctx.fillText(`x${multiplier}`, 130, 60)
  }

  // ==========================================
  // CENTRO SUPERIOR: Nombre de canción y tiempo
  // ==========================================
  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.white
  ctx.font = "14px 'Orbitron', sans-serif"
  ctx.fillText(songName, GAME_CONFIG.canvasWidth / 2, 20)

  // Tiempo transcurrido / duración total
  ctx.font = "12px 'Share Tech Mono', monospace"
  ctx.fillStyle = '#AAAAAA'
  ctx.fillText(
    `${formatTime(gameTime)} / ${formatTime(songDuration)}`,
    GAME_CONFIG.canvasWidth / 2,
    40
  )

  // Barra de progreso
  const progressWidth = 200
  const progressHeight = 6
  const progressX = (GAME_CONFIG.canvasWidth - progressWidth) / 2
  const progressY = 50
  const progress = Math.min(gameTime / songDuration, 1)

  ctx.fillStyle = '#333333'
  ctx.fillRect(progressX, progressY, progressWidth, progressHeight)

  ctx.fillStyle = '#00FF00'
  ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight)

  // ==========================================
  // ESQUINA SUPERIOR DERECHA: Estadísticas
  // ==========================================
  ctx.textAlign = 'right'
  ctx.font = "13px 'Share Tech Mono', monospace"
  const rightX = GAME_CONFIG.canvasWidth - 20

  ctx.fillStyle = '#00FF00'
  ctx.fillText(`Perfect: ${stats.perfects}`, rightX, 25)

  ctx.fillStyle = '#88FF00'
  ctx.fillText(`Good: ${stats.goods}`, rightX, 42)

  ctx.fillStyle = '#FFFF00'
  ctx.fillText(`OK: ${stats.oks}`, rightX, 59)

  ctx.fillStyle = '#FF0000'
  ctx.fillText(`Miss: ${stats.misses}`, rightX, 76)

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
    ctx.font = "bold 48px 'Orbitron', sans-serif"
    ctx.textAlign = 'center'
    ctx.fillText(resultText[lastHit.result] || '', GAME_CONFIG.canvasWidth / 2, 140)

    // Puntos ganados (si no es miss)
    if (lastHit.result !== 'miss' && lastHit.points > 0) {
      ctx.font = "bold 22px 'Orbitron', sans-serif"
      ctx.fillText(`+${lastHit.points}`, GAME_CONFIG.canvasWidth / 2, 170)
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
