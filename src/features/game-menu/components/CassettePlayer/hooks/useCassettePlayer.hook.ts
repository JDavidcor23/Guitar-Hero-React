import { useState, useRef, useEffect, useCallback } from 'react'

/** Number of bars in the waveform visualizer */
const BAR_COUNT = 40

/** Threshold for random bar activation (higher = fewer active) */
const BAR_ACTIVATION_THRESHOLD = 0.35

/** Interval in ms between waveform bar animations */
const BAR_ANIMATION_INTERVAL_MS = 120

/** Max drift in seconds before re-syncing secondary audio tracks */
const AUDIO_SYNC_TOLERANCE = 0.1

/** Base height multiplier for waveform bars */
const BAR_BASE_HEIGHT = 26

/** Extra random height added to lit bars */
const BAR_RANDOM_EXTRA = 6

/** Dim factor for unlit bars */
const BAR_DIM_FACTOR = 0.4

/**
 * Pre-computed bar heights for the waveform visualizer.
 *
 * Each bar gets a deterministic height between 0.15 and 1.0,
 * generated from two overlapping sine waves to create a natural-looking
 * audio waveform pattern (not actual audio data).
 */
export const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  // Two sine waves at different frequencies create a varied, organic pattern
  const wave1 = Math.sin(i * 1.7 + 0.5) * 0.6
  const wave2 = Math.sin(i * 0.9) * 0.4
  const combined = Math.abs(wave1 + wave2)

  // Clamp between 0.15 (minimum visible height) and 1.0 (full height)
  const MIN_BAR_HEIGHT = 0.15
  const MAX_BAR_HEIGHT = 1
  return Math.max(MIN_BAR_HEIGHT, Math.min(MAX_BAR_HEIGHT, combined))
})

/**
 * Format a duration in seconds to "MM:SS" display string.
 *
 * @example formatTime(125) → "02:05"
 */
export const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')
  return `${paddedMinutes}:${paddedSeconds}`
}

interface UseCassettePlayerParams {
  /** Audio source URL(s) — single track or multi-stem */
  audioSrc?: string | string[]
  /** Time offset (in seconds) to start playback from */
  startTime?: number
  /** Callback fired when audio finishes */
  onEnded?: () => void
}

/**
 * Encapsulates all CassettePlayer business logic:
 * - Multi-stem audio playback & sync
 * - Time tracking & progress bar
 * - Waveform bar animation
 * - Toggle expand/collapse
 */
export const useCassettePlayer = ({
  audioSrc,
  startTime = 30,
  onEnded,
}: UseCassettePlayerParams) => {
  const audioRefs = useRef<HTMLAudioElement[]>([])
  const progressRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [activeBars, setActiveBars] = useState<boolean[]>(
    Array(BAR_COUNT).fill(false),
  )

  const sources = audioSrc
    ? Array.isArray(audioSrc) ? audioSrc : [audioSrc]
    : []

  // Keep audioRefs in sync with source count
  useEffect(() => {
    audioRefs.current = audioRefs.current.slice(0, sources.length)
  }, [sources])

  // Animate waveform bars when playing
  useEffect(() => {
    if (!playing) {
      setActiveBars(Array(BAR_COUNT).fill(false))
      return
    }
    const id = setInterval(() => {
      setActiveBars(
        Array.from({ length: BAR_COUNT }, () => Math.random() > BAR_ACTIVATION_THRESHOLD),
      )
    }, BAR_ANIMATION_INTERVAL_MS)
    return () => clearInterval(id)
  }, [playing])

  const togglePlay = useCallback(() => {
    const audios = audioRefs.current.filter(Boolean)
    if (playing) {
      audios.forEach((audio) => audio.pause())
      setPlaying(false)
    } else {
      const mainTime = audios[0]?.currentTime || 0
      Promise.all(
        audios.map((audio) => {
          audio.currentTime = mainTime
          return audio.play()
        }),
      )
        .then(() => setPlaying(true))
        .catch(console.error)
    }
  }, [playing])

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (e.currentTarget === audioRefs.current[0]) {
        setCurrentTime(e.currentTarget.currentTime)
        const mainTime = e.currentTarget.currentTime
        audioRefs.current.forEach((audio, index) => {
          if (index > 0 && Math.abs(audio.currentTime - mainTime) > AUDIO_SYNC_TOLERANCE) {
            audio.currentTime = mainTime
          }
        })
      }
    },
    [],
  )

  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (e.currentTarget === audioRefs.current[0]) {
        setDuration(e.currentTarget.duration)
      }
      if (startTime > 0) {
        e.currentTarget.currentTime = startTime
        if (e.currentTarget === audioRefs.current[0]) {
          setCurrentTime(startTime)
        }
      }
    },
    [startTime],
  )

  const handleEnded = useCallback(() => {
    setPlaying(false)
    setCurrentTime(0)
    onEnded?.()
  }, [onEnded])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressRef.current
      const audios = audioRefs.current.filter(Boolean)
      if (!bar || audios.length === 0 || !duration) return
      const rect = bar.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const newTime = ratio * duration
      audios.forEach((audio) => (audio.currentTime = newTime))
      setCurrentTime(newTime)
    },
    [duration],
  )

  // Initialize audio position when loaded
  useEffect(() => {
    const audios = audioRefs.current.filter(Boolean)
    if (audios.length > 0 && duration > 0 && startTime > 0) {
      audios.forEach((audio) => {
        if (audio.currentTime === 0) {
          audio.currentTime = startTime
        }
      })
      if (currentTime === 0) {
        setCurrentTime(startTime)
      }
    }
  }, [duration, startTime, sources.length])

  // Reload audio elements when sources change
  useEffect(() => {
    audioRefs.current.filter(Boolean).forEach((audio) => {
      audio.load()
    })
  }, [sources])

  const progress = duration ? currentTime / duration : 0

  /** Compute the inline style for a single waveform bar */
  const getBarStyle = (height: number, index: number) => {
    const lit = activeBars[index]
    const baseH = height * BAR_BASE_HEIGHT
    const finalH = lit ? baseH + Math.random() * BAR_RANDOM_EXTRA : baseH * BAR_DIM_FACTOR
    return {
      height: `${finalH}px`,
      background: lit ? '#d4a8ff' : '#7a3399',
      opacity: lit ? 1 : 0.5,
      boxShadow: lit ? '0 0 4px #d4a8ff' : 'none',
    }
  }

  const toggleExpanded = useCallback(() => setExpanded((isExpanded) => !isExpanded), [])

  return {
    // Refs
    audioRefs,
    progressRef,
    // State
    playing,
    currentTime,
    duration,
    expanded,
    sources,
    progress,
    // Handlers
    togglePlay,
    toggleExpanded,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    handleProgressClick,
    getBarStyle,
  }
}
