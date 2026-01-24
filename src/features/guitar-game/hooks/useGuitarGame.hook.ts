import { useRef, useEffect, useCallback } from 'react'
import type { Note, HitResult, LaneFlashState, GameStats, LastHitInfo } from '../types/GuitarGame.types'
import {
  GAME_CONFIG,
  LANES,
  HIT_ZONE_LINE,
  NOTE_SHADOW_OFFSET,
  NOTE_HIGHLIGHT,
  COLORS,
  LINE_WIDTHS,
  TOTAL_LANES,
  KEY_TO_LANE,
  HIT_WINDOWS,
  FEEDBACK_DURATION,
  POINTS,
  COMBO_MULTIPLIERS,
  MULTIPLIER_COLORS,
  TEST_NOTES_COUNT,
} from '../constants/game.constants'

/**
 * Hook principal del juego Guitar Hero
 * Maneja toda la lógica del canvas: dibujar, animar, detectar input y scoring
 */
export const useGuitarGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ==========================================
  // FUNCIONES DE UTILIDAD
  // ==========================================

  /**
   * Calcula el multiplicador actual según el combo
   * combo 0-9 → x1, combo 10-19 → x2, combo 20-29 → x3, combo 30+ → x4
   */
  const getMultiplier = useCallback((combo: number): { multiplier: number; color: string } => {
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
  }, [])

  /**
   * Calcula los puntos ganados por un hit
   * puntos base × multiplicador
   */
  const calculatePoints = useCallback((result: HitResult, combo: number): number => {
    if (!result || result === 'miss') return 0
    const basePoints = POINTS[result]
    const { multiplier } = getMultiplier(combo)
    return basePoints * multiplier
  }, [getMultiplier])

  // ==========================================
  // FUNCIONES DE DIBUJO
  // ==========================================

  /**
   * Dibuja el fondo negro y los 5 carriles de colores
   */
  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.fillStyle = COLORS.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      LANES.forEach((lane) => {
        ctx.strokeStyle = lane.color + COLORS.laneAlpha
        ctx.lineWidth = GAME_CONFIG.laneWidth
        ctx.beginPath()
        ctx.moveTo(lane.x, 0)
        ctx.lineTo(lane.x, canvas.height)
        ctx.stroke()

        ctx.strokeStyle = lane.color + COLORS.laneBorderAlpha
        ctx.lineWidth = LINE_WIDTHS.laneBorder
        ctx.beginPath()
        ctx.moveTo(lane.x - GAME_CONFIG.laneWidth / 2, 0)
        ctx.lineTo(lane.x - GAME_CONFIG.laneWidth / 2, canvas.height)
        ctx.moveTo(lane.x + GAME_CONFIG.laneWidth / 2, 0)
        ctx.lineTo(lane.x + GAME_CONFIG.laneWidth / 2, canvas.height)
        ctx.stroke()
      })
    },
    []
  )

  /**
   * Dibuja la zona de hit con posible efecto de flash
   */
  const drawHitZone = useCallback(
    (ctx: CanvasRenderingContext2D, laneFlashes: LaneFlashState, currentTime: number) => {
      ctx.strokeStyle = COLORS.white
      ctx.lineWidth = LINE_WIDTHS.hitZoneLine
      ctx.beginPath()
      ctx.moveTo(HIT_ZONE_LINE.startX, GAME_CONFIG.hitZoneY)
      ctx.lineTo(HIT_ZONE_LINE.endX, GAME_CONFIG.hitZoneY)
      ctx.stroke()

      const laneKeys = ['A', 'S', 'D', 'F', 'J']

      LANES.forEach((lane, index) => {
        const isFlashing = laneFlashes[index] && laneFlashes[index] > currentTime
        const radius = isFlashing ? GAME_CONFIG.noteRadius * 1.3 : GAME_CONFIG.noteRadius

        ctx.strokeStyle = lane.color
        ctx.lineWidth = isFlashing ? LINE_WIDTHS.hitZoneCircle + 2 : LINE_WIDTHS.hitZoneCircle
        ctx.beginPath()
        ctx.arc(lane.x, GAME_CONFIG.hitZoneY, radius, 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = lane.color + (isFlashing ? '60' : COLORS.hitZoneFillAlpha)
        ctx.beginPath()
        ctx.arc(lane.x, GAME_CONFIG.hitZoneY, radius - 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = lane.color
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(laneKeys[index], lane.x, GAME_CONFIG.hitZoneY + 55)
      })
    },
    []
  )

  /**
   * Dibuja una nota (el círculo que cae)
   */
  const drawNote = useCallback((ctx: CanvasRenderingContext2D, lane: number, y: number) => {
    const laneData = LANES[lane]

    ctx.fillStyle = COLORS.shadow
    ctx.beginPath()
    ctx.arc(laneData.x + NOTE_SHADOW_OFFSET, y + NOTE_SHADOW_OFFSET, GAME_CONFIG.noteRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = laneData.color
    ctx.beginPath()
    ctx.arc(laneData.x, y, GAME_CONFIG.noteRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = COLORS.white + COLORS.highlightAlpha
    ctx.beginPath()
    ctx.arc(
      laneData.x - NOTE_HIGHLIGHT.offsetX,
      y - NOTE_HIGHLIGHT.offsetY,
      GAME_CONFIG.noteRadius / NOTE_HIGHLIGHT.radiusDivisor,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }, [])

  /**
   * Dibuja el HUD completo: score, combo, multiplicador, feedback
   */
  const drawHUD = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stats: GameStats,
      lastHit: LastHitInfo,
      currentTime: number
    ) => {
      const { multiplier, color: multiplierColor } = getMultiplier(stats.combo)

      // ==========================================
      // ESQUINA SUPERIOR IZQUIERDA: Score y Combo
      // ==========================================
      ctx.textAlign = 'left'

      // Score (grande)
      ctx.fillStyle = COLORS.white
      ctx.font = 'bold 28px Arial'
      ctx.fillText(`${stats.score.toLocaleString()}`, 20, 35)

      // Combo
      ctx.font = '20px Arial'
      ctx.fillStyle = stats.combo > 0 ? multiplierColor : COLORS.white
      ctx.fillText(`Combo: ${stats.combo}`, 20, 60)

      // Max Combo
      ctx.fillStyle = '#888888'
      ctx.font = '16px Arial'
      ctx.fillText(`Max: ${stats.maxCombo}`, 20, 82)

      // Multiplicador (si es mayor a 1)
      if (multiplier > 1) {
        ctx.fillStyle = multiplierColor
        ctx.font = 'bold 24px Arial'
        ctx.fillText(`x${multiplier}`, 130, 60)
      }

      // ==========================================
      // ESQUINA SUPERIOR DERECHA: Estadísticas
      // ==========================================
      ctx.textAlign = 'right'
      ctx.font = '14px Arial'
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
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(resultText[lastHit.result] || '', GAME_CONFIG.canvasWidth / 2, 140)

        // Puntos ganados (si no es miss)
        if (lastHit.result !== 'miss' && lastHit.points > 0) {
          ctx.font = 'bold 24px Arial'
          ctx.fillText(`+${lastHit.points}`, GAME_CONFIG.canvasWidth / 2, 170)
        }
      }
    },
    [getMultiplier]
  )

  // ==========================================
  // useEffect principal - Lógica del juego
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ==========================================
    // ESTADO DEL JUEGO
    // ==========================================

    /**
     * Genera notas de prueba distribuidas en los carriles
     */
    const generateTestNotes = (): Note[] => {
      const notes: Note[] = []
      for (let i = 0; i < TEST_NOTES_COUNT; i++) {
        notes.push({
          lane: Math.floor(Math.random() * TOTAL_LANES),
          y: -50 - i * 120, // Espaciadas cada 120 pixels
          active: true,
          hit: false,
        })
      }
      return notes
    }

    const notes: Note[] = generateTestNotes()

    // Estadísticas del juego
    const stats: GameStats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      goods: 0,
      oks: 0,
      misses: 0,
    }

    // Info del último hit (para mostrar en HUD)
    let lastHit: LastHitInfo = {
      result: null,
      points: 0,
      expireTime: 0,
    }

    // Estado del flash de cada carril
    const laneFlashes: LaneFlashState = {}

    // Para deltaTime
    let lastTime = 0
    let animationId: number

    // ==========================================
    // FUNCIÓN: Verificar si el jugador acertó
    // ==========================================
    const checkHit = (lane: number, currentTime: number) => {
      // Activar flash en este carril
      laneFlashes[lane] = currentTime + FEEDBACK_DURATION.flash

      // Buscar la nota más cercana en este carril
      let closestNote: Note | null = null
      let closestDistance = Infinity

      for (const note of notes) {
        if (!note.active || note.hit || note.lane !== lane) continue
        const distance = Math.abs(note.y - GAME_CONFIG.hitZoneY)
        if (distance < closestDistance && distance <= HIT_WINDOWS.ok) {
          closestNote = note
          closestDistance = distance
        }
      }

      // Determinar el resultado
      let result: HitResult = null

      if (closestNote) {
        if (closestDistance <= HIT_WINDOWS.perfect) {
          result = 'perfect'
          stats.combo++
          stats.perfects++
        } else if (closestDistance <= HIT_WINDOWS.good) {
          result = 'good'
          stats.combo++
          stats.goods++
        } else if (closestDistance <= HIT_WINDOWS.ok) {
          result = 'ok'
          stats.combo++
          stats.oks++
        }

        // Calcular puntos DESPUÉS de aumentar el combo (para que cuente el multiplicador)
        const points = calculatePoints(result, stats.combo)
        stats.score += points

        // Actualizar max combo
        if (stats.combo > stats.maxCombo) {
          stats.maxCombo = stats.combo
        }

        // Marcar nota como golpeada
        closestNote.hit = true

        // Guardar info del hit
        lastHit = {
          result,
          points,
          expireTime: currentTime + FEEDBACK_DURATION.text,
        }
      } else {
        // MISS - No había nota cerca
        result = 'miss'
        stats.combo = 0
        stats.misses++

        lastHit = {
          result,
          points: 0,
          expireTime: currentTime + FEEDBACK_DURATION.text,
        }
      }
    }

    // ==========================================
    // EVENT LISTENER: Detectar teclas
    // ==========================================
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const lane = KEY_TO_LANE[key]

      if (lane === undefined) return
      if (event.repeat) return

      checkHit(lane, performance.now())
    }

    window.addEventListener('keydown', handleKeyDown)

    // ==========================================
    // FUNCIÓN: Actualizar lógica del juego
    // ==========================================
    const update = (deltaTime: number) => {
      for (const note of notes) {
        if (!note.active || note.hit) continue

        note.y += GAME_CONFIG.noteSpeed * deltaTime

        // Nota pasó sin ser golpeada
        if (note.y > GAME_CONFIG.hitZoneY + GAME_CONFIG.noteRadius * 2) {
          note.active = false

          if (!note.hit) {
            stats.combo = 0
            stats.misses++

            lastHit = {
              result: 'miss',
              points: 0,
              expireTime: performance.now() + FEEDBACK_DURATION.text,
            }
          }
        }
      }

      // Reiniciar notas cuando todas estén inactivas
      const allInactive = notes.every((n) => !n.active)
      if (allInactive) {
        notes.forEach((note, index) => {
          note.y = -50 - index * 120
          note.active = true
          note.hit = false
          note.lane = Math.floor(Math.random() * TOTAL_LANES)
        })
      }
    }

    // ==========================================
    // GAME LOOP
    // ==========================================
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      update(deltaTime)

      drawBackground(ctx, canvas)

      for (const note of notes) {
        if (note.active && !note.hit) {
          drawNote(ctx, note.lane, note.y)
        }
      }

      drawHitZone(ctx, laneFlashes, currentTime)
      drawHUD(ctx, stats, lastHit, currentTime)

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawBackground, drawHitZone, drawNote, drawHUD, calculatePoints])

  return {
    canvasRef,
    canvasWidth: GAME_CONFIG.canvasWidth,
    canvasHeight: GAME_CONFIG.canvasHeight,
  }
}
