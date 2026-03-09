import { useEffect, useRef, useState } from 'react'
import { useGamepadNavigation } from '../../../hooks/useGamepadNavigation'
import type { GameStats } from '../../gameplay/types/GuitarGame.types'

interface UseGameResultsOptions {
  stats: GameStats
  onPlayAgain: () => void
  onBackToMenu: () => void
  onSaveScore?: (stats: GameStats) => void
}

export const useGameResults = ({
  stats,
  onPlayAgain,
  onBackToMenu,
  onSaveScore,
}: UseGameResultsOptions) => {
  const scoreSavedRef = useRef(false)
  const [focusedIndex, setFocusedIndex] = useState(0)

  useEffect(() => {
    if (onSaveScore && !scoreSavedRef.current) {
      scoreSavedRef.current = true
      onSaveScore(stats)
    }
  }, [onSaveScore, stats])

  const calculateAccuracy = (): number => {
    const totalHits = stats.perfects + stats.goods + stats.oks
    const totalNotes = totalHits + stats.misses
    if (totalNotes === 0) return 0
    return Math.round((totalHits / totalNotes) * 100)
  }

  const getRank = (accuracy: number): { letter: string; color: string } => {
    if (accuracy >= 95) return { letter: 'S', color: '#FFD700' }
    if (accuracy >= 90) return { letter: 'A', color: '#00ff88' }
    if (accuracy >= 80) return { letter: 'B', color: '#88ff00' }
    if (accuracy >= 70) return { letter: 'C', color: '#ffcc00' }
    if (accuracy >= 60) return { letter: 'D', color: '#ff8844' }
    return { letter: 'F', color: '#ff4466' }
  }

  const accuracy = calculateAccuracy()
  const rank = getRank(accuracy)
  const hasSustains = stats.sustainsHit > 0 || stats.sustainsComplete > 0 || stats.sustainsDropped > 0

  const isProfileMenuOpen = () => document.querySelector('.profile-selector__dropdown') !== null

  useGamepadNavigation({
    enabled: true,
    onLeft: () => !isProfileMenuOpen() && setFocusedIndex(0),
    onRight: () => !isProfileMenuOpen() && setFocusedIndex(1),
    onConfirm: () => {
      if (isProfileMenuOpen()) return
      if (focusedIndex === 0) onPlayAgain()
      else if (focusedIndex === 1) onBackToMenu()
    }
  })

  return {
    accuracy,
    rank,
    hasSustains,
    focusedIndex
  }
}
