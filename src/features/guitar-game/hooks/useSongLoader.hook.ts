import { useState, useCallback } from 'react'
import type { SongData } from '../types/GuitarGame.types'
import { ChartParser } from '../utils/chartParser'

/**
 * Hook para cargar canciones desde archivos .chart
 */
export const useSongLoader = () => {
  const [song, setSong] = useState<SongData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([])
  const [chartParser, setChartParser] = useState<ChartParser | null>(null)

  /**
   * Carga un archivo .chart
   */
  const loadFromFile = useCallback((file: File) => {
    setIsLoading(true)
    setError(null)

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string

        // Parsear archivo .chart
        const parser = new ChartParser()
        parser.parse(content)

        // Guardar parser y dificultades disponibles
        setChartParser(parser)
        const difficulties = parser.getAvailableDifficulties()
        setAvailableDifficulties(difficulties)

        if (difficulties.length === 0) {
          setError('No se encontraron notas en el archivo .chart')
          setSong(null)
        } else {
          // Por defecto, cargar la dificultad más difícil disponible
          const defaultDifficulty = difficulties[difficulties.length - 1]
          const songData = parser.convertToSongData(defaultDifficulty)

          if (songData) {
            setSong(songData)
          } else {
            setError('Error al convertir las notas')
          }
        }
      } catch (err) {
        setError('Error al leer el archivo .chart')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Error al leer el archivo')
      setIsLoading(false)
    }

    reader.readAsText(file)
  }, [])

  /**
   * Cambia la dificultad de la canción actual
   */
  const changeDifficulty = useCallback(
    (difficulty: string) => {
      if (!chartParser) {
        setError('No hay canción cargada')
        return
      }

      const songData = chartParser.convertToSongData(difficulty)
      if (songData) {
        setSong(songData)
        setError(null)
      } else {
        setError('Error al cargar dificultad')
      }
    },
    [chartParser]
  )

  /**
   * Limpia la canción actual
   */
  const clearSong = useCallback(() => {
    setSong(null)
    setError(null)
    setChartParser(null)
    setAvailableDifficulties([])
  }, [])

  return {
    song,
    error,
    isLoading,
    availableDifficulties,
    loadFromFile,
    changeDifficulty,
    clearSong,
  }
}
