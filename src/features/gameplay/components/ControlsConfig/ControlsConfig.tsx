import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LANE_NAMES,
  LANE_COLORS,
  GAMEPAD_BUTTON_NAMES,
} from '../../hooks/useControlsConfig.hook'
import type { UseControlsConfigReturn } from '../../hooks/useControlsConfig.hook'
import { useGamepadNavigation } from '../../../../hooks/useGamepadNavigation'

// ==========================================
// TIPOS
// ==========================================

interface ControlsConfigProps {
  controlsConfig: UseControlsConfigReturn
  isGamepadConnected: boolean
  gamepadName: string | null
  onBack: () => void
}

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
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    remapKey,
    remapGamepadButton,
    resetDefaults,
    getKeyForLane,
    getButtonForLane,
  } = controlsConfig

  const rowCount = LANE_NAMES.length // 5 cariles

  // row: 0 a 4 son carriles, 5 y 6 son acciones.
  const [focusedRow, setFocusedRow] = useState(0)

  // ==========================================
  // RAPID INPUT MAPPING (KEYBOARD)
  // ==========================================
  useEffect(() => {
    // Only map if a lane row is focused
    if (focusedRow >= rowCount) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore navigation and special keys
      if (['Escape', 'Tab', 'Alt', 'Control', 'Shift', 'Meta', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        return
      }
      e.preventDefault()
      e.stopPropagation()

      remapKey(focusedRow, e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [focusedRow, rowCount, remapKey])

  // ==========================================
  // RAPID INPUT MAPPING (GAMEPAD)
  // ==========================================
  useEffect(() => {
    if (focusedRow >= rowCount || !isGamepadConnected) return

    let animFrame: number
    let prevStates: boolean[] = []

    const poll = () => {
      const gamepads = navigator.getGamepads()
      for (const gp of gamepads) {
        if (!gp) continue

        if (prevStates.length !== gp.buttons.length) {
          prevStates = gp.buttons.map((b) => b.pressed)
          animFrame = requestAnimationFrame(poll)
          return
        }

        for (let i = 0; i < gp.buttons.length; i++) {
          const pressed = gp.buttons[i].pressed
          const wasPressed = prevStates[i]

          if (pressed && !wasPressed) {
            // Ignore D-pad (12-15) to preserve Gamepad navigation features
            // Ignore Start(9) and Select(8) as safe actions
            if ((i >= 12 && i <= 15) || i === 8 || i === 9) {
              continue
            }
            remapGamepadButton(focusedRow, i)
          }

          prevStates[i] = pressed
        }
        break // Only first
      }

      animFrame = requestAnimationFrame(poll)
    }

    animFrame = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(animFrame)
  }, [focusedRow, rowCount, isGamepadConnected, remapGamepadButton])

  // ==========================================
  // BUTTON FORMATTERS & HANDLERS
  // ==========================================

  const formatKeyName = (key: string): string => {
    if (key === ' ') return 'ESPACIO'
    if (key.length === 1) return key.toUpperCase()
    return key.toUpperCase()
  }

  const getButtonName = (button: number): string => {
    return GAMEPAD_BUTTON_NAMES[button] || `Btn ${button}`
  }

  const handleReset = useCallback(() => {
    resetDefaults()
  }, [resetDefaults])

  useGamepadNavigation({
    enabled: true,
    onUp: () => setFocusedRow(r => Math.max(0, r - 1)),
    onDown: () => setFocusedRow(r => Math.min(rowCount + 1, r + 1)), // +1 for Reset, +1 for Back
    onConfirm: () => {
      if (focusedRow === rowCount) {
        handleReset()
      } else if (focusedRow === rowCount + 1) {
        onBack()
      }
    },
    onCancel: () => {
      onBack()
    }
  })

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
          const isFocused = focusedRow === lane

          return (
            <div 
              key={lane} 
              className={`game-controls-config__row ${isFocused ? 'game-controls-config__row--focused' : ''}`}
              onMouseEnter={() => setFocusedRow(lane)}
            >
              {/* Color + Nombre del carril */}
              <span className="game-controls-config__lane">
                <span
                  className="game-controls-config__lane-dot"
                  style={{ backgroundColor: LANE_COLORS[lane] }}
                />
                {name}
              </span>

              {/* Tecla de teclado */}
              <div
                className="game-controls-config__key-badge"
              >
                {currentKey ? formatKeyName(currentKey) : '—'}
              </div>

              {/* Botón de gamepad (solo si hay gamepad) */}
              {isGamepadConnected && (
                <div
                  className="game-controls-config__key-badge game-controls-config__key-badge--gamepad"
                >
                  {currentButton !== undefined ? getButtonName(currentButton) : '—'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="game-controls-config__listening-hint">
        💡 <strong>Selecciona una fila</strong> y presiona<br/>
        cualquier tecla o botón para reasignarlo.
      </div>

      {/* Botones de acción */}
      <div className="game-controls-config__actions">
        <button
          className={`game-pause-btn game-controls-config__reset-btn ${focusedRow === rowCount ? 'game-pause-btn--focused' : ''}`}
          onClick={handleReset}
          onMouseEnter={() => setFocusedRow(rowCount)}
        >
          ↺ RESTAURAR DEFAULTS
        </button>
        <button
          className={`game-pause-btn game-pause-btn--resume ${focusedRow === rowCount + 1 ? 'game-pause-btn--focused' : ''}`}
          onClick={onBack}
          onMouseEnter={() => setFocusedRow(rowCount + 1)}
        >
          ← VOLVER
        </button>
      </div>
    </div>
  )
}
