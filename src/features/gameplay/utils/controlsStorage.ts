import {
  KEY_TO_LANE as DEFAULT_KEY_TO_LANE,
  GAMEPAD_BUTTON_TO_LANE as DEFAULT_GAMEPAD_BUTTON_TO_LANE,
  GAMEPAD_PAUSE_BUTTON as DEFAULT_GAMEPAD_PAUSE_BUTTON,
} from '../constants/game.constants'

const STORAGE_KEY_KEYBOARD = 'guitar-hero-keyboard-controls'
const STORAGE_KEY_GAMEPAD = 'guitar-hero-gamepad-controls'
const STORAGE_KEY_GAMEPAD_PAUSE = 'guitar-hero-gamepad-pause-button'

export function loadKeyboardControls(): Record<string, number> {
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

export function loadGamepadControls(): Record<number, number> {
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

export function loadGamepadPauseButton(): number {
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

export function saveKeyboardControls(controls: Record<string, number>): void {
  localStorage.setItem(STORAGE_KEY_KEYBOARD, JSON.stringify(controls))
}

export function saveGamepadControls(controls: Record<number, number>): void {
  localStorage.setItem(STORAGE_KEY_GAMEPAD, JSON.stringify(controls))
}

export function saveGamepadPauseButton(button: number): void {
  localStorage.setItem(STORAGE_KEY_GAMEPAD_PAUSE, JSON.stringify(button))
}
