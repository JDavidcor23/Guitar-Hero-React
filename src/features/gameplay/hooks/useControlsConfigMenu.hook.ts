import { useState, useEffect, useCallback } from 'react'
import { LANE_NAMES } from '../hooks/useControlsConfig.hook'
import type { UseControlsConfigReturn } from '../hooks/useControlsConfig.hook'
import { useGamepadNavigation } from '../../../hooks/useGamepadNavigation'

interface UseControlsConfigMenuOptions {
  controlsConfig: UseControlsConfigReturn
  isGamepadConnected: boolean
  onBack: () => void
}

export const useControlsConfigMenu = ({
  controlsConfig,
  isGamepadConnected,
  onBack,
}: UseControlsConfigMenuOptions) => {
  const {
    remapKey,
    remapGamepadButton,
    resetDefaults,
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

  return {
    focusedRow,
    setFocusedRow,
    handleReset,
    rowCount,
  }
}
