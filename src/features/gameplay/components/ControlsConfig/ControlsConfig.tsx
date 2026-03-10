import { useRef } from 'react'
import {
  LANE_NAMES,
  LANE_COLORS,
  GAMEPAD_BUTTON_NAMES,
} from '../../hooks/useControlsConfig.hook'
import type { UseControlsConfigReturn } from '../../hooks/useControlsConfig.hook'
import { useControlsConfigMenu } from '../../hooks/useControlsConfigMenu.hook'

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
 * Submenú interactivo de remapeo de Controls.
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
    getKeyForLane,
    getButtonForLane,
  } = controlsConfig

  const {
    focusedRow,
    setFocusedRow,
    handleReset,
    rowCount,
  } = useControlsConfigMenu({
    controlsConfig,
    isGamepadConnected,
    onBack,
  })

  // ==========================================
  // BUTTON FORMATTERS & HANDLERS
  // ==========================================

  const formatKeyName = (key: string): string => {
    if (key === ' ') return 'SPACE'
    if (key.length === 1) return key.toUpperCase()
    return key.toUpperCase()
  }

  const getButtonName = (button: number): string => {
    return GAMEPAD_BUTTON_NAMES[button] || `Btn ${button}`
  }

  return (
    <div className="game-controls-config" ref={containerRef}>
      <h2 className="game-controls-config__title">⚙ Controls</h2>

      {/* Gamepad indicator */}
      {isGamepadConnected ? (
        <div className="game-controls-config__gamepad-info">
          🎮 {gamepadName || 'Gamepad Connected'}
        </div>
      ) : null}

      {/* Controls table */}
      <div className="game-controls-config__table">
        {/* Headers */}
        <div className="game-controls-config__header">
          <span className="game-controls-config__header-cell">LANE</span>
          <span className="game-controls-config__header-cell">KEYBOARD</span>
          {isGamepadConnected ? (
            <span className="game-controls-config__header-cell">GAMEPAD</span>
          ) : null}
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
              {isGamepadConnected ? (
                <div
                  className="game-controls-config__key-badge game-controls-config__key-badge--gamepad"
                >
                  {currentButton !== undefined ? getButtonName(currentButton) : '—'}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="game-controls-config__listening-hint">
        💡 <strong>Select a row</strong> and press<br/>
        any key or button to reassign it.
      </div>

      {/* Action buttons */}
      <div className="game-controls-config__actions">
        <button
          className={`game-pause-btn game-controls-config__reset-btn ${focusedRow === rowCount ? 'game-pause-btn--focused' : ''}`}
          onClick={handleReset}
          onMouseEnter={() => setFocusedRow(rowCount)}
        >
          ↺ RESTORE DEFAULTS
        </button>
        <button
          className={`game-pause-btn game-pause-btn--resume ${focusedRow === rowCount + 1 ? 'game-pause-btn--focused' : ''}`}
          onClick={onBack}
          onMouseEnter={() => setFocusedRow(rowCount + 1)}
        >
          ← BACK
        </button>
      </div>
    </div>
  )
}

