import { useRef, useEffect, useCallback } from 'react'
import type { Note, HitResult, FeedbackState, LaneFlashState } from '../types/GuitarGame.types'
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
} from '../constants/game.constants'

/**
 * Hook principal del juego Guitar Hero
 * Maneja toda la lógica del canvas: dibujar, animar y detectar input
 */
export const useGuitarGame = () => {
  // Referencia al elemento <canvas> del DOM
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /**
   * Dibuja el fondo negro y los 5 carriles de colores
   */
  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // Pintar todo el canvas de negro (limpia lo anterior)
      ctx.fillStyle = COLORS.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Dibujar cada carril
      LANES.forEach((lane) => {
        // Línea gruesa semi-transparente (el "fondo" del carril)
        ctx.strokeStyle = lane.color + COLORS.laneAlpha
        ctx.lineWidth = GAME_CONFIG.laneWidth
        ctx.beginPath()
        ctx.moveTo(lane.x, 0)
        ctx.lineTo(lane.x, canvas.height)
        ctx.stroke()

        // Bordes del carril
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
   * @param laneFlashes - Estado de qué carriles están "brillando"
   * @param currentTime - Tiempo actual para saber si el flash sigue activo
   */
  const drawHitZone = useCallback(
    (ctx: CanvasRenderingContext2D, laneFlashes: LaneFlashState, currentTime: number) => {
      // Línea horizontal blanca
      ctx.strokeStyle = COLORS.white
      ctx.lineWidth = LINE_WIDTHS.hitZoneLine
      ctx.beginPath()
      ctx.moveTo(HIT_ZONE_LINE.startX, GAME_CONFIG.hitZoneY)
      ctx.lineTo(HIT_ZONE_LINE.endX, GAME_CONFIG.hitZoneY)
      ctx.stroke()

      // Teclas correspondientes a cada carril (para mostrar debajo)
      const laneKeys = ['A', 'S', 'D', 'F', 'J']

      // Un círculo por cada carril
      LANES.forEach((lane, index) => {
        // ¿Este carril tiene flash activo?
        const isFlashing = laneFlashes[index] && laneFlashes[index] > currentTime

        // Si está en flash, hacerlo más grande y brillante
        const radius = isFlashing
          ? GAME_CONFIG.noteRadius * 1.3 // 30% más grande
          : GAME_CONFIG.noteRadius

        // Borde del círculo
        ctx.strokeStyle = lane.color
        ctx.lineWidth = isFlashing ? LINE_WIDTHS.hitZoneCircle + 2 : LINE_WIDTHS.hitZoneCircle
        ctx.beginPath()
        ctx.arc(lane.x, GAME_CONFIG.hitZoneY, radius, 0, Math.PI * 2)
        ctx.stroke()

        // Relleno - más opaco si está en flash
        ctx.fillStyle = lane.color + (isFlashing ? '60' : COLORS.hitZoneFillAlpha)
        ctx.beginPath()
        ctx.arc(lane.x, GAME_CONFIG.hitZoneY, radius - 2, 0, Math.PI * 2)
        ctx.fill()

        // Dibujar la letra de la tecla debajo del círculo
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

    // 1. Sombra
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

    // 2. Círculo principal
    ctx.fillStyle = laneData.color
    ctx.beginPath()
    ctx.arc(laneData.x, y, GAME_CONFIG.noteRadius, 0, Math.PI * 2)
    ctx.fill()

    // 3. Brillo
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
   * Dibuja el texto de feedback (PERFECT!, GOOD, OK, MISS)
   */
  const drawFeedback = useCallback(
    (ctx: CanvasRenderingContext2D, feedback: FeedbackState, currentTime: number, combo: number) => {
      // Mostrar combo en la esquina superior izquierda
      ctx.fillStyle = COLORS.white
      ctx.font = '20px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Combo: ${combo}`, 20, 30)

      // Si no hay feedback activo o ya expiró, no dibujar el texto grande
      if (!feedback.result || feedback.expireTime < currentTime) return

      // Colores según el resultado
      const resultColors: Record<string, string> = {
        perfect: '#00FF00', // Verde brillante
        good: '#88FF00', // Verde-amarillo
        ok: '#FFFF00', // Amarillo
        miss: '#FF0000', // Rojo
      }

      // Texto a mostrar
      const resultText: Record<string, string> = {
        perfect: 'PERFECT!',
        good: 'GOOD',
        ok: 'OK',
        miss: 'MISS',
      }

      // Dibujar el texto centrado arriba
      ctx.fillStyle = resultColors[feedback.result] || COLORS.white
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(resultText[feedback.result] || '', GAME_CONFIG.canvasWidth / 2, 100)

      // Mostrar último resultado debajo del combo
      ctx.fillStyle = resultColors[feedback.result] || COLORS.white
      ctx.font = '16px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`Último: ${resultText[feedback.result]}`, 20, 55)
    },
    []
  )

  /**
   * useEffect principal - Aquí está toda la lógica del juego
   */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ==========================================
    // ESTADO DEL JUEGO
    // ==========================================

    /**
     * Array de notas de prueba
     * Cada nota tiene: carril, posición Y, si está activa, si fue golpeada
     */
    const notes: Note[] = [
      { lane: 0, y: -50, active: true, hit: false }, // Verde, empieza arriba
      { lane: 2, y: -200, active: true, hit: false }, // Amarillo, más atrás
      { lane: 4, y: -350, active: true, hit: false }, // Naranja, más atrás
      { lane: 1, y: -500, active: true, hit: false }, // Rojo, más atrás
    ]

    // Estado del feedback (texto PERFECT/GOOD/etc)
    let feedback: FeedbackState = {
      result: null,
      expireTime: 0,
    }

    // Estado del flash de cada carril (cuándo expira cada flash)
    const laneFlashes: LaneFlashState = {}

    // Combo actual (aciertos seguidos)
    let combo = 0

    // Para deltaTime
    let lastTime = 0
    let animationId: number

    // ==========================================
    // FUNCIÓN: Verificar si el jugador acertó
    // ==========================================
    /**
     * Cuando el jugador presiona una tecla, esta función:
     * 1. Busca si hay una nota en ese carril cerca de la zona de hit
     * 2. Calcula qué tan cerca está (PERFECT, GOOD, OK, MISS)
     * 3. Actualiza el estado del juego
     *
     * @param lane - El carril donde presionó (0-4)
     * @param currentTime - Tiempo actual para el feedback
     */
    const checkHit = (lane: number, currentTime: number) => {
      // Activar flash en este carril (durará FEEDBACK_DURATION.flash ms)
      laneFlashes[lane] = currentTime + FEEDBACK_DURATION.flash

      // Buscar la nota más cercana en este carril que no haya sido golpeada
      let closestNote: Note | null = null
      let closestDistance = Infinity

      for (const note of notes) {
        // Solo considerar notas activas, no golpeadas, en el carril correcto
        if (!note.active || note.hit || note.lane !== lane) continue

        // Calcular distancia a la zona de hit
        // Math.abs = valor absoluto (convierte negativo en positivo)
        const distance = Math.abs(note.y - GAME_CONFIG.hitZoneY)

        // Si está dentro de la ventana máxima y es la más cercana
        if (distance < closestDistance && distance <= HIT_WINDOWS.ok) {
          closestNote = note
          closestDistance = distance
        }
      }

      // Determinar el resultado
      let result: HitResult = null

      if (closestNote) {
        // ¡Hay una nota cerca! Determinar qué tan bien lo hizo
        if (closestDistance <= HIT_WINDOWS.perfect) {
          result = 'perfect'
          combo++ // Aumentar combo
        } else if (closestDistance <= HIT_WINDOWS.good) {
          result = 'good'
          combo++ // Aumentar combo
        } else if (closestDistance <= HIT_WINDOWS.ok) {
          result = 'ok'
          combo++ // Aumentar combo
        }

        // Marcar la nota como golpeada (desaparecerá)
        closestNote.hit = true
      } else {
        // No había nota cerca = MISS
        result = 'miss'
        combo = 0 // Resetear combo
      }

      // Actualizar feedback para mostrar en pantalla
      feedback = {
        result,
        expireTime: currentTime + FEEDBACK_DURATION.text,
      }
    }

    // ==========================================
    // EVENT LISTENER: Detectar teclas
    // ==========================================
    /**
     * Escucha cuando el jugador presiona una tecla
     * Si es una tecla válida (A, S, D, F, J), llama a checkHit
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Convertir la tecla a minúscula ('A' → 'a')
      const key = event.key.toLowerCase()

      // Buscar si esta tecla corresponde a un carril
      const lane = KEY_TO_LANE[key]

      // Si no es una tecla válida (undefined), ignorar
      if (lane === undefined) return

      // Evitar que la tecla se repita si la mantienen presionada
      if (event.repeat) return

      // ¡Tecla válida! Verificar si acertó
      checkHit(lane, performance.now())
    }

    // Registrar el event listener
    window.addEventListener('keydown', handleKeyDown)

    // ==========================================
    // FUNCIÓN: Actualizar lógica del juego
    // ==========================================
    const update = (deltaTime: number) => {
      for (const note of notes) {
        // Solo mover notas activas y no golpeadas
        if (!note.active || note.hit) continue

        // Mover hacia abajo
        note.y += GAME_CONFIG.noteSpeed * deltaTime

        // Si pasó la zona de hit sin ser golpeada, marcarla como miss
        if (note.y > GAME_CONFIG.hitZoneY + GAME_CONFIG.noteRadius * 2) {
          // La nota se fue sin ser golpeada
          note.active = false

          // Solo contar como miss si no fue golpeada (no mostrar doble miss)
          if (!note.hit) {
            feedback = {
              result: 'miss',
              expireTime: performance.now() + FEEDBACK_DURATION.text,
            }
            combo = 0
          }
        }
      }

      // Reiniciar notas cuando todas estén inactivas (para pruebas)
      const allInactive = notes.every((n) => !n.active)
      if (allInactive) {
        notes.forEach((note, index) => {
          note.y = -50 - index * 150 // Espaciadas
          note.active = true
          note.hit = false
          note.lane = Math.floor(Math.random() * TOTAL_LANES) // Carril aleatorio
        })
      }
    }

    // ==========================================
    // GAME LOOP: El corazón del juego
    // ==========================================
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      // 1. ACTUALIZAR
      update(deltaTime)

      // 2. DIBUJAR
      drawBackground(ctx, canvas)

      // Dibujar todas las notas activas y no golpeadas
      for (const note of notes) {
        if (note.active && !note.hit) {
          drawNote(ctx, note.lane, note.y)
        }
      }

      // Dibujar zona de hit (con posibles flashes)
      drawHitZone(ctx, laneFlashes, currentTime)

      // Dibujar feedback (PERFECT!, GOOD, etc)
      drawFeedback(ctx, feedback, currentTime, combo)

      // 3. REPETIR
      animationId = requestAnimationFrame(gameLoop)
    }

    // Iniciar el game loop
    animationId = requestAnimationFrame(gameLoop)

    // ==========================================
    // CLEANUP: Cuando el componente se desmonte
    // ==========================================
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown) // ¡Importante! Quitar el listener
    }
  }, [drawBackground, drawHitZone, drawNote, drawFeedback])

  return {
    canvasRef,
    canvasWidth: GAME_CONFIG.canvasWidth,
    canvasHeight: GAME_CONFIG.canvasHeight,
  }
}
