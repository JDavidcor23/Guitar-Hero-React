import { useState, useCallback, useRef } from 'react'
import type { SongData, SongMetadata } from '../../gameplay/types/GuitarGame.types'
import type {
  InstrumentInfo,
  ParserInterface,
  ParseResult,
} from '../services/songParser.service'
import {
  loadFromFileService,
  loadFromFolderService,
  loadFromUrlsService,
} from '../services/songParser.service'

/** Re-export InstrumentInfo para compatibilidad con el resto de la app */
export type { InstrumentInfo }

/**
 * Hook para cargar canciones desde archivos .chart o .mid
 */
export const useSongLoader = () => {
  const [song, setSong] = useState<SongData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([])
  const [availableInstruments, setAvailableInstruments] = useState<InstrumentInfo[]>([])
  const [currentInstrument, setCurrentInstrument] = useState<string>('PART GUITAR')

  // Usar ref para el parser para evitar re-renders
  const parserRef = useRef<ParserInterface | null>(null)
  const metadataRef = useRef<Partial<SongMetadata>>({})

  const applyParseResult = (result: ParseResult) => {
    parserRef.current = result.parser
    metadataRef.current = result.metadata
    setAvailableDifficulties(result.difficulties)
    setAvailableInstruments(result.instruments)
    setCurrentInstrument(result.currentInstrument)
    setSong(result.songData)
    setError(null)
  }

  const loadFromFile = useCallback(async (file: File, iniFile?: File) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await loadFromFileService(file, iniFile)
      applyParseResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSong(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadFromFolder = useCallback(async (files: FileList) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await loadFromFolderService(files)
      applyParseResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSong(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadFromUrls = useCallback(async (chartUrl: string, metadata?: Partial<SongMetadata>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await loadFromUrlsService(chartUrl, metadata)
      applyParseResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSong(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changeDifficulty = useCallback((difficulty: string) => {
    if (!parserRef.current) {
      setError('No hay canción cargada')
      return
    }
    const songData = parserRef.current.convertToSongData(difficulty, metadataRef.current, currentInstrument)
    if (songData) {
      setSong(songData)
      setError(null)
    } else {
      setError('Error al cargar dificultad')
    }
  }, [currentInstrument])

  const changeInstrument = useCallback((trackName: string) => {
    if (!parserRef.current) {
      setError('No hay canción cargada')
      return
    }
    setCurrentInstrument(trackName)
    const difficulties = parserRef.current.getAvailableDifficulties(trackName)
    setAvailableDifficulties(difficulties)

    if (difficulties.length === 0) {
      setError('No hay notas para este instrumento')
      return
    }

    const defaultDifficulty = difficulties[difficulties.length - 1]
    const songData = parserRef.current.convertToSongData(defaultDifficulty, metadataRef.current, trackName)
    if (songData) {
      setSong(songData)
      setError(null)
    } else {
      setError('Error al cargar instrumento')
    }
  }, [])

  const clearSong = useCallback(() => {
    setSong(null)
    setError(null)
    parserRef.current = null
    metadataRef.current = {}
    setAvailableDifficulties([])
    setAvailableInstruments([])
    setCurrentInstrument('PART GUITAR')
  }, [])

  return {
    song,
    error,
    isLoading,
    availableDifficulties,
    availableInstruments,
    currentInstrument,
    loadFromFile,
    loadFromFolder,
    loadFromUrls,
    changeDifficulty,
    changeInstrument,
    clearSong,
    setSong,
  }
}
