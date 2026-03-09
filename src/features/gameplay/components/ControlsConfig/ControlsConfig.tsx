import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LANE_NAMES,
  LANE_COLORS,
  GAMEPAD_BUTTON_NAMES,
} from '../../hooks/useControlsConfig.hook'
import type { UseControlsConfigReturn } from '../../hooks/useControlsConfig.hook'

// ==========================================
// TIPOS
// ==========================================

interface ControlsConfigProps {
  controlsConfig: UseControlsConfigReturn
  isGamepadConnected: boolean
  gamepadName: string | null
  onBack: () => void
}

type RemapTarget =
  | { type: 'keyboard'; lane: number }
  | { type: 'gamepad'; lane: number }
  | null

// ==========================================
// COMPONENTE
// ==========================================

/**
 * Submenú interactivo de remapeo de controles.
 * Muestra los mapeos actuales y permite cambiarlos haciendo click.
 */
export const ControlsConfig = ({
  controlsConfig,
  isGamepadConnected,
  gamepadName,
  onBack,
}: ControlsConfigProps) => {
  const [remapTarget, setRemapTarget] = useState<RemapTarget>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    remapKey,
    remapGamepadButton,
    resetDefaults,
    getKeyForLane,
    getButtonForLane,
  } = controlsConfig

  // ==========================================
  // ESCUCHA DE INPUT PARA REMAPEO
  // ==========================================

  /** Escuchar teclas cuando estamos remapeando teclado */
  useEffect(() => {
    if (!remapTarget || remapTarget.type !== 'keyboard') return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Ignorar teclas especiales
      if (['Escape', 'Tab', 'Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) {
        if (e.key === 'Escape') {
          setRemapTarget(null)
        }
        return
      }

      remapKey(remapTarget.lane, e.key.toLowerCase())
      setRemapTarget(null)
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [remapTarget, remapKey])

  /** Escuchar botones del gamepad cuando estamos remapeando gamepad */
  useEffect(() => {
    if (!remapTarget || remapTarget.type !== 'gamepad') return

    let animFrame: number
    let prevStates: boolean[] = []

    const poll = () => {
      const gamepads = navigator.getGamepads()
      for (const gp of gamepads) {
        if (!gp) continue

        // Inicializar estados previos
        if (prevStates.length !== gp.buttons.length) {
          prevStates = gp.buttons.map((b) => b.pressed)
          animFrame = requestAnimationFrame(poll)
          return
        }

        for (let i = 0; i < gp.buttons.length; i++) {
          const pressed = gp.buttons[i].pressed
          const wasPressed = prevStates[i]

          // Detectar botón recién presionado (edge)
          if (pressed && !wasPressed) {
            remapGamepadButton(remapTarget.lane, i)
            setRemapTarget(null)
            return
          }

          prevStates[i] = pressed
        }
        break // Solo usar el primer gamepad
      }

      animFrame = requestAnimationFrame(poll)
    }

    animFrame = requestAnimationFrame(poll)

    // Escapar con teclado
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setRemapTarget(null)
      }
    }
    window.addEventListener('keydown', handleEscape, { capture: true })

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('keydown', handleEscape, { capture: true })
    }
  }, [remapTarget, remapGamepadButton])

  /** Iniciar remapeo de teclado */
  const startKeyRemap = useCallback((lane: number) => {
    setRemapTarget({ type: 'keyboard', lane })
  }, [])

  /** Iniciar remapeo de gamepad */
  const startGamepadRemap = useCallback((lane: number) => {
    setRemapTarget({ type: 'gamepad', lane })
  }, [])

  /** Formatear nombre de tecla para mostrar */
  const formatKeyName = (key: string): string => {
    if (key === ' ') return 'ESPACIO'
    if (key.length === 1) return key.toUpperCase()
    return key.toUpperCase()
  }

  /** Obtener nombre de botón de gamepad */
  const getButtonName = (button: number): string => {
    return GAMEPAD_BUTTON_NAMES[button] || `Btn ${button}`
  }

  const handleReset = useCallback(() => {
    resetDefaults()
    setRemapTarget(null)
  }, [resetDefaults])

  return (
    <div className="game-controls-config" ref={containerRef}>
      <h2 className="game-controls-config__title">⚙ CONTROLES</h2>

      {/* Indicador de gamepad */}
      {isGamepadConnected && (
        <div className="game-controls-config__gamepad-info">
          🎮 {gamepadName || 'Gamepad conectado'}
        </div>
      )}

      {/* Tabla de controles */}
      <div className="game-controls-config__table">
        {/* Headers */}
        <div className="game-controls-config__header">
          <span className="game-controls-config__header-cell">CARRIL</span>
          <span className="game-controls-config__header-cell">TECLADO</span>
          {isGamepadConnected && (
            <span className="game-controls-config__header-cell">GAMEPAD</span>
          )}
        </div>

        {/* Filas por cada carril */}
        {LANE_NAMES.map((name, lane) => {
          const currentKey = getKeyForLane(lane)
          const currentButton = getButtonForLane(lane)
          const isRemappingKey = remapTarget?.type === 'keyboard' && remapTarget.lane === lane
          const isRemappingBtn = remapTarget?.type === 'gamepad' && remapTarget.lane === lane

          return (
            <div key={lane} className="game-controls-config__row">
              {/* Color + Nombre del carril */}
              <span className="game-controls-config__lane">
                <span
                  className="game-controls-config__lane-dot"
                  style={{ backgroundColor: LANE_COLORS[lane] }}
                />
                {name}
              </span>

              {/* Tecla de teclado */}
              <button
                className={`game-controls-config__key-btn ${isRemappingKey ? 'game-controls-config__key-btn--listening' : ''}`}
                onClick={() => startKeyRemap(lane)}
                title="Click para cambiar tecla"
              >
                {isRemappingKey
                  ? '...'
                  : currentKey
                    ? formatKeyName(currentKey)
                    : '—'}
              </button>

              {/* Botón de gamepad (solo si hay gamepad) */}
              {isGamepadConnected && (
                <button
                  className={`game-controls-config__key-btn game-controls-config__key-btn--gamepad ${isRemappingBtn ? 'game-controls-config__key-btn--listening' : ''}`}
                  onClick={() => startGamepadRemap(lane)}
                  title="Click y presiona un botón del control"
                >
                  {isRemappingBtn
                    ? '...'
                    : currentButton !== undefined
                      ? getButtonName(currentButton)
                      : '—'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Indicación cuando está en modo escucha */}
      {remapTarget && (
        <div className="game-controls-config__listening-hint">
          {remapTarget.type === 'keyboard'
            ? '⌨ Presiona una tecla...'
            : '🎮 Presiona un botón del control...'}
          <br />
          <small>ESC para cancelar</small>
        </div>
      )}

      {/* Botones de acción */}
      <div className="game-controls-config__actions">
        <button
          className="game-pause-btn game-controls-config__reset-btn"
          onClick={handleReset}
        >
          ↺ RESTAURAR DEFAULTS
        </button>
        <button
          className="game-pause-btn game-pause-btn--resume"
          onClick={onBack}
        >
          ← VOLVER
        </button>
      </div>
    </div>
  )
}
