import { useEffect, useRef, useState, useCallback } from 'react'
import {
  GAMEPAD_BUTTON_TO_LANE,
  GAMEPAD_PAUSE_BUTTON,
  GAMEPAD_BUTTON_THRESHOLD,
} from '../constants/game.constants'

// ==========================================
// TIPOS
// ==========================================

interface UseGamepadParams {
  /** Se ejecuta cuando un botón de carril es presionado (equivale a keydown) */
  onButtonDown?: (lane: number) => void
  /** Se ejecuta cuando un botón de carril es soltado (equivale a keyup) */
  onButtonUp?: (lane: number) => void
  /** Se ejecuta cuando se presiona el botón de pausa */
  onPause?: () => void
  /** Si el polling está activo (false para desactivar, ej: en menú) */
  enabled?: boolean
  /** Mapeo dinámico de botones a carriles (si no se pasa, usa el default) */
  buttonToLane?: Record<number, number>
  /** Botón de pausa dinámico (si no se pasa, usa el default) */
  pauseButton?: number
}

interface GamepadState {
  /** Si hay un gamepad Conected */
  isConnected: boolean
  /** Nombre del gamepad Conected */
  gamepadName: string | null
  /** Índice del gamepad en navigator.getGamepads() */
  gamepadIndex: number | null
}

// ==========================================
// UTILIDADES
// ==========================================

/** Verifica si un botón del gamepad está presionado */
const isButtonPressed = (button: GamepadButton): boolean => {
  if (typeof button === 'object') {
    return button.pressed || button.value > GAMEPAD_BUTTON_THRESHOLD
  }
  return (button as unknown as number) > GAMEPAD_BUTTON_THRESHOLD
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook para leer input de un gamepad/control Conected.
 *
 * La Gamepad API del navegador es basada en polling (no tiene eventos para botones),
 * así que usamos requestAnimationFrame para leer el estado de los botones cada frame.
 *
 * Detectamos "edges" (transiciones pressed→released y released→pressed)
 * comparando con el estado del frame anterior, simulando keydown/keyup.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API
 */
export const useGamepad = ({
  onButtonDown,
  onButtonUp,
  onPause,
  enabled = true,
  buttonToLane,
  pauseButton,
}: UseGamepadParams = {}) => {
  // Usar mapeos dinámicos o defaults
  const activeButtonToLane = buttonToLane ?? GAMEPAD_BUTTON_TO_LANE
  const activePauseButton = pauseButton ?? GAMEPAD_PAUSE_BUTTON
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    isConnected: false,
    gamepadName: null,
    gamepadIndex: null,
  })

  // Refs para los callbacks (evita re-renders innecesarios del polling loop)
  const onButtonDownRef = useRef(onButtonDown)
  const onButtonUpRef = useRef(onButtonUp)
  const onPauseRef = useRef(onPause)
  const enabledRef = useRef(enabled)
  const buttonToLaneRef = useRef(activeButtonToLane)
  const pauseButtonRef = useRef(activePauseButton)

  // Estado de botones del frame anterior (para detectar edges)
  const prevButtonStates = useRef<boolean[]>([])

  // Ref para el animation frame ID
  const animFrameRef = useRef<number | null>(null)

  // Actualizar refs cuando cambian los callbacks
  useEffect(() => {
    onButtonDownRef.current = onButtonDown
  }, [onButtonDown])

  useEffect(() => {
    onButtonUpRef.current = onButtonUp
  }, [onButtonUp])

  useEffect(() => {
    onPauseRef.current = onPause
  }, [onPause])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    buttonToLaneRef.current = activeButtonToLane
  }, [activeButtonToLane])

  useEffect(() => {
    pauseButtonRef.current = activePauseButton
  }, [activePauseButton])

  // ==========================================
  // DETECCIÓN DE CONEXIÓN/DESCONEXIÓN
  // ==========================================
  useEffect(() => {
    const handleConnected = (event: GamepadEvent) => {
      console.log(`🎮 Gamepad Conected: ${event.gamepad.id}`)
      setGamepadState({
        isConnected: true,
        gamepadName: event.gamepad.id,
        gamepadIndex: event.gamepad.index,
      })
      // Inicializar estado de botones
      prevButtonStates.current = new Array(event.gamepad.buttons.length).fill(false)
    }

    const handleDisconnected = (event: GamepadEvent) => {
      console.log(`🎮 Gamepad desConected: ${event.gamepad.id}`)
      setGamepadState({
        isConnected: false,
        gamepadName: null,
        gamepadIndex: null,
      })
      prevButtonStates.current = []
    }

    window.addEventListener('gamepadconnected', handleConnected)
    window.addEventListener('gamepaddisconnected', handleDisconnected)

    // Verificar si ya hay un gamepad Conected al montar
    const gamepads = navigator.getGamepads()
    for (const gp of gamepads) {
      if (gp) {
        setGamepadState({
          isConnected: true,
          gamepadName: gp.id,
          gamepadIndex: gp.index,
        })
        prevButtonStates.current = new Array(gp.buttons.length).fill(false)
        break
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected)
      window.removeEventListener('gamepaddisconnected', handleDisconnected)
    }
  }, [])

  // ==========================================
  // POLLING LOOP (Lee botones cada frame)
  // ==========================================
  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads()
    const gp = gamepadState.gamepadIndex !== null ? gamepads[gamepadState.gamepadIndex] : null

    if (!gp || !enabledRef.current) {
      animFrameRef.current = requestAnimationFrame(pollGamepad)
      return
    }

    const buttons = gp.buttons
    const prevStates = prevButtonStates.current

    // Asegurar que prevStates tenga el tamaño correcto
    if (prevStates.length !== buttons.length) {
      prevButtonStates.current = new Array(buttons.length).fill(false)
      animFrameRef.current = requestAnimationFrame(pollGamepad)
      return
    }

    for (let i = 0; i < buttons.length; i++) {
      const currentlyPressed = isButtonPressed(buttons[i])
      const wasPressed = prevStates[i]

      if (currentlyPressed && !wasPressed) {
        // ── BOTÓN PRESIONADO (edge: released → pressed) ──
        if (i === pauseButtonRef.current) {
          onPauseRef.current?.()
        } else {
          const lane = buttonToLaneRef.current[i]
          if (lane !== undefined) {
            onButtonDownRef.current?.(lane)
          }
        }
      } else if (!currentlyPressed && wasPressed) {
        // ── BOTÓN SOLTADO (edge: pressed → released) ──
        const lane = buttonToLaneRef.current[i]
        if (lane !== undefined) {
          onButtonUpRef.current?.(lane)
        }
      }

      prevStates[i] = currentlyPressed
    }

    animFrameRef.current = requestAnimationFrame(pollGamepad)
  }, [gamepadState.gamepadIndex])

  // Iniciar/detener el polling según la conexión
  useEffect(() => {
    if (gamepadState.isConnected) {
      animFrameRef.current = requestAnimationFrame(pollGamepad)
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [gamepadState.isConnected, pollGamepad])

  return {
    isGamepadConnected: gamepadState.isConnected,
    gamepadName: gamepadState.gamepadName,
  }
}
