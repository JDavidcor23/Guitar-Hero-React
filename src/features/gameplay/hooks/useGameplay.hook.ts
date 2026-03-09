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
  KEY_TO_LANE,
  GAMEPAD_BUTTON_TO_LANE,
  GAMEPAD_PAUSE_BUTTON,
  HIT_WINDOWS,
  FEEDBACK_DURATION,
  SPAWN_AHEAD_TIME,
  SPAWN_Y,
  PAUSE_KEY,
  SUSTAIN_CONFIG,
  SUSTAIN_SCORING,
} from '../constants/game.constants'
import { useGamepad } from './useGamepad.hook'

// Módulos extraídos
import { drawHighway } from '../renderers/highwayRenderer'
import { drawNote, drawHitZone, drawSustainTail } from '../renderers/noteRenderer'
import { drawHUD } from '../renderers/hudRenderer'
import { getMultiplier, calculatePoints } from '../utils/scoring'

// ==========================================
// TIPOS PARA LOS PARÁMETROS DEL HOOK
// ==========================================

interface UseGameplayParams {
  /** La canción a jugar (null si no hay ninguna cargada) */
  song: SongData | null
  /** Estado actual del juego (menu, countdown, playing, paused, finished) */
  gameState: GameState
  /** Callback cuando el juego termina (la canción acabó) */
  onGameEnd: (stats: GameStats) => void
  /** Callback cuando se presiona la tecla de pausa */
  onPauseToggle: () => void
  /** Callback cuando las estadísticas cambian (opcional, para UI en tiempo real) */
  onStatsChange?: (stats: GameStats) => void
  /** Función para obtener el tiempo del audio (más preciso que performance.now) */
  getAudioTime?: () => number
  /** Offset de calibración en milisegundos */
  calibrationOffset?: number
  /** Mapeo dinámico de teclas a carriles */
  keyToLane?: Record<string, number>
  /** Mapeo dinámico de botones de gamepad a carriles */
  gamepadButtonToLane?: Record<number, number>
  /** Botón de pausa del gamepad */
  gamepadPauseButton?: number
}

/**
 * Hook principal del juego Guitar Hero.
 *
 * Orquesta la lógica del juego: spawning de notas, detección de hits,
 * game loop, input handling, y delega el rendering a módulos especializados.
 *
 * @see ../renderers/ — Módulos de renderizado (highway, notas, HUD)
 * @see ../utils/scoring.ts — Lógica de puntuación
 */
export const useGameplay = ({
  song,
  gameState,
  onGameEnd,
  onPauseToggle,
  onStatsChange,
  getAudioTime,
  calibrationOffset = 0,
  keyToLane: customKeyToLane,
  gamepadButtonToLane: customGamepadButtonToLane,
  gamepadPauseButton: customGamepadPauseButton,
}: UseGameplayParams) => {
  // Mapeos activos (custom o defaults)
  const activeKeyToLane = customKeyToLane ?? KEY_TO_LANE
  const activeGamepadButtonToLane = customGamepadButtonToLane ?? GAMEPAD_BUTTON_TO_LANE
  const activeGamepadPauseButton = customGamepadPauseButton ?? GAMEPAD_PAUSE_BUTTON
  const keyToLaneRef = useRef(activeKeyToLane)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ==========================================
  // REFS COMPARTIDOS (Keyboard + Gamepad)
  // ==========================================
  // Estos refs permiten que tanto el teclado (dentro del useEffect)
  // como el gamepad hook (fuera del useEffect) llamen a la misma lógica.
  const checkHitRef = useRef<(lane: number, currentTime: number) => void>(() => {})
  const handleSustainReleaseRef = useRef<(lane: number) => void>(() => {})

  // ==========================================
  // GAMEPAD HOOK
  // ==========================================
  const handleGamepadButtonDown = useCallback((lane: number) => {
    checkHitRef.current(lane, performance.now())
  }, [])

  const handleGamepadButtonUp = useCallback((lane: number) => {
    handleSustainReleaseRef.current(lane)
  }, [])

  // Mantener ref de keyToLane sincronizado
  useEffect(() => {
    keyToLaneRef.current = activeKeyToLane
  }, [activeKeyToLane])

  const { isGamepadConnected, gamepadName } = useGamepad({
    onButtonDown: handleGamepadButtonDown,
    onButtonUp: handleGamepadButtonUp,
    onPause: onPauseToggle,
    enabled: gameState === 'playing' || gameState === 'paused',
    buttonToLane: activeGamepadButtonToLane,
    pauseButton: activeGamepadPauseButton,
  })

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
      drawHighway(ctx, canvas, 0)
      return
    }

    // ==========================================
    // ESTADO DEL JUEGO
    // ==========================================

    /** Convierte las notas del JSON a GameNote (con propiedades de gameplay) */
    const gameNotes: GameNote[] = song.notes.map((note) => ({
      segundo: note.segundo,
      carril: note.carril,
      y: SPAWN_Y,
      spawned: false,
      hit: false,
      missed: false,
      duracion: note.duracion || 0,
    }))

    let nextNoteIndex = 0

    const stats: GameStats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      goods: 0,
      oks: 0,
      misses: 0,
      sustainsHit: 0,
      sustainsComplete: 0,
      sustainsDropped: 0,
    }

    let lastHit: LastHitInfo = {
      result: null,
      points: 0,
      expireTime: 0,
    }

    const laneFlashes: LaneFlashState = {}
    const activeSustains = new Map<number, number>()

    // ==========================================
    // SISTEMA DE TIEMPO
    // ==========================================
    let gameTime = 0
    let gameStartTimestamp: number | null = null
    const pausedGameTime = 0
    let animationId: number
    const isPaused = gameState === 'paused'

    /** Velocidad de las notas (pixels/segundo) */
    const noteSpeed = (GAME_CONFIG.hitZoneY - SPAWN_Y) / SPAWN_AHEAD_TIME

    // ==========================================
    // SPAWNING Y MOVIMIENTO DE NOTAS
    // ==========================================

    const spawnNotes = () => {
      while (nextNoteIndex < gameNotes.length) {
        const note = gameNotes[nextNoteIndex]
        if (note.segundo - SPAWN_AHEAD_TIME <= gameTime) {
          const timeUntilHit = note.segundo - gameTime
          note.y = GAME_CONFIG.hitZoneY - timeUntilHit * noteSpeed
          note.spawned = true
          nextNoteIndex++
        } else {
          break
        }
      }
    }

    const updateNotes = (deltaTime: number) => {
      for (const note of gameNotes) {
        if (!note.spawned || note.hit || note.missed) continue
        note.y += noteSpeed * deltaTime

        if (note.y > GAME_CONFIG.hitZoneY + GAME_CONFIG.noteRadius * 2) {
          note.missed = true
          stats.combo = 0
          stats.misses++
          lastHit = {
            result: 'miss',
            points: 0,
            expireTime: performance.now() + FEEDBACK_DURATION.text,
          }
          onStatsChange?.(stats)
        }
      }
    }

    // ==========================================
    // DETECCIÓN DE HITS
    // ==========================================

    const checkHit = (lane: number, currentTime: number) => {
      if (isPaused) return

      laneFlashes[lane] = currentTime + FEEDBACK_DURATION.flash

      let closestNote: GameNote | null = null
      let closestDistance = Infinity

      for (const note of gameNotes) {
        if (!note.spawned || note.hit || note.missed || note.carril !== lane) continue
        const distance = Math.abs(note.y - GAME_CONFIG.hitZoneY)
        if (distance < closestDistance && distance <= HIT_WINDOWS.ok) {
          closestNote = note
          closestDistance = distance
        }
      }

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

        const points = calculatePoints(result, stats.combo)
        stats.score += points

        if (stats.combo > stats.maxCombo) {
          stats.maxCombo = stats.combo
        }

        closestNote.hit = true

        if (closestNote.duracion > 0) {
          closestNote.sustainActive = true
          activeSustains.set(lane, gameNotes.indexOf(closestNote))
          stats.sustainsHit++
        }

        lastHit = { result, points, expireTime: currentTime + FEEDBACK_DURATION.text }
        onStatsChange?.(stats)
      } else {
        result = 'miss'
        stats.combo = 0
        stats.misses++
        lastHit = { result, points: 0, expireTime: currentTime + FEEDBACK_DURATION.text }
        onStatsChange?.(stats)
      }
    }

    /** Lógica de release para sustains (compartida entre teclado y gamepad) */
    const handleSustainRelease = (lane: number) => {
      if (isPaused) return

      const noteIndex = activeSustains.get(lane)
      if (noteIndex !== undefined) {
        const note = gameNotes[noteIndex]
        const expectedEnd = note.segundo + note.duracion

        if (gameTime >= expectedEnd) {
          note.sustainComplete = true
          note.sustainActive = false
          stats.sustainsComplete++
          const { multiplier } = getMultiplier(stats.combo)
          stats.score += SUSTAIN_SCORING.completionBonus * multiplier
        } else {
          note.sustainReleased = true
          note.sustainActive = false
          const heldPercent = (gameTime - note.segundo) / note.duracion
          if (heldPercent < SUSTAIN_SCORING.minHoldPercent) {
            stats.combo = 0
            stats.sustainsDropped++
          }
        }

        activeSustains.delete(lane)
        onStatsChange?.(stats)
      }
    }

    // Exponer las funciones via refs para que el gamepad hook las use
    checkHitRef.current = checkHit
    handleSustainReleaseRef.current = handleSustainRelease

    // ==========================================
    // INPUT HANDLING (TECLADO)
    // ==========================================

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === PAUSE_KEY) {
        event.preventDefault()
        onPauseToggle()
        return
      }
      if (isPaused) return

      const key = event.key.toLowerCase()
      const lane = keyToLaneRef.current[key]
      if (lane === undefined) return
      if (event.repeat) return

      checkHit(lane, performance.now())
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const lane = keyToLaneRef.current[key]
      if (lane === undefined) return

      handleSustainRelease(lane)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // ==========================================
    // SUSTAIN UPDATES
    // ==========================================

    const updateSustains = (deltaTime: number) => {
      for (const [lane, noteIndex] of activeSustains.entries()) {
        const note = gameNotes[noteIndex]
        const expectedEnd = note.segundo + note.duracion
        const { multiplier } = getMultiplier(stats.combo)
        const pointsThisFrame = Math.floor(SUSTAIN_SCORING.pointsPerSecond * deltaTime * multiplier)
        stats.score += pointsThisFrame

        if (gameTime >= expectedEnd) {
          note.sustainComplete = true
          note.sustainActive = false
          stats.sustainsComplete++
          stats.score += SUSTAIN_SCORING.completionBonus * multiplier
          activeSustains.delete(lane)
          onStatsChange?.(stats)
        }
      }
    }

    // ==========================================
    // GAME LOOP
    // ==========================================
    let lastFrameTime = 0

    const gameLoop = (currentTime: number) => {
      const deltaTime = lastFrameTime === 0 ? 0 : (currentTime - lastFrameTime) / 1000
      lastFrameTime = currentTime

      if (!isPaused) {
        // Actualizar gameTime
        if (getAudioTime) {
          const audioTime = getAudioTime()
          if (audioTime >= 0) {
            gameTime = audioTime + calibrationOffset / 1000
          } else {
            if (gameStartTimestamp === null) gameStartTimestamp = currentTime
            gameTime = pausedGameTime + (currentTime - gameStartTimestamp) / 1000
          }
        } else {
          if (gameStartTimestamp === null) gameStartTimestamp = currentTime
          gameTime = pausedGameTime + (currentTime - gameStartTimestamp) / 1000
        }

        // Verificar si la canción terminó
        if (gameTime >= song.metadata.duration) {
          for (const note of gameNotes) {
            if (note.spawned && !note.hit && !note.missed) {
              note.missed = true
              stats.misses++
            }
          }
          onGameEnd(stats)
          return
        }

        spawnNotes()
        updateNotes(deltaTime)
        updateSustains(deltaTime)
      }

      // ==========================================
      // RENDERING (delegado a módulos)
      // ==========================================
      drawHighway(ctx, canvas, gameTime)

      // 1. Colas de sustain (debajo de las cabezas)
      for (const note of gameNotes) {
        if (note.spawned && note.duracion > 0 && !note.missed && !note.sustainComplete && !note.sustainReleased) {
          const tailLength = Math.max(SUSTAIN_CONFIG.minVisualLength, note.duracion * noteSpeed)
          let headY = note.y
          let tailEndY = note.y - tailLength

          if (note.sustainActive) {
            headY = GAME_CONFIG.hitZoneY
            const elapsedInSustain = gameTime - note.segundo
            const consumedLength = elapsedInSustain * noteSpeed
            tailEndY = GAME_CONFIG.hitZoneY - tailLength + consumedLength
          }

          tailEndY = Math.max(SPAWN_Y, tailEndY)
          drawSustainTail(ctx, note.carril, headY, tailEndY, note.sustainActive || false, note.sustainComplete || false, note.sustainReleased || false)
        }
      }

      // 2. Cabezas de notas (ordenadas por Y → las lejanas se dibujan atrás)
      const sortedNotes = [...gameNotes].sort((a, b) => a.y - b.y)
      for (const note of sortedNotes) {
        if (note.spawned && !note.hit && !note.missed) {
          drawNote(ctx, note.carril, note.y)
        }
        if (note.sustainActive) {
          drawNote(ctx, note.carril, GAME_CONFIG.hitZoneY)
        }
      }

      drawHitZone(ctx, laneFlashes, currentTime)
      drawHUD(ctx, stats, lastHit, currentTime, gameTime, song.metadata.duration, song.metadata.songName, getMultiplier)

      // Pause overlay is now handled by HTML in Gameplay.tsx

      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    // ==========================================
    // CLEANUP
    // ==========================================
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [song, gameState, onGameEnd, onPauseToggle, onStatsChange, getAudioTime, calibrationOffset])

  return {
    canvasRef,
    canvasWidth: GAME_CONFIG.canvasWidth,
    canvasHeight: GAME_CONFIG.canvasHeight,
    isGamepadConnected,
    gamepadName,
  }
}
