import { useState, useCallback, useRef } from 'react'

// ==========================================
// TIPOS
// ==========================================

interface AudioState {
  /** Indica si hay un audio cargado */
  isLoaded: boolean
  /** Indica si está reproduciendo */
  isPlaying: boolean
  /** Duración del audio en segundos */
  duration: number
  /** Error al cargar (null si no hay error) */
  error: string | null
}

/**
 * Hook para manejar audio con Web Audio API
 *
 * Web Audio API es más preciso que el elemento <audio> HTML
 * porque usa el reloj del sistema de audio, no el de JavaScript.
 *
 * Esto es CRÍTICO para sincronizar las notas con la música.
 */
export const useAudioPlayer = () => {
  // ==========================================
  // ESTADO
  // ==========================================

  const [state, setState] = useState<AudioState>({
    isLoaded: false,
    isPlaying: false,
    duration: 0,
    error: null,
  })

  // ==========================================
  // REFS (no causan re-render)
  // ==========================================

  /**
   * AudioContext: El "motor" de audio del navegador
   * Solo necesitamos uno para toda la app
   */
  const audioContextRef = useRef<AudioContext | null>(null)

  /**
   * AudioBuffer: Los datos de audio decodificados
   * Se carga una vez y se puede reutilizar
   */
  const audioBufferRef = useRef<AudioBuffer | null>(null)

  /**
   * AudioBufferSourceNode: La "fuente" que reproduce el audio
   * Se crea cada vez que queremos reproducir
   */
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)

  /**
   * Tiempo en que empezó a reproducir (audioContext.currentTime)
   * Usado para calcular cuánto tiempo ha pasado
   */
  const startTimeRef = useRef<number>(0)

  /**
   * Tiempo pausado (en segundos de la canción)
   * Cuando reanudamos, empezamos desde aquí
   */
  const pausedAtRef = useRef<number>(0)

  /**
   * Offset de calibración en milisegundos
   * Positivo = notas aparecen antes, Negativo = notas aparecen después
   */
  const calibrationOffsetRef = useRef<number>(0)

  // ==========================================
  // FUNCIONES
  // ==========================================

  /**
   * Obtiene o crea el AudioContext
   * Debe llamarse después de una interacción del usuario (click)
   * debido a las políticas de autoplay de los navegadores
   */
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      // Crear nuevo AudioContext
      // webkitAudioContext es para Safari antiguo
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioContextRef.current = new AudioContextClass()
    }
    return audioContextRef.current
  }, [])

  /**
   * Carga un archivo de audio desde un File
   */
  const loadAudioFile = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, error: null, isLoaded: false }))

        // Obtener/crear AudioContext
        const audioContext = getAudioContext()

        // Leer el archivo como ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()

        // Decodificar los datos de audio
        // Esto convierte el MP3/WAV/OGG a datos que el navegador puede reproducir
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Guardar el buffer
        audioBufferRef.current = audioBuffer

        // Actualizar estado
        setState({
          isLoaded: true,
          isPlaying: false,
          duration: audioBuffer.duration,
          error: null,
        })

        console.log(`Audio cargado: ${audioBuffer.duration.toFixed(2)} segundos`)
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar el audio'
        setState((prev) => ({
          ...prev,
          isLoaded: false,
          error: errorMessage,
        }))
        console.error('Error cargando audio:', err)
        return false
      }
    },
    [getAudioContext]
  )

  /**
   * Inicia la reproducción del audio
   * @param fromTime - Tiempo en segundos desde donde empezar (default: 0)
   */
  const play = useCallback(
    (fromTime: number = 0): boolean => {
      const audioContext = audioContextRef.current
      const audioBuffer = audioBufferRef.current

      if (!audioContext || !audioBuffer) {
        console.error('No hay audio cargado')
        return false
      }

      // Detener reproducción anterior si existe
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop()
        } catch {
          // Ignorar error si ya estaba detenido
        }
      }

      // Crear nuevo source node
      // IMPORTANTE: Un source node solo puede usarse UNA vez
      // Por eso creamos uno nuevo cada vez que reproducimos
      const sourceNode = audioContext.createBufferSource()
      sourceNode.buffer = audioBuffer
      sourceNode.connect(audioContext.destination)

      // Guardar referencia
      sourceNodeRef.current = sourceNode

      // Guardar tiempo de inicio
      // audioContext.currentTime es el reloj preciso del sistema de audio
      startTimeRef.current = audioContext.currentTime

      // Empezar a reproducir desde el tiempo indicado
      sourceNode.start(0, fromTime)

      // Actualizar estado
      setState((prev) => ({ ...prev, isPlaying: true }))
      pausedAtRef.current = fromTime

      console.log(`Reproduciendo desde: ${fromTime.toFixed(2)}s`)
      return true
    },
    []
  )

  /**
   * Pausa la reproducción
   * Usa audioContext.suspend() para pausar todo el motor de audio
   */
  const pause = useCallback(async (): Promise<void> => {
    const audioContext = audioContextRef.current
    if (!audioContext || !state.isPlaying) return

    // Guardar el tiempo actual antes de pausar
    pausedAtRef.current = getCurrentTime()

    // Suspender el AudioContext (pausa todo el audio)
    await audioContext.suspend()

    setState((prev) => ({ ...prev, isPlaying: false }))
    console.log(`Pausado en: ${pausedAtRef.current.toFixed(2)}s`)
  }, [state.isPlaying])

  /**
   * Reanuda la reproducción desde donde se pausó
   */
  const resume = useCallback(async (): Promise<void> => {
    const audioContext = audioContextRef.current
    if (!audioContext || state.isPlaying) return

    // Reanudar el AudioContext
    await audioContext.resume()

    // Ajustar el startTime para que getCurrentTime() devuelva el valor correcto
    startTimeRef.current = audioContext.currentTime - pausedAtRef.current

    setState((prev) => ({ ...prev, isPlaying: true }))
    console.log(`Reanudado desde: ${pausedAtRef.current.toFixed(2)}s`)
  }, [state.isPlaying])

  /**
   * Detiene completamente la reproducción
   */
  const stop = useCallback((): void => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
      } catch {
        // Ignorar error si ya estaba detenido
      }
      sourceNodeRef.current = null
    }

    pausedAtRef.current = 0
    startTimeRef.current = 0

    setState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  /**
   * Obtiene el tiempo actual de reproducción en segundos
   * Esta es la función MÁS IMPORTANTE para la sincronización
   *
   * Usa audioContext.currentTime que es súper preciso
   */
  const getCurrentTime = useCallback((): number => {
    const audioContext = audioContextRef.current
    if (!audioContext) return 0

    if (!state.isPlaying) {
      // Si está pausado, devolver el tiempo donde se pausó
      return pausedAtRef.current
    }

    // Calcular tiempo transcurrido desde que empezamos
    const elapsed = audioContext.currentTime - startTimeRef.current

    // Aplicar offset de calibración
    const offset = calibrationOffsetRef.current / 1000 // convertir ms a segundos
    return elapsed + offset
  }, [state.isPlaying])

  /**
   * Establece el offset de calibración
   * @param offsetMs - Offset en milisegundos
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
   * Limpia todos los recursos
   */
  const cleanup = useCallback((): void => {
    stop()
    audioBufferRef.current = null

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setState({
      isLoaded: false,
      isPlaying: false,
      duration: 0,
      error: null,
    })
  }, [stop])

  // ==========================================
  // RETORNO
  // ==========================================

  return {
    // Estado
    isLoaded: state.isLoaded,
    isPlaying: state.isPlaying,
    duration: state.duration,
    error: state.error,

    // Funciones
    loadAudioFile,
    play,
    pause,
    resume,
    stop,
    getCurrentTime,
    setCalibrationOffset,
    getCalibrationOffset,
    cleanup,
  }
}
