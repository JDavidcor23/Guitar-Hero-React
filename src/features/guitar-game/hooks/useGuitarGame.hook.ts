import { useRef, useEffect, useCallback } from 'react'
import type {
  HitResult,
  LaneFlashState,
  GameStats,
  LastHitInfo,
  SongData,
  GameNote,
  GameState,
} from '../types/GuitarGame.types'
import {
  GAME_CONFIG,
  LANES,
  HIT_ZONE_LINE,
  NOTE_SHADOW_OFFSET,
  NOTE_HIGHLIGHT,
  COLORS,
  LINE_WIDTHS,
  KEY_TO_LANE,
  HIT_WINDOWS,
  FEEDBACK_DURATION,
  POINTS,
  COMBO_MULTIPLIERS,
  MULTIPLIER_COLORS,
  SPAWN_AHEAD_TIME,
  SPAWN_Y,
  PAUSE_KEY,
} from '../constants/game.constants'

// ==========================================
// TIPOS PARA LOS PARÁMETROS DEL HOOK
// ==========================================

interface UseGuitarGameParams {
  /** La canción a jugar (null si no hay ninguna cargada) */
  song: SongData | null
  /** Estado actual del juego (menu, playing, paused, finished) */
  gameState: GameState
  /** Callback cuando el juego termina (la canción acabó) */
  onGameEnd: (stats: GameStats) => void
  /** Callback cuando se presiona la tecla de pausa */
  onPauseToggle: () => void
  /** Callback cuando las estadísticas cambian (opcional, para UI en tiempo real) */
  onStatsChange?: (stats: GameStats) => void
}

/**
 * Hook principal del juego Guitar Hero
 *
 * PASO 4: Ahora usa canciones cargadas desde JSON
 * - Las notas aparecen según su tiempo (segundo) en el JSON
 * - El juego tiene estados: menu, playing, paused, finished
 * - gameTime cuenta los segundos desde que empezó la canción
 */
export const useGuitarGame = ({
  song,
  gameState,
  onGameEnd,
  onPauseToggle,
  onStatsChange,
}: UseGuitarGameParams) => {
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
  const calculatePoints = useCallback(
    (result: HitResult, combo: number): number => {
      if (!result || result === 'miss') return 0
      const basePoints = POINTS[result]
      const { multiplier } = getMultiplier(combo)
      return basePoints * multiplier
    },
    [getMultiplier]
  )

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
    ctx.arc(
      laneData.x + NOTE_SHADOW_OFFSET,
      y + NOTE_SHADOW_OFFSET,
      GAME_CONFIG.noteRadius,
      0,
      Math.PI * 2
    )
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
   * Dibuja el HUD completo: score, combo, multiplicador, feedback, tiempo
   */
  const drawHUD = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stats: GameStats,
      lastHit: LastHitInfo,
      currentTime: number,
      gameTime: number,
      songDuration: number,
      songName: string
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
      // CENTRO SUPERIOR: Nombre de canción y tiempo
      // ==========================================
      ctx.textAlign = 'center'
      ctx.fillStyle = COLORS.white
      ctx.font = '16px Arial'
      ctx.fillText(songName, GAME_CONFIG.canvasWidth / 2, 20)

      // Tiempo transcurrido / duración total
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
      ctx.font = '14px Arial'
      ctx.fillStyle = '#AAAAAA'
      ctx.fillText(`${formatTime(gameTime)} / ${formatTime(songDuration)}`, GAME_CONFIG.canvasWidth / 2, 40)

      // Barra de progreso
      const progressWidth = 200
      const progressHeight = 6
      const progressX = (GAME_CONFIG.canvasWidth - progressWidth) / 2
      const progressY = 50
      const progress = Math.min(gameTime / songDuration, 1)

      // Fondo de la barra
      ctx.fillStyle = '#333333'
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight)

      // Progreso
      ctx.fillStyle = '#00FF00'
      ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight)

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

  /**
   * Dibuja el texto de pausa en el centro
   */
  const drawPauseOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
    // Overlay semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight)

    // Texto PAUSA
    ctx.fillStyle = COLORS.white
    ctx.font = 'bold 64px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('PAUSA', GAME_CONFIG.canvasWidth / 2, GAME_CONFIG.canvasHeight / 2 - 20)

    // Instrucción
    ctx.font = '24px Arial'
    ctx.fillStyle = '#AAAAAA'
    ctx.fillText('Presiona ESPACIO para continuar', GAME_CONFIG.canvasWidth / 2, GAME_CONFIG.canvasHeight / 2 + 30)
  }, [])

  // ==========================================
  // useEffect principal - Lógica del juego
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Si no hay canción o no estamos jugando/pausado, solo dibuja fondo
    if (!song || (gameState !== 'playing' && gameState !== 'paused')) {
      drawBackground(ctx, canvas)
      return
    }

    // ==========================================
    // ESTADO DEL JUEGO
    // ==========================================

    /**
     * Convierte las notas del JSON a GameNote (con propiedades de gameplay)
     * Cada nota empieza sin spawnar, sin hit, sin miss
     */
    const gameNotes: GameNote[] = song.notes.map((note) => ({
      segundo: note.segundo,
      carril: note.carril,
      y: SPAWN_Y, // Posición inicial (fuera de pantalla)
      spawned: false, // Aún no ha aparecido
      hit: false, // No ha sido golpeada
      missed: false, // No ha sido fallada
    }))

    // Índice de la siguiente nota por spawnar (para optimización)
    let nextNoteIndex = 0

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

    // ==========================================
    // SISTEMA DE TIEMPO
    // ==========================================

    /**
     * gameTime: Tiempo transcurrido de la canción (en segundos)
     * gameStartTimestamp: Momento en que empezó/reanudó el juego
     * pausedGameTime: gameTime al momento de pausar
     */
    let gameTime = 0
    let gameStartTimestamp: number | null = null
    const pausedGameTime = 0

    // Para el game loop
    let animationId: number
    const isPaused = gameState === 'paused'

    /**
     * Calcula la velocidad de las notas para que lleguen justo a tiempo
     * Distancia = hitZoneY - spawnY
     * Velocidad = Distancia / SPAWN_AHEAD_TIME
     */
    const noteSpeed = (GAME_CONFIG.hitZoneY - SPAWN_Y) / SPAWN_AHEAD_TIME

    // ==========================================
    // FUNCIÓN: Spawnar notas según el tiempo
    // ==========================================
    const spawnNotes = () => {
      // Recorrer notas desde la última spawneada
      while (nextNoteIndex < gameNotes.length) {
        const note = gameNotes[nextNoteIndex]

        // Si esta nota debe spawnar ahora (su tiempo - SPAWN_AHEAD_TIME <= gameTime)
        if (note.segundo - SPAWN_AHEAD_TIME <= gameTime) {
          // Calcular posición Y inicial basada en cuánto falta para que llegue
          const timeUntilHit = note.segundo - gameTime
          note.y = GAME_CONFIG.hitZoneY - timeUntilHit * noteSpeed
          note.spawned = true
          nextNoteIndex++
        } else {
          // Las notas están ordenadas, así que si esta no spawna, las siguientes tampoco
          break
        }
      }
    }

    // ==========================================
    // FUNCIÓN: Actualizar posición de notas
    // ==========================================
    const updateNotes = (deltaTime: number) => {
      for (const note of gameNotes) {
        // Solo mover notas que están activas (spawneadas, no hit, no missed)
        if (!note.spawned || note.hit || note.missed) continue

        // Mover hacia abajo
        note.y += noteSpeed * deltaTime

        // Si pasó la zona de hit sin ser golpeada
        if (note.y > GAME_CONFIG.hitZoneY + GAME_CONFIG.noteRadius * 2) {
          note.missed = true
          stats.combo = 0
          stats.misses++

          lastHit = {
            result: 'miss',
            points: 0,
            expireTime: performance.now() + FEEDBACK_DURATION.text,
          }

          // Notificar cambio de stats
          onStatsChange?.(stats)
        }
      }
    }

    // ==========================================
    // FUNCIÓN: Verificar si el jugador acertó
    // ==========================================
    const checkHit = (lane: number, currentTime: number) => {
      // Activar flash en este carril
      laneFlashes[lane] = currentTime + FEEDBACK_DURATION.flash

      // Buscar la nota más cercana en este carril
      let closestNote: GameNote | null = null
      let closestDistance = Infinity

      for (const note of gameNotes) {
        // Solo considerar notas activas en este carril
        if (!note.spawned || note.hit || note.missed || note.carril !== lane) continue

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

        // Calcular puntos DESPUÉS de aumentar el combo
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

        // Notificar cambio de stats
        onStatsChange?.(stats)
      } else {
        // MISS - No había nota cerca (presionó sin nota)
        result = 'miss'
        stats.combo = 0
        stats.misses++

        lastHit = {
          result,
          points: 0,
          expireTime: currentTime + FEEDBACK_DURATION.text,
        }

        // Notificar cambio de stats
        onStatsChange?.(stats)
      }
    }

    // ==========================================
    // EVENT LISTENER: Detectar teclas
    // ==========================================
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tecla de pausa (ESPACIO)
      if (event.key === PAUSE_KEY) {
        event.preventDefault()
        onPauseToggle()
        return
      }

      // Si está pausado, ignorar otras teclas
      if (isPaused) return

      const key = event.key.toLowerCase()
      const lane = KEY_TO_LANE[key]

      if (lane === undefined) return
      if (event.repeat) return

      checkHit(lane, performance.now())
    }

    window.addEventListener('keydown', handleKeyDown)

    // ==========================================
    // GAME LOOP
    // ==========================================
    let lastFrameTime = 0

    const gameLoop = (currentTime: number) => {
      // Calcular deltaTime
      const deltaTime = lastFrameTime === 0 ? 0 : (currentTime - lastFrameTime) / 1000
      lastFrameTime = currentTime

      // Actualizar gameTime solo si no está pausado
      if (!isPaused) {
        if (gameStartTimestamp === null) {
          gameStartTimestamp = currentTime
        }
        gameTime = pausedGameTime + (currentTime - gameStartTimestamp) / 1000

        // Verificar si la canción terminó
        if (gameTime >= song.metadata.duration) {
          // Marcar notas restantes como missed
          for (const note of gameNotes) {
            if (note.spawned && !note.hit && !note.missed) {
              note.missed = true
              stats.misses++
            }
          }
          // Notificar fin del juego
          onGameEnd(stats)
          return // Detener el loop
        }

        // Spawnar notas según el tiempo
        spawnNotes()

        // Actualizar posición de notas
        updateNotes(deltaTime)
      }

      // ==========================================
      // DIBUJAR
      // ==========================================
      drawBackground(ctx, canvas)

      // Dibujar notas activas
      for (const note of gameNotes) {
        if (note.spawned && !note.hit && !note.missed) {
          drawNote(ctx, note.carril, note.y)
        }
      }

      drawHitZone(ctx, laneFlashes, currentTime)
      drawHUD(
        ctx,
        stats,
        lastHit,
        currentTime,
        gameTime,
        song.metadata.duration,
        song.metadata.songName
      )

      // Si está pausado, dibujar overlay
      if (isPaused) {
        drawPauseOverlay(ctx)
      }

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
  }, [
    song,
    gameState,
    onGameEnd,
    onPauseToggle,
    onStatsChange,
    drawBackground,
    drawHitZone,
    drawNote,
    drawHUD,
    drawPauseOverlay,
    calculatePoints,
  ])

  return {
    canvasRef,
    canvasWidth: GAME_CONFIG.canvasWidth,
    canvasHeight: GAME_CONFIG.canvasHeight,
  }
}
