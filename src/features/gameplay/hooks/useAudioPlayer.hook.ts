import { useState, useCallback, useRef } from 'react'

// ==========================================
// TIPOS
// ==========================================

interface AudioState {
  /** Indica si hay audio cargado */
  isLoaded: boolean
  /** Indica si está reproduciendo */
  isPlaying: boolean
  /** Indica si está cargando */
  isLoading: boolean
  /** Duración del audio en segundos */
  duration: number
  /** Error al cargar (null si no hay error) */
  error: string | null
  /** Número de stems cargados */
  stemsLoaded: number
}

interface AudioStem {
  name: string
  buffer: AudioBuffer
}

/**
 * Hook para manejar audio con Web Audio API
 * Soporta múltiples stems (pistas de audio) que se mezclan automáticamente
 *
 * Web Audio API es más preciso que el elemento <audio> HTML
 * porque usa el reloj del sistema de audio, no el de JavaScript.
 */
export const useAudioPlayer = () => {
  // ==========================================
  // ESTADO
  // ==========================================

  const [state, setState] = useState<AudioState>({
    isLoaded: false,
    isPlaying: false,
    isLoading: false,
    duration: 0,
    error: null,
    stemsLoaded: 0,
  })

  // ==========================================
  // REFS (no causan re-render)
  // ==========================================

  /** AudioContext: El "motor" de audio del navegador */
  const audioContextRef = useRef<AudioContext | null>(null)

  /** Array de stems de audio cargados */
  const stemsRef = useRef<AudioStem[]>([])

  /** Array de source nodes activos (uno por stem) */
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([])

  /** GainNode para control de volumen master */
  const masterGainRef = useRef<GainNode | null>(null)

  /** Tiempo en que empezó a reproducir (audioContext.currentTime) */
  const startTimeRef = useRef<number>(0)

  /** Tiempo pausado (en segundos de la canción) */
  const pausedAtRef = useRef<number>(0)

  /** Offset de calibración en milisegundos */
  const calibrationOffsetRef = useRef<number>(0)

  /** Ref para rastrear si está reproduciendo (para getCurrentTime sin depender de state) */
  const isPlayingRef = useRef<boolean>(false)


  // ==========================================
  // FUNCIONES
  // ==========================================

  /**
   * Obtiene o crea el AudioContext
   */
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContextRef.current = new AudioContextClass()

      // Crear master gain node
      masterGainRef.current = audioContextRef.current.createGain()
      masterGainRef.current.connect(audioContextRef.current.destination)
    }
    return audioContextRef.current
  }, [])

  /**
   * Carga un único archivo de audio
   */
  const loadAudioFile = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, error: null, isLoaded: false, isLoading: true }))

        const audioContext = getAudioContext()
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Guardar como único stem
        stemsRef.current = [{ name: file.name, buffer: audioBuffer }]

        setState({
          isLoaded: true,
          isPlaying: false,
          isLoading: false,
          duration: audioBuffer.duration,
          error: null,
          stemsLoaded: 1,
        })

        console.log(`✓ Audio cargado: ${audioBuffer.duration.toFixed(2)}s (${file.name})`)
        return true
      } catch (err) {
        let errorMessage = 'Error al cargar el audio'

        if (err instanceof Error) {
          if (err.message.includes('decodeAudioData') || err.name === 'EncodingError') {
            errorMessage = `Formato de audio no soportado. Intenta convertir ${file.name} a MP3 o OGG`
          } else {
            errorMessage = err.message
          }
        }

        setState((prev) => ({
          ...prev,
          isLoaded: false,
          isLoading: false,
          error: errorMessage,
        }))
        console.error('Error cargando audio:', err)
        return false
      }
    },
    [getAudioContext]
  )

  /**
   * Carga un único archivo de audio desde una URL
   */
  const loadAudioFromUrl = useCallback(
    async (url: string): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, error: null, isLoaded: false, isLoading: true }))

        const audioContext = getAudioContext()
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Guardar como único stem
        const name = url.split('/').pop() || 'audio'
        stemsRef.current = [{ name, buffer: audioBuffer }]

        setState({
          isLoaded: true,
          isPlaying: false,
          isLoading: false,
          duration: audioBuffer.duration,
          error: null,
          stemsLoaded: 1,
        })

        console.log(`✓ Audio cargado desde URL: ${audioBuffer.duration.toFixed(2)}s (${name})`)
        return true
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoaded: false,
          isLoading: false,
          error: `Error al cargar el audio desde URL: ${err instanceof Error ? err.message : 'Error desconocido'}`,
        }))
        console.error('Error cargando audio desde URL:', err)
        return false
      }
    },
    [getAudioContext]
  )

  /**
   * Carga múltiples archivos de audio (stems) desde URLs y los mezcla
   */
  const loadStemsFromUrls = useCallback(
    async (urls: string[]): Promise<boolean> => {
      if (urls.length === 0) return false

      try {
        setState((prev) => ({
          ...prev,
          error: null,
          isLoaded: false,
          isLoading: true,
          stemsLoaded: 0,
        }))

        const audioContext = getAudioContext()
        const stems: AudioStem[] = []
        let maxDuration = 0
        let loadedCount = 0

        // Cargar todos los stems en paralelo
        const loadPromises = urls.map(async (url) => {
          try {
            const response = await fetch(url)
            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            const name = url.split('/').pop() || 'stem'
            stems.push({ name, buffer: audioBuffer })
            maxDuration = Math.max(maxDuration, audioBuffer.duration)
            loadedCount++

            setState((prev) => ({ ...prev, stemsLoaded: loadedCount }))
            console.log(`✓ Stem cargado desde URL: ${name} (${audioBuffer.duration.toFixed(2)}s)`)
          } catch (err) {
            console.warn(`⚠ No se pudo cargar stem desde URL: ${url}`, err)
          }
        })

        await Promise.all(loadPromises)

        if (stems.length === 0) {
          throw new Error('No se pudo cargar ningún archivo de audio desde las URLs proporcionadas')
        }

        stemsRef.current = stems

        setState({
          isLoaded: true,
          isPlaying: false,
          isLoading: false,
          duration: maxDuration,
          error: null,
          stemsLoaded: stems.length,
        })

        console.log(`✓ ${stems.length} stems cargados desde URLs. Duración total: ${maxDuration.toFixed(2)}s`)
        return true
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoaded: false,
          isLoading: false,
          error: `Error al cargar los stems desde URLs: ${err instanceof Error ? err.message : 'Error desconocido'}`,
        }))
        console.error('Error cargando stems desde URLs:', err)
        return false
      }
    },
    [getAudioContext]
  )

  /**
   * Carga múltiples archivos de audio (stems) y los mezcla
   */
  const loadAudioStems = useCallback(
    async (files: File[]): Promise<boolean> => {
      if (files.length === 0) return false

      try {
        setState((prev) => ({
          ...prev,
          error: null,
          isLoaded: false,
          isLoading: true,
          stemsLoaded: 0,
        }))

        const audioContext = getAudioContext()
        const stems: AudioStem[] = []
        let maxDuration = 0
        let loadedCount = 0

        // Cargar todos los stems en paralelo
        const loadPromises = files.map(async (file) => {
          try {
            const arrayBuffer = await file.arrayBuffer()
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

            stems.push({ name: file.name, buffer: audioBuffer })
            maxDuration = Math.max(maxDuration, audioBuffer.duration)
            loadedCount++

            setState((prev) => ({ ...prev, stemsLoaded: loadedCount }))
            console.log(`✓ Stem cargado: ${file.name} (${audioBuffer.duration.toFixed(2)}s)`)
          } catch (err) {
            console.warn(`⚠ No se pudo cargar stem: ${file.name}`, err)
          }
        })

        await Promise.all(loadPromises)

        if (stems.length === 0) {
          throw new Error('No se pudo cargar ningún archivo de audio')
        }

        stemsRef.current = stems

        setState({
          isLoaded: true,
          isPlaying: false,
          isLoading: false,
          duration: maxDuration,
          error: null,
          stemsLoaded: stems.length,
        })

        console.log(`✓ ${stems.length} stems cargados. Duración total: ${maxDuration.toFixed(2)}s`)
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar los stems'

        setState((prev) => ({
          ...prev,
          isLoaded: false,
          isLoading: false,
          error: errorMessage,
        }))
        console.error('Error cargando stems:', err)
        return false
      }
    },
    [getAudioContext]
  )

  /**
   * Inicia la reproducción de todos los stems simultáneamente
   */
  const play = useCallback((fromTime: number = 0): boolean => {
    const audioContext = audioContextRef.current
    const masterGain = masterGainRef.current
    const stems = stemsRef.current

    if (!audioContext || !masterGain || stems.length === 0) {
      console.error('No hay audio cargado')
      return false
    }

    // Detener reproducción anterior si existe
    stopSources()

    // Crear un source node para cada stem
    const newSourceNodes: AudioBufferSourceNode[] = []

    for (const stem of stems) {
      const sourceNode = audioContext.createBufferSource()
      sourceNode.buffer = stem.buffer
      sourceNode.connect(masterGain)
      newSourceNodes.push(sourceNode)
    }

    sourceNodesRef.current = newSourceNodes

    // Guardar tiempo de inicio
    startTimeRef.current = audioContext.currentTime

    // Iniciar todos los stems simultáneamente
    for (const sourceNode of newSourceNodes) {
      sourceNode.start(0, fromTime)
    }

    setState((prev) => ({ ...prev, isPlaying: true }))
    isPlayingRef.current = true
    pausedAtRef.current = fromTime

    console.log(`Reproduciendo ${stems.length} stems desde: ${fromTime.toFixed(2)}s`)
    return true
  }, [])

  /**
   * Detiene los source nodes actuales
   */
  const stopSources = useCallback((): void => {
    for (const sourceNode of sourceNodesRef.current) {
      try {
        sourceNode.stop()
      } catch {
        // Ignorar error si ya estaba detenido
      }
    }
    sourceNodesRef.current = []
  }, [])

  /**
   * Pausa la reproducción
   */
  const pause = useCallback(async (): Promise<void> => {
    const audioContext = audioContextRef.current
    if (!audioContext || !state.isPlaying) return

    pausedAtRef.current = getCurrentTime()
    await audioContext.suspend()

    setState((prev) => ({ ...prev, isPlaying: false }))
    isPlayingRef.current = false
    console.log(`Pausado en: ${pausedAtRef.current.toFixed(2)}s`)
  }, [state.isPlaying])

  /**
   * Reanuda la reproducción desde donde se pausó
   */
  const resume = useCallback(async (): Promise<void> => {
    const audioContext = audioContextRef.current
    if (!audioContext || state.isPlaying) return

    await audioContext.resume()
    startTimeRef.current = audioContext.currentTime - pausedAtRef.current

    setState((prev) => ({ ...prev, isPlaying: true }))
    isPlayingRef.current = true
    console.log(`Reanudado desde: ${pausedAtRef.current.toFixed(2)}s`)
  }, [state.isPlaying])

  /**
   * Detiene completamente la reproducción
   */
  const stop = useCallback((): void => {
    stopSources()
    pausedAtRef.current = 0
    startTimeRef.current = 0
    setState((prev) => ({ ...prev, isPlaying: false }))
    isPlayingRef.current = false
  }, [stopSources])

  const getCurrentTime = useCallback((): number => {
    const audioContext = audioContextRef.current
    if (!audioContext) return 0

    // Usar ref en lugar de state para evitar problemas de closures estancados
    if (!isPlayingRef.current) {
      return pausedAtRef.current
    }

    const elapsed = audioContext.currentTime - startTimeRef.current
    const offset = calibrationOffsetRef.current / 1000
    return elapsed + offset
  }, []) // Sin dependencias - usa refs

  /**
   * Establece el offset de calibración
   */
  const setCalibrationOffset = useCallback((offsetMs: number): void => {
    calibrationOffsetRef.current = offsetMs
    console.log(`Offset de calibración: ${offsetMs}ms`)
  }, [])

  /**
   * Obtiene el offset de calibración actual
   */
  const getCalibrationOffset = useCallback((): number => {
    return calibrationOffsetRef.current
  }, [])

  /**
   * Establece el volumen master (0.0 a 1.0)
   */
  const setVolume = useCallback((volume: number): void => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = Math.max(0, Math.min(1, volume))
    }
  }, [])

  /**
   * Limpia todos los recursos
   */
  const cleanup = useCallback((): void => {
    stop()
    stemsRef.current = []

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    masterGainRef.current = null

    setState({
      isLoaded: false,
      isPlaying: false,
      isLoading: false,
      duration: 0,
      error: null,
      stemsLoaded: 0,
    })
  }, [stop])

  // ==========================================
  // RETORNO
  // ==========================================

  return {
    // Estado
    isLoaded: state.isLoaded,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    duration: state.duration,
    error: state.error,
    stemsLoaded: state.stemsLoaded,

    // Funciones
    loadAudioFile,
    loadAudioStems,
    loadAudioFromUrl,
    loadStemsFromUrls,
    play,
    pause,
    resume,
    stop,
    getCurrentTime,
    setCalibrationOffset,
    getCalibrationOffset,
    setVolume,
    cleanup,
  }
}
