import { useEffect, useRef, useCallback, useState } from 'react'

interface UseGamepadNavigationParams {
  onUp?: () => void
  onDown?: () => void
  onLeft?: () => void
  onRight?: () => void
  onConfirm?: () => void
  onCancel?: () => void
  onY?: () => void
  enabled?: boolean
  cooldownMs?: number
}

// Gamepad standard mapping (Xbox style)
const BUTTONS = {
  A: 0,         // Confirm
  B: 1,         // Cancel
  Y: 3,         // Action / Options
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
}

const AXIS_THRESHOLD = 0.5

export const useGamepadNavigation = ({
  onUp,
  onDown,
  onLeft,
  onRight,
  onConfirm,
  onCancel,
  onY,
  enabled = true,
  cooldownMs = 200,
}: UseGamepadNavigationParams) => {
  const requestRef = useRef<number>(0)
  const lastActionTimeRef = useRef<number>(0)
  
  // To track edge transitions for buttons (so holding A doesn't spam confirm)
  const prevButtonsRef = useRef<boolean[]>([])
  
  // Track if we have a gamepad connected for UI hints
  const [hasGamepad, setHasGamepad] = useState(false)

  // Stable references for callbacks to avoid re-binding in the animation loop
  const callbacksRef = useRef({ onUp, onDown, onLeft, onRight, onConfirm, onCancel, onY })
  useEffect(() => {
    callbacksRef.current = { onUp, onDown, onLeft, onRight, onConfirm, onCancel, onY }
  }, [onUp, onDown, onLeft, onRight, onConfirm, onCancel, onY])

  useEffect(() => {
    const checkGamepads = () => {
      const gamepads = navigator.getGamepads()
      setHasGamepad(gamepads.some(gp => gp !== null))
    }
    
    window.addEventListener('gamepadconnected', checkGamepads)
    window.addEventListener('gamepaddisconnected', checkGamepads)
    checkGamepads() // Initial check
    
    return () => {
      window.removeEventListener('gamepadconnected', checkGamepads)
      window.removeEventListener('gamepaddisconnected', checkGamepads)
    }
  }, [])

  const pollGamepad = useCallback(() => {
    if (!enabled) {
      requestRef.current = requestAnimationFrame(pollGamepad)
      return
    }

    const gamepads = navigator.getGamepads()
    const gp = gamepads.find(gp => gp !== null)

    if (gp) {
      const now = performance.now()
      const canNavigate = now - lastActionTimeRef.current > cooldownMs
      
      const { onUp, onDown, onLeft, onRight, onConfirm, onCancel, onY } = callbacksRef.current
      
      // Initialize prevButtonsRef if needed
      if (prevButtonsRef.current.length !== gp.buttons.length) {
         prevButtonsRef.current = new Array(gp.buttons.length).fill(false)
      }

      // Handle Directional Navigation (D-Pad or Left Stick) with cooldown
      if (canNavigate) {
        let navigated = false

        // D-Pad (Discrete Navigation)
        if (gp.buttons[BUTTONS.DPAD_UP]?.pressed || gp.axes[1] < -AXIS_THRESHOLD) {
          onUp?.()
          navigated = true
        } else if (gp.buttons[BUTTONS.DPAD_DOWN]?.pressed || gp.axes[1] > AXIS_THRESHOLD) {
          onDown?.()
          navigated = true
        } else if (gp.buttons[BUTTONS.DPAD_LEFT]?.pressed || gp.axes[0] < -AXIS_THRESHOLD) {
          onLeft?.()
          navigated = true
        } else if (gp.buttons[BUTTONS.DPAD_RIGHT]?.pressed || gp.axes[0] > AXIS_THRESHOLD) {
          onRight?.()
          navigated = true
        }

        if (navigated) {
          lastActionTimeRef.current = now
        }
      }

      // Handle Continuous Scrolling with Right Joystick
      const axisScrollX = gp.axes[2]
      const axisScrollY = gp.axes[3]
      // Add a small deadzone of 0.15
      if (Math.abs(axisScrollX) > 0.15 || Math.abs(axisScrollY) > 0.15) {
        const dx = Math.abs(axisScrollX) > 0.15 ? axisScrollX * 16 : 0 // 16px per frame = ~960px/sec at max tilt
        const dy = Math.abs(axisScrollY) > 0.15 ? axisScrollY * 16 : 0
        
        // Scroll window
        window.scrollBy({ left: dx, top: dy })
        
        // Some React apps have a root container holding the scroll
        const root = document.getElementById('root')
        if (root && root.scrollHeight > root.clientHeight) {
          root.scrollBy({ left: dx, top: dy })
        }
      }

      // Handle Action Buttons (A/B) with edge detection (press once per action)
      const isConfirmPressed = gp.buttons[BUTTONS.A]?.pressed === true
      const isCancelPressed = gp.buttons[BUTTONS.B]?.pressed === true
      const isYPressed = gp.buttons[BUTTONS.Y]?.pressed === true

      const wasConfirmPressed = prevButtonsRef.current[BUTTONS.A] || false
      const wasCancelPressed = prevButtonsRef.current[BUTTONS.B] || false
      const wasYPressed = prevButtonsRef.current[BUTTONS.Y] || false

      if (isConfirmPressed && !wasConfirmPressed) {
        onConfirm?.()
      }
      if (isCancelPressed && !wasCancelPressed) {
        onCancel?.()
      }
      if (isYPressed && !wasYPressed) {
        onY?.()
      }

      // Update previous states
      prevButtonsRef.current[BUTTONS.A] = isConfirmPressed
      prevButtonsRef.current[BUTTONS.B] = isCancelPressed
      prevButtonsRef.current[BUTTONS.Y] = isYPressed
    }

    requestRef.current = requestAnimationFrame(pollGamepad)
  }, [enabled, cooldownMs])

  useEffect(() => {
    requestRef.current = requestAnimationFrame(pollGamepad)
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [pollGamepad])

  return { hasGamepad }
}
