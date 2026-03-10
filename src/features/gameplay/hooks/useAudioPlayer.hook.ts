import { useState, useCallback, useRef, useEffect } from 'react'
import { AudioEngine } from '../services/AudioEngine'
import type { AudioState } from '../services/AudioEngine'

/** Re-exportamos los tipos por compatibilidad */
export type { AudioState }

/**
 * Hook para manejar audio con Web Audio API.
 * 
 * Envanece la complejidad delegando en AudioEngine (vanilla TS).
 * Evita ciclos de re-render al usar useRef para las primitivas no mostradas, 
 * pero avisa a React de los cambios visuales importantes (isLoaded, etc).
 */
export const useAudioPlayer = () => {
  const engineRef = useRef<AudioEngine | null>(null)

  const getEngine = useCallback((): AudioEngine => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine()
    }
    return engineRef.current
  }, [])

  const [state, setState] = useState<AudioState>(() => getEngine().getState())

  // Sincronizar callbacks del engine
  useEffect(() => {
    const engine = getEngine()
    engine.onStateChange = (newState) => {
      setState(newState)
    }
    return () => {
      engine.onStateChange = undefined
    }
  }, [getEngine])

  // Limpiar context si se demonta sin haber sido limpiado
  useEffect(() => {
    return () => {
      engineRef.current?.cleanup()
    }
  }, [])

  return {
    // Estado
    isLoaded: state.isLoaded,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    duration: state.duration,
    error: state.error,
    stemsLoaded: state.stemsLoaded,

    // Funciones wrappers
    loadAudioFile: useCallback((file: File) => getEngine().loadAudioFile(file), [getEngine]),
    loadAudioStems: useCallback((files: File[]) => getEngine().loadAudioStems(files), [getEngine]),
    loadAudioFromUrl: useCallback((url: string) => getEngine().loadAudioFromUrl(url), [getEngine]),
    loadStemsFromUrls: useCallback((urls: string[]) => getEngine().loadStemsFromUrls(urls), [getEngine]),
    play: useCallback((fromTime = 0) => getEngine().play(fromTime), [getEngine]),
    pause: useCallback(() => getEngine().pause(), [getEngine]),
    resume: useCallback(() => getEngine().resume(), [getEngine]),
    stop: useCallback(() => getEngine().stop(), [getEngine]),
    getCurrentTime: useCallback(() => getEngine().getCurrentTime(), [getEngine]),
    setCalibrationOffset: useCallback((offsetMs: number) => getEngine().setCalibrationOffset(offsetMs), [getEngine]),
    getCalibrationOffset: useCallback(() => getEngine().getCalibrationOffset(), [getEngine]),
    setVolume: useCallback((v: number) => getEngine().setVolume(v), [getEngine]),
    cleanup: useCallback(() => getEngine().cleanup(), [getEngine]),
    unlock: useCallback(() => getEngine().unlock(), [getEngine]),
  }
}

