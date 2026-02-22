/** Supported audio file extensions for song folder scanning */
export const AUDIO_EXTENSIONS = ['.ogg', '.opus', '.mp3', '.wav', '.flac'] as const

/** Supported image file extensions for album art */
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const

/** Seconds in one minute — used for duration formatting */
export const SECONDS_PER_MINUTE = 60

/** Maximum chart difficulty tier index */
export const MAX_CHART_DIFFICULTY = 6

/** Maps a numeric chart difficulty to a star string */
export const DIFFICULTY_STARS: Record<number, string> = {
  0: '⭐',
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐',
  4: '⭐⭐⭐',
  5: '⭐⭐⭐',
  6: '⭐⭐⭐⭐',
}

/** IDs used to filter which preloaded songs to show in the menu */
export const PRELOADED_SONG_IDS = ['Deep Purple - Smoke on the Water'] as const

/** Minimum number of path segments for a valid song file glob result */
export const MIN_SONG_PATH_PARTS = 5
