import { useState, useCallback } from 'react'
import {
  KEY_TO_LANE as DEFAULT_KEY_TO_LANE,
  GAMEPAD_BUTTON_TO_LANE as DEFAULT_GAMEPAD_BUTTON_TO_LANE,
  GAMEPAD_PAUSE_BUTTON as DEFAULT_GAMEPAD_PAUSE_BUTTON,
} from '../constants/game.constants'

// ==========================================
// CONSTANTES
// ==========================================

const STORAGE_KEY_KEYBOARD = 'guitar-hero-keyboard-controls'
const STORAGE_KEY_GAMEPAD = 'guitar-hero-gamepad-controls'
const STORAGE_KEY_GAMEPAD_PAUSE = 'guitar-hero-gamepad-pause-button'

/** Nombres de los carriles para mostrar en la UI */
export const LANE_NAMES = ['Verde', 'Rojo', 'Amarillo', 'Azul', 'Naranja'] as const

/** Colores de los carriles */
export const LANE_COLORS = ['#00FF00', '#FF0000', '#FFFF00', '#0088FF', '#FF8800'] as const

/** Nombres estándar de botones de gamepad (Xbox-style) */
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

export interface UseControlsConfigReturn {
  /** Mapeo actual de teclas a carriles */
  keyToLane: Record<string, number>
  /** Mapeo actual de botones de gamepad a carriles */
  gamepadButtonToLane: Record<number, number>
  /** Botón de pausa del gamepad */
  gamepadPauseButton: number
  /** Remapear una tecla de teclado para un carril específico */
  remapKey: (lane: number, newKey: string) => void
  /** Remapear un botón de gamepad para un carril específico */
  remapGamepadButton: (lane: number, newButton: number) => void
  /** Cambiar el botón de pausa del gamepad */
  setGamepadPauseButton: (button: number) => void
  /** Restaurar controles por defecto */
  resetDefaults: () => void
  /** Obtener la tecla asignada a un carril */
  getKeyForLane: (lane: number) => string | undefined
  /** Obtener el botón de gamepad asignado a un carril */
  getButtonForLane: (lane: number) => number | undefined
}

// ==========================================
// UTILIDADES DE PERSISTENCIA
// ==========================================

function loadKeyboardControls(): Record<string, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_KEYBOARD)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Si falla el parse, usar defaults
  }
  return { ...DEFAULT_KEY_TO_LANE }
}

function loadGamepadControls(): Record<number, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GAMEPAD)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Convertir keys de string a number (JSON las serializa como strings)
      const result: Record<number, number> = {}
      for (const [key, value] of Object.entries(parsed)) {
        result[Number(key)] = value as number
      }
      return result
    }
  } catch {
    // Si falla el parse, usar defaults
  }
  return { ...DEFAULT_GAMEPAD_BUTTON_TO_LANE }
}

function loadGamepadPauseButton(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GAMEPAD_PAUSE)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Si falla el parse, usar default
  }
  return DEFAULT_GAMEPAD_PAUSE_BUTTON
}

function saveKeyboardControls(controls: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY_KEYBOARD, JSON.stringify(controls))
}

function saveGamepadControls(controls: Record<number, number>): void {
  localStorage.setItem(STORAGE_KEY_GAMEPAD, JSON.stringify(controls))
}

function saveGamepadPauseButton(button: number): void {
  localStorage.setItem(STORAGE_KEY_GAMEPAD_PAUSE, JSON.stringify(button))
}

// ==========================================
// HOOK
// ==========================================

/**
 * Hook para gestionar la configuración de controles (teclado + gamepad).
 * Persiste los mapeos en localStorage y permite remapeo interactivo.
 */
export const useControlsConfig = (): UseControlsConfigReturn => {
  const [keyToLane, setKeyToLane] = useState<Record<string, number>>(loadKeyboardControls)
  const [gamepadButtonToLane, setGamepadButtonToLane] = useState<Record<number, number>>(loadGamepadControls)
  const [gamepadPauseButton, setGamepadPauseButtonState] = useState<number>(loadGamepadPauseButton)

  /** Remapear una tecla de teclado para un carril */
  const remapKey = useCallback((lane: number, newKey: string) => {
    setKeyToLane((prev) => {
      // Eliminar la asignación anterior de esta tecla (si existe)
      const updated: Record<string, number> = {}
      for (const [key, value] of Object.entries(prev)) {
        if (value !== lane && key !== newKey) {
          updated[key] = value
        }
      }
      // Asignar la nueva tecla al carril
      updated[newKey] = lane
      saveKeyboardControls(updated)
      return updated
    })
  }, [])

  /** Remapear un botón de gamepad para un carril */
  const remapGamepadButton = useCallback((lane: number, newButton: number) => {
    setGamepadButtonToLane((prev) => {
      // Eliminar la asignación anterior de este botón (si existe)
      const updated: Record<number, number> = {}
      for (const [key, value] of Object.entries(prev)) {
        const btnNum = Number(key)
        if (value !== lane && btnNum !== newButton) {
          updated[btnNum] = value
        }
      }
      // Asignar el nuevo botón al carril
      updated[newButton] = lane
      saveGamepadControls(updated)
      return updated
    })
  }, [])

  /** Cambiar el botón de pausa del gamepad */
  const setGamepadPauseButton = useCallback((button: number) => {
    setGamepadPauseButtonState(button)
    saveGamepadPauseButton(button)
  }, [])

  /** Restaurar controles por defecto */
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

  /** Obtener la tecla asignada a un carril */
  const getKeyForLane = useCallback(
    (lane: number): string | undefined => {
      return Object.entries(keyToLane).find(([, v]) => v === lane)?.[0]
    },
    [keyToLane]
  )

  /** Obtener el botón de gamepad asignado a un carril */
  const getButtonForLane = useCallback(
    (lane: number): number | undefined => {
      return Object.entries(gamepadButtonToLane)
        .map(([k, v]) => [Number(k), v] as [number, number])
        .find(([, v]) => v === lane)?.[0]
    },
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
