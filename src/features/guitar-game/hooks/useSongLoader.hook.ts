import { useState, useCallback } from 'react'
import type { SongData, SongNote } from '../types/GuitarGame.types'

// ==========================================
// CANCIÓN DE PRUEBA EMBEBIDA
// ==========================================

/**
 * Canción de prueba con 25 notas distribuidas en 30 segundos
 * Útil para probar el juego sin tener que cargar un archivo JSON
 *
 * Las notas están distribuidas así:
 * - Primeros 10 segundos: notas simples (1 por vez)
 * - Segundos 10-20: notas más rápidas
 * - Segundos 20-30: algunas notas dobles (2 al mismo tiempo)
 */
const TEST_SONG: SongData = {
  metadata: {
    songName: 'Canción de Prueba',
    artist: 'Test Artist',
    duration: 30, // 30 segundos
    totalNotes: 25,
    difficulty: 'medium',
  },
  notes: [
    // Primeros 10 segundos - notas simples para calentar
    { segundo: 2.0, carril: 2 }, // Amarillo
    { segundo: 3.5, carril: 0 }, // Verde
    { segundo: 5.0, carril: 4 }, // Naranja
    { segundo: 6.5, carril: 1 }, // Rojo
    { segundo: 8.0, carril: 3 }, // Azul

    // Segundos 10-15 - un poco más rápido
    { segundo: 10.0, carril: 0 }, // Verde
    { segundo: 11.0, carril: 1 }, // Rojo
    { segundo: 12.0, carril: 2 }, // Amarillo
    { segundo: 13.0, carril: 3 }, // Azul
    { segundo: 14.0, carril: 4 }, // Naranja

    // Segundos 15-20 - patrón de escalera
    { segundo: 15.5, carril: 0 },
    { segundo: 16.0, carril: 1 },
    { segundo: 16.5, carril: 2 },
    { segundo: 17.0, carril: 3 },
    { segundo: 17.5, carril: 4 },

    // Segundos 20-25 - notas dobles (dos al mismo tiempo)
    { segundo: 20.0, carril: 0 }, // Verde + Naranja
    { segundo: 20.0, carril: 4 },
    { segundo: 22.0, carril: 1 }, // Rojo + Azul
    { segundo: 22.0, carril: 3 },
    { segundo: 24.0, carril: 2 }, // Solo amarillo

    // Segundos 25-30 - finale
    { segundo: 26.0, carril: 0 },
    { segundo: 26.5, carril: 2 },
    { segundo: 27.0, carril: 4 },
    { segundo: 28.0, carril: 1 },
    { segundo: 29.0, carril: 3 },
  ],
}

// ==========================================
// HOOK: useSongLoader
// ==========================================

/**
 * Hook para cargar canciones desde archivos JSON
 *
 * Funcionalidades:
 * - Cargar archivo JSON desde input file
 * - Usar canción de prueba embebida
 * - Validar que el JSON tenga la estructura correcta
 */
export const useSongLoader = () => {
  // Estado: la canción actualmente cargada (null si no hay ninguna)
  const [song, setSong] = useState<SongData | null>(null)

  // Estado: mensaje de error si algo falla al cargar
  const [error, setError] = useState<string | null>(null)

  // Estado: indica si está cargando un archivo
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Valida que el JSON tenga la estructura esperada
   * Retorna true si es válido, false si no
   */
  const validateSongData = useCallback((data: unknown): data is SongData => {
    // Verificar que sea un objeto
    if (!data || typeof data !== 'object') {
      setError('El archivo no contiene un objeto JSON válido')
      return false
    }

    const songData = data as Record<string, unknown>

    // Verificar que tenga metadata
    if (!songData.metadata || typeof songData.metadata !== 'object') {
      setError('El JSON no tiene la propiedad "metadata"')
      return false
    }

    const metadata = songData.metadata as Record<string, unknown>

    // Verificar campos obligatorios de metadata
    if (typeof metadata.songName !== 'string') {
      setError('metadata.songName debe ser un string')
      return false
    }
    if (typeof metadata.duration !== 'number') {
      setError('metadata.duration debe ser un número')
      return false
    }
    if (typeof metadata.totalNotes !== 'number') {
      setError('metadata.totalNotes debe ser un número')
      return false
    }

    // Verificar que tenga notas
    if (!Array.isArray(songData.notes)) {
      setError('El JSON no tiene la propiedad "notes" como array')
      return false
    }

    // Verificar cada nota
    for (let i = 0; i < songData.notes.length; i++) {
      const note = songData.notes[i] as Record<string, unknown>
      if (typeof note.segundo !== 'number') {
        setError(`La nota ${i} no tiene "segundo" como número`)
        return false
      }
      if (typeof note.carril !== 'number' || note.carril < 0 || note.carril > 4) {
        setError(`La nota ${i} tiene "carril" inválido (debe ser 0-4)`)
        return false
      }
    }

    return true
  }, [])

  /**
   * Carga una canción desde un archivo JSON
   * Se usa con un input type="file"
   */
  const loadFromFile = useCallback(
    (file: File) => {
      setIsLoading(true)
      setError(null)

      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const data = JSON.parse(content)

          if (validateSongData(data)) {
            // Ordenar notas por tiempo (por si acaso)
            data.notes.sort((a: SongNote, b: SongNote) => a.segundo - b.segundo)
            setSong(data)
          }
        } catch {
          setError('Error al parsear el archivo JSON')
        } finally {
          setIsLoading(false)
        }
      }

      reader.onerror = () => {
        setError('Error al leer el archivo')
        setIsLoading(false)
      }

      reader.readAsText(file)
    },
    [validateSongData]
  )

  /**
   * Carga la canción de prueba embebida
   */
  const loadTestSong = useCallback(() => {
    setError(null)
    setSong(TEST_SONG)
  }, [])

  /**
   * Limpia la canción actual (vuelve al menú)
   */
  const clearSong = useCallback(() => {
    setSong(null)
    setError(null)
  }, [])

  return {
    song, // La canción cargada (o null)
    error, // Mensaje de error (o null)
    isLoading, // true mientras se carga un archivo
    loadFromFile, // Función para cargar desde archivo
    loadTestSong, // Función para cargar canción de prueba
    clearSong, // Función para limpiar
  }
}
