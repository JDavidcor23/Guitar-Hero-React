import { useState, useCallback } from 'react'
import {
  KEY_TO_LANE as DEFAULT_KEY_TO_LANE,
  GAMEPAD_BUTTON_TO_LANE as DEFAULT_GAMEPAD_BUTTON_TO_LANE,
  GAMEPAD_PAUSE_BUTTON as DEFAULT_GAMEPAD_PAUSE_BUTTON,
} from '../constants/game.constants'
import {
  loadKeyboardControls,
  loadGamepadControls,
  loadGamepadPauseButton,
  saveKeyboardControls,
  saveGamepadControls,
  saveGamepadPauseButton,
} from '../utils/controlsStorage'

// ==========================================
// CONSTANTES EXPORTADAS (UI)
// ==========================================

export const LANE_NAMES = ['Verde', 'Rojo', 'Amarillo', 'Azul', 'Naranja'] as const
export const LANE_COLORS = ['#00FF00', '#FF0000', '#FFFF00', '#0088FF', '#FF8800'] as const
export const GAMEPAD_BUTTON_NAMES: Record<number, string> = {
  0: 'A',
  1: 'B',
  2: 'X',
  3: 'Y',
  4: 'LB',
  5: 'RB',
  6: 'LT',
  7: 'RT',
  8: 'Back',
  9: 'Start',
  10: 'L3',
  11: 'R3',
  12: 'D-Up',
  13: 'D-Down',
  14: 'D-Left',
  15: 'D-Right',
  16: 'Home',
}

// ==========================================
// TIPOS
// ==========================================

export interface ControlsConfig {
  keyToLane: Record<string, number>
  gamepadButtonToLane: Record<number, number>
  gamepadPauseButton: number
}

export interface UseControlsConfigReturn extends ControlsConfig {
  remapKey: (lane: number, newKey: string) => void
  remapGamepadButton: (lane: number, newButton: number) => void
  setGamepadPauseButton: (button: number) => void
  resetDefaults: () => void
  getKeyForLane: (lane: number) => string | undefined
  getButtonForLane: (lane: number) => number | undefined
}

// ==========================================
// HOOK
// ==========================================

/**
 * Hook para gestionar la configuración de Controls (teclado + gamepad).
 * Reducido usando controlsStorage para persistencia.
 */
export const useControlsConfig = (): UseControlsConfigReturn => {
  const [keyToLane, setKeyToLane] = useState<Record<string, number>>(loadKeyboardControls)
  const [gamepadButtonToLane, setGamepadButtonToLane] = useState<Record<number, number>>(loadGamepadControls)
  const [gamepadPauseButton, setGamepadPauseButtonState] = useState<number>(loadGamepadPauseButton)

  const remapKey = useCallback((lane: number, newKey: string) => {
    setKeyToLane((prev) => {
      const updated: Record<string, number> = {}
      for (const [key, value] of Object.entries(prev)) {
        if (value !== lane && key !== newKey) updated[key] = value
      }
      updated[newKey] = lane
      saveKeyboardControls(updated)
      return updated
    })
  }, [])

  const remapGamepadButton = useCallback((lane: number, newButton: number) => {
    setGamepadButtonToLane((prev) => {
      const updated: Record<number, number> = {}
      for (const [key, value] of Object.entries(prev)) {
        const btnNum = Number(key)
        if (value !== lane && btnNum !== newButton) updated[btnNum] = value
      }
      updated[newButton] = lane
      saveGamepadControls(updated)
      return updated
    })
  }, [])

  const setGamepadPauseButton = useCallback((button: number) => {
    setGamepadPauseButtonState(button)
    saveGamepadPauseButton(button)
  }, [])

  const resetDefaults = useCallback(() => {
    const defaultKeys = { ...DEFAULT_KEY_TO_LANE }
    const defaultGamepad = { ...DEFAULT_GAMEPAD_BUTTON_TO_LANE }
    setKeyToLane(defaultKeys)
    setGamepadButtonToLane(defaultGamepad)
    setGamepadPauseButtonState(DEFAULT_GAMEPAD_PAUSE_BUTTON)
    
    saveKeyboardControls(defaultKeys)
    saveGamepadControls(defaultGamepad)
    saveGamepadPauseButton(DEFAULT_GAMEPAD_PAUSE_BUTTON)
  }, [])

  const getKeyForLane = useCallback(
    (lane: number): string | undefined => Object.entries(keyToLane).find(([, v]) => v === lane)?.[0],
    [keyToLane]
  )

  const getButtonForLane = useCallback(
    (lane: number): number | undefined => Object.entries(gamepadButtonToLane)
        .map(([k, v]) => [Number(k), v] as [number, number])
        .find(([, v]) => v === lane)?.[0],
    [gamepadButtonToLane]
  )

  return {
    keyToLane,
    gamepadButtonToLane,
    gamepadPauseButton,
    remapKey,
    remapGamepadButton,
    setGamepadPauseButton,
    resetDefaults,
    getKeyForLane,
    getButtonForLane,
  }
}
