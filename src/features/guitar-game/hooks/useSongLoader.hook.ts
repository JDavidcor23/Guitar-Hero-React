import { useState, useCallback, useRef } from 'react'
import type { SongData, SongMetadata } from '../types/GuitarGame.types'
import { ChartParser } from '../utils/chartParser'
import { MidiParser, parseSongIni } from '../utils/midiParser'

/**
 * Interfaz común para los parsers
 */
interface ParserInterface {
  getAvailableDifficulties(): string[]
  convertToSongData(difficulty: string, metadata?: Partial<SongMetadata>): SongData | null
}

/**
 * Hook para cargar canciones desde archivos .chart o .mid
 */
export const useSongLoader = () => {
  const [song, setSong] = useState<SongData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([])

  // Usar ref para el parser para evitar re-renders
  const parserRef = useRef<ParserInterface | null>(null)
  const metadataRef = useRef<Partial<SongMetadata>>({})

  /**
   * Carga un archivo .chart
   */
  const loadChartFile = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string

          // Parsear archivo .chart
          const parser = new ChartParser()
          parser.parse(content)

          // Guardar parser y dificultades disponibles
          parserRef.current = parser
          const difficulties = parser.getAvailableDifficulties()
          setAvailableDifficulties(difficulties)

          if (difficulties.length === 0) {
            reject(new Error('No se encontraron notas en el archivo .chart'))
          } else {
            // Por defecto, cargar la dificultad más difícil disponible
            const defaultDifficulty = difficulties[difficulties.length - 1]
            const songData = parser.convertToSongData(defaultDifficulty)

            if (songData) {
              setSong(songData)
              resolve()
            } else {
              reject(new Error('Error al convertir las notas'))
            }
          }
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsText(file)
    })
  }, [])

  /**
   * Carga un archivo .mid (MIDI)
   */
  const loadMidiFile = useCallback(
    (file: File, metadata?: Partial<SongMetadata>): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer

            // Parsear archivo MIDI
            const parser = new MidiParser(arrayBuffer)
            parser.parse()

            // Guardar parser y metadata
            parserRef.current = parser
            metadataRef.current = metadata || {}

            // Obtener dificultades disponibles
            const difficulties = parser.getAvailableDifficulties()
            setAvailableDifficulties(difficulties)

            if (difficulties.length === 0) {
              reject(new Error('No se encontraron notas de guitarra en el archivo MIDI'))
            } else {
              // Por defecto, cargar la dificultad más difícil disponible
              const defaultDifficulty = difficulties[difficulties.length - 1]
              const songData = parser.convertToSongData(defaultDifficulty, metadata)

              if (songData) {
                setSong(songData)
                resolve()
              } else {
                reject(new Error('Error al convertir las notas MIDI'))
              }
            }
          } catch (err) {
            reject(err)
          }
        }

        reader.onerror = () => reject(new Error('Error al leer el archivo MIDI'))
        reader.readAsArrayBuffer(file)
      })
    },
    []
  )

  /**
   * Carga un archivo de canción (detecta el tipo automáticamente)
   */
  const loadFromFile = useCallback(
    async (file: File, iniFile?: File) => {
      setIsLoading(true)
      setError(null)

      try {
        // Parsear song.ini si se proporciona
        let metadata: Partial<SongMetadata> = {}
        if (iniFile) {
          const iniContent = await iniFile.text()
          metadata = parseSongIni(iniContent)
        }

        const extension = file.name.toLowerCase().split('.').pop()

        if (extension === 'chart' || extension === 'txt') {
          await loadChartFile(file)
        } else if (extension === 'mid' || extension === 'midi') {
          await loadMidiFile(file, metadata)
        } else {
          throw new Error(`Formato no soportado: .${extension}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        console.error('Error cargando archivo:', err)
        setSong(null)
      } finally {
        setIsLoading(false)
      }
    },
    [loadChartFile, loadMidiFile]
  )

  /**
   * Carga una carpeta de canción (busca notes.mid/notes.chart y song.ini)
   */
  const loadFromFolder = useCallback(
    async (files: FileList) => {
      setIsLoading(true)
      setError(null)

      try {
        // Buscar archivos relevantes
        let chartFile: File | null = null
        let iniFile: File | null = null

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const name = file.name.toLowerCase()

          if (name === 'notes.mid' || name === 'notes.midi') {
            chartFile = file
          } else if (name === 'notes.chart') {
            // Preferir .chart sobre .mid si ambos existen
            chartFile = file
          } else if (name === 'song.ini') {
            iniFile = file
          }
        }

        if (!chartFile) {
          throw new Error('No se encontró notes.mid o notes.chart en la carpeta')
        }

        // Parsear song.ini si existe
        let metadata: Partial<SongMetadata> = {}
        if (iniFile) {
          const iniContent = await iniFile.text()
          metadata = parseSongIni(iniContent)
        }

        const extension = chartFile.name.toLowerCase().split('.').pop()

        if (extension === 'chart') {
          await loadChartFile(chartFile)
        } else {
          await loadMidiFile(chartFile, metadata)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        console.error('Error cargando carpeta:', err)
        setSong(null)
      } finally {
        setIsLoading(false)
      }
    },
    [loadChartFile, loadMidiFile]
  )

  /**
   * Cambia la dificultad de la canción actual
   */
  const changeDifficulty = useCallback((difficulty: string) => {
    if (!parserRef.current) {
      setError('No hay canción cargada')
      return
    }

    const songData = parserRef.current.convertToSongData(difficulty, metadataRef.current)
    if (songData) {
      setSong(songData)
      setError(null)
    } else {
      setError('Error al cargar dificultad')
    }
  }, [])

  /**
   * Limpia la canción actual
   */
  const clearSong = useCallback(() => {
    setSong(null)
    setError(null)
    parserRef.current = null
    metadataRef.current = {}
    setAvailableDifficulties([])
  }, [])

  return {
    song,
    error,
    isLoading,
    availableDifficulties,
    loadFromFile,
    loadFromFolder,
    changeDifficulty,
    clearSong,
  }
}
