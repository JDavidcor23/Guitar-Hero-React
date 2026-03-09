import { useRef, useEffect, useCallback } from 'react'
import type { GameStats, SongData, GameState } from '../types/GuitarGame.types'
import {
  GAME_CONFIG,
  KEY_TO_LANE,
  GAMEPAD_BUTTON_TO_LANE,
  GAMEPAD_PAUSE_BUTTON,
  PAUSE_KEY,
} from '../constants/game.constants'
import { useGamepad } from './useGamepad.hook'
import { GameplayEngine } from '../services/GameplayEngine'
import { drawHighway } from '../renderers/highwayRenderer'

export interface UseGameplayParams {
  song: SongData | null
  gameState: GameState
  onGameEnd: (stats: GameStats) => void
  onPauseToggle: () => void
  onStatsChange?: (stats: GameStats) => void
  getAudioTime?: () => number
  calibrationOffset?: number
  keyToLane?: Record<string, number>
  gamepadButtonToLane?: Record<number, number>
  gamepadPauseButton?: number
}

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
  const activeKeyToLane = customKeyToLane ?? KEY_TO_LANE
  const activeGamepadButtonToLane = customGamepadButtonToLane ?? GAMEPAD_BUTTON_TO_LANE
  const activeGamepadPauseButton = customGamepadPauseButton ?? GAMEPAD_PAUSE_BUTTON
  const keyToLaneRef = useRef(activeKeyToLane)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const engineRef = useRef<GameplayEngine | null>(null)

  useEffect(() => {
    keyToLaneRef.current = activeKeyToLane
  }, [activeKeyToLane])

  const handleGamepadButtonDown = useCallback((lane: number) => {
    engineRef.current?.handleButtonDown(lane)
  }, [])

  const handleGamepadButtonUp = useCallback((lane: number) => {
    engineRef.current?.handleButtonUp(lane)
  }, [])

  const { isGamepadConnected, gamepadName } = useGamepad({
    onButtonDown: handleGamepadButtonDown,
    onButtonUp: handleGamepadButtonUp,
    onPause: onPauseToggle,
    enabled: gameState === 'playing' || gameState === 'paused',
    buttonToLane: activeGamepadButtonToLane,
    pauseButton: activeGamepadPauseButton,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (!song || (gameState !== 'playing' && gameState !== 'paused')) {
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
      if (ctx) drawHighway(ctx, canvas, 0)
      return
    }

    if (!engineRef.current) {
      engineRef.current = new GameplayEngine({
        canvas,
        song,
        onGameEnd,
        onStatsChange,
        getAudioTime,
        calibrationOffset,
      })
      engineRef.current.start()
    }

    engineRef.current.setPaused(gameState === 'paused')

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === PAUSE_KEY) {
        event.preventDefault()
        onPauseToggle()
        return
      }
      const key = event.key.toLowerCase()
      const lane = keyToLaneRef.current[key]
      if (lane === undefined || event.repeat) return

      engineRef.current?.handleButtonDown(lane)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const lane = keyToLaneRef.current[key]
      if (lane === undefined) return
      engineRef.current?.handleButtonUp(lane)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      // No destruimos el engine aquí ya que puede ser solo un toggle the pausa
      // o un efecto reseteado por dependencias menores
      // pero si el song cambia ok, el dep. array de hooks reacciona
    }
  }, [
    song, 
    gameState, 
    onGameEnd, 
    onPauseToggle, 
    onStatsChange, 
    getAudioTime, 
    calibrationOffset
  ])

  // Cleanup absoluto al desmontar el componente (seguro)
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  return {
    canvasRef,
    canvasWidth: GAME_CONFIG.canvasWidth,
    canvasHeight: GAME_CONFIG.canvasHeight,
    isGamepadConnected,
    gamepadName,
  }
}
