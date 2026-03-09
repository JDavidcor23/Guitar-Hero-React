import { useCallback } from 'react'
import type { GameStats, SongData } from '../types/GuitarGame.types'

interface UseGameScoringParams {
  song: SongData | null
  hasActiveUser: boolean
  addScore: (scoreData: any) => void
}

export const useGameScoring = ({ song, hasActiveUser, addScore }: UseGameScoringParams) => {
  const calculateAccuracy = useCallback((stats: GameStats): number => {
    const totalHits = stats.perfects + stats.goods + stats.oks
    const totalNotes = totalHits + stats.misses
    if (totalNotes === 0) return 0
    return Math.round((totalHits / totalNotes) * 100)
  }, [])

  const getRank = useCallback((accuracy: number): string => {
    if (accuracy >= 95) return 'S'
    if (accuracy >= 90) return 'A'
    if (accuracy >= 80) return 'B'
    if (accuracy >= 70) return 'C'
    if (accuracy >= 60) return 'D'
    return 'F'
  }, [])

  const handleSaveScore = useCallback(
    (stats: GameStats) => {
      if (!song || !hasActiveUser) return
      const accuracy = calculateAccuracy(stats)
      addScore({
        songId: song.metadata.songName.toLowerCase().replace(/\s+/g, '_'),
        songName: song.metadata.songName,
        artist: song.metadata.artist,
        score: stats.score,
        accuracy,
        rank: getRank(accuracy),
        maxCombo: stats.maxCombo,
        difficulty: song.metadata.difficulty || 'unknown',
      })
    },
    [song, hasActiveUser, calculateAccuracy, getRank, addScore]
  )

  return { calculateAccuracy, getRank, handleSaveScore }
}
