import type { PreloadedSong } from '../types/GameMenu.types'
import { MIN_SONG_PATH_PARTS, PRELOADED_SONG_IDS } from '../constants/gameMenu.constants'

/**
 * Glob-import all files from the music assets folder.
 * Each entry is a path → resolved URL mapping.
 */
const SONG_FILES = import.meta.glob('../../../assets/music/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
})

/**
 * Process the glob results and group files by song folder.
 * Returns only the songs whose folder names match PRELOADED_SONG_IDS.
 */
const processPreloadedSongs = (): PreloadedSong[] => {
  const songsMap: Record<string, PreloadedSong> = {}

  Object.entries(SONG_FILES).forEach(([path, url]) => {
    const parts = path.split('/')
    if (parts.length < MIN_SONG_PATH_PARTS) return

    const folderName = parts[parts.length - 2]
    if (!songsMap[folderName]) {
      const [artist, name] = folderName.split(' - ').map(s => s.trim())
      songsMap[folderName] = {
        id: folderName,
        name: name || folderName,
        artist: artist || 'Unknown Artist',
        config: { metadata: {}, stemsUrls: [] },
      }
    }

    const fileName = parts[parts.length - 1].toLowerCase()

    // Audio files
    if (
      fileName.endsWith('.opus') ||
      fileName.endsWith('.mp3') ||
      fileName.endsWith('.ogg') ||
      fileName.endsWith('.wav')
    ) {
      songsMap[folderName].config.stemsUrls.push(url as string)
      if (!songsMap[folderName].config.audioUrl || fileName === 'song.opus') {
        songsMap[folderName].config.audioUrl = url as string
      }
    }

    // Chart / MIDI files
    if (fileName.includes('notes.mid') || fileName.includes('notes.chart')) {
      songsMap[folderName].config.chartUrl = url as string
    } else if (fileName.includes('album.jpg') || fileName.includes('album.png')) {
      songsMap[folderName].art = url as string
      songsMap[folderName].config.metadata.albumArt = url as string
    }

    // Ensure basic metadata is always present
    const entry = songsMap[folderName]
    if (!entry.config.metadata.songName) {
      entry.config.metadata.songName = entry.name
    }
    if (!entry.config.metadata.artist) {
      entry.config.metadata.artist = entry.artist
    }
  })

  return Object.values(songsMap).filter(
    s =>
      (PRELOADED_SONG_IDS as readonly string[]).includes(s.id) &&
      (s.config.chartUrl || s.config.stemsUrls.length > 0),
  )
}

/** Pre-computed list of available preloaded songs */
export const PRELOADED_SONGS = processPreloadedSongs()

/**
 * Map an instrument track name to a CSS icon class.
 * Used to render the correct avatar icon for each instrument button.
 */
export const getInstrumentIconClass = (trackName: string): string => {
  const lower = trackName.toLowerCase()
  if (lower.includes('guitar') || lower.includes('lead')) return 'guitar'
  if (lower.includes('bass') || lower.includes('rhythm')) return 'bass'
  if (lower.includes('drum') || lower.includes('percussion')) return 'drums'
  if (lower.includes('vocal') || lower.includes('sing') || lower.includes('keys')) return 'mic'
  return 'guitar'
}
