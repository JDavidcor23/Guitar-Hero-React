import { useState, useEffect } from 'react'
import { useGamepadNavigation } from '../../../hooks/useGamepadNavigation'
import type { SongData } from '../../gameplay/types/GuitarGame.types'
import type { InstrumentInfo } from './useSongLoader.hook'

interface UseSongConfigOptions {
  song: SongData
  availableDifficulties: string[]
  availableInstruments: InstrumentInfo[]
  currentInstrument: string
  canStartGame: boolean
  onDifficultyChange: (difficulty: string) => void
  onInstrumentChange?: (trackName: string) => void
  onStartGame: () => void
  isFocused?: boolean
  onFocusUp?: () => void
}

export const useSongConfig = ({
  song,
  availableDifficulties,
  availableInstruments,
  currentInstrument,
  canStartGame,
  onDifficultyChange,
  onInstrumentChange,
  onStartGame,
  isFocused = false,
  onFocusUp,
}: UseSongConfigOptions) => {
  const hasInstruments = availableInstruments.length > 0 && onInstrumentChange !== undefined
  const hasDifficulties = availableDifficulties.length > 1
  
  const getAvailableRows = () => {
    const r = []
    if (hasInstruments) r.push(0)
    if (hasDifficulties) r.push(1)
    r.push(2)
    return r
  }
  const rows = getAvailableRows()

  const [focusedRow, setFocusedRow] = useState(rows[0])

  useEffect(() => {
    if (!rows.includes(focusedRow)) {
      setFocusedRow(rows[0])
    }
  }, [hasInstruments, hasDifficulties, focusedRow])

  const handleUp = () => {
    const currentIndex = rows.indexOf(focusedRow)
    if (currentIndex > 0) {
      setFocusedRow(rows[currentIndex - 1])
    } else if (currentIndex === 0) {
      onFocusUp?.()
    }
  }

  const handleDown = () => {
    const currentIndex = rows.indexOf(focusedRow)
    if (currentIndex < rows.length - 1) {
      setFocusedRow(rows[currentIndex + 1])
    }
  }

  const handleLeft = () => {
    if (focusedRow === 0 && hasInstruments && onInstrumentChange) {
      const idx = availableInstruments.findIndex(i => i.trackName === currentInstrument)
      if (idx > 0) onInstrumentChange(availableInstruments[idx - 1].trackName)
    } else if (focusedRow === 1 && hasDifficulties) {
      const diffStr = song.metadata.difficulty?.toLowerCase()
      const idx = availableDifficulties.findIndex(d => d === diffStr)
      if (idx > 0) onDifficultyChange(availableDifficulties[idx - 1])
    }
  }

  const handleRight = () => {
    if (focusedRow === 0 && hasInstruments && onInstrumentChange) {
      const idx = availableInstruments.findIndex(i => i.trackName === currentInstrument)
      if (idx >= 0 && idx < availableInstruments.length - 1) onInstrumentChange(availableInstruments[idx + 1].trackName)
    } else if (focusedRow === 1 && hasDifficulties) {
      const diffStr = song.metadata.difficulty?.toLowerCase()
      const idx = availableDifficulties.findIndex(d => d === diffStr)
      if (idx >= 0 && idx < availableDifficulties.length - 1) onDifficultyChange(availableDifficulties[idx + 1])
    }
  }

  const handleConfirm = () => {
    if (focusedRow === 2 && canStartGame) {
      onStartGame()
    }
  }

  useGamepadNavigation({
    enabled: isFocused,
    onUp: handleUp,
    onDown: handleDown,
    onLeft: handleLeft,
    onRight: handleRight,
    onConfirm: handleConfirm,
    onCancel: () => onFocusUp?.()
  })

  return {
    focusedRow,
  }
}
