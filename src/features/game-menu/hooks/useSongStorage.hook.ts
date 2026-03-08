import { useState, useEffect, useCallback, useRef } from 'react'
import type { SongData, SongMetadata } from '../../gameplay/types/GuitarGame.types'
import type { UserLoadedSong, StoredSong, StoredFile } from '../types/GameMenu.types'
import { ChartParser } from '../../gameplay/utils/chartParser'
import { MidiParser, parseSongIni } from '../../gameplay/utils/midiParser'
import { AUDIO_EXTENSIONS, IMAGE_EXTENSIONS } from '../constants/gameMenu.constants'

// ─── IndexedDB Constants ────────────────────────────────────
const DB_NAME = 'guitar-hero-songs'
const DB_VERSION = 1
const STORE_NAME = 'songs'

// ─── IndexedDB Helpers ──────────────────────────────────────

/** Open (or create) the IndexedDB database */
const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

/** Get all stored songs from IndexedDB */
const getAllStored = async (): Promise<StoredSong[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Put a song into IndexedDB */
const putStored = async (song: StoredSong): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(song)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

/** Delete a song from IndexedDB */
const deleteStored = async (id: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// ─── Re-parse helpers ───────────────────────────────────────

/** Re-parse stored files into a UserLoadedSong */
const restoreSong = (stored: StoredSong): UserLoadedSong | null => {
  try {
    let songData: SongData | null = null
    let coverImage: string | undefined
    const audioSrcs: string[] = []

    // Find chart and ini files
    const chartFile = stored.files.find(
      f => f.name === 'notes.mid' || f.name === 'notes.midi' || f.name === 'notes.chart',
    )
    const iniFile = stored.files.find(f => f.name === 'song.ini')

    if (!chartFile) return null

    // Create File objects for the parser to use if needed again
    const chartFileObj = new File([chartFile.data], chartFile.name, { type: chartFile.type || 'application/octet-stream' })
    const iniFileObj = iniFile ? new File([iniFile.data], iniFile.name, { type: iniFile.type || 'text/plain' }) : undefined

    // Parse metadata from ini
    let metadata: Partial<SongMetadata> = {}
    if (iniFile) {
      const decoder = new TextDecoder()
      metadata = parseSongIni(decoder.decode(iniFile.data))
    }

    // Parse chart/midi
    const ext = chartFile.name.split('.').pop()?.toLowerCase()
    if (ext === 'chart') {
      const decoder = new TextDecoder()
      const parser = new ChartParser()
      parser.parse(decoder.decode(chartFile.data))
      const difficulties = parser.getAvailableDifficulties()
      if (difficulties.length === 0) return null
      songData = parser.convertToSongData(difficulties[difficulties.length - 1], metadata)
    } else {
      // MIDI
      const parser = new MidiParser(chartFile.data)
      parser.parse()
      const instruments = parser.getAvailableInstruments()
      const defaultInstrument =
        instruments.find(i => i.trackName === 'PART GUITAR')?.trackName ||
        instruments[0]?.trackName ||
        'PART GUITAR'
      const difficulties = parser.getAvailableDifficulties(defaultInstrument)
      if (difficulties.length === 0) return null
      songData = parser.convertToSongData(
        difficulties[difficulties.length - 1],
        metadata,
        defaultInstrument,
      )
    }

    if (!songData) return null

    // Create blob URLs for audio and images
    for (const f of stored.files) {
      const lower = f.name.toLowerCase()
      const fileExt = lower.substring(lower.lastIndexOf('.'))

      if ((AUDIO_EXTENSIONS as readonly string[]).includes(fileExt)) {
        const blob = new Blob([f.data], { type: f.type || 'audio/ogg' })
        audioSrcs.push(URL.createObjectURL(blob))
      } else if ((IMAGE_EXTENSIONS as readonly string[]).includes(fileExt)) {
        if (lower.includes('album') || lower.includes('cover') || !coverImage) {
          const blob = new Blob([f.data], { type: f.type || 'image/jpeg' })
          coverImage = URL.createObjectURL(blob)
        }
      }
    }

    return {
      id: stored.id,
      storedId: stored.id,
      name: stored.name,
      artist: stored.artist,
      songData,
      coverImage,
      audioSrc: audioSrcs.length > 1 ? audioSrcs : audioSrcs[0] || '',
      chartFile: chartFileObj,
      iniFile: iniFileObj,
    }
  } catch (err) {
    console.error(`Failed to restore song "${stored.name}":`, err)
    return null
  }
}

// ─── Hook ───────────────────────────────────────────────────

/**
 * Manages IndexedDB persistence for user-uploaded songs.
 *
 * On mount, reads all stored songs, re-parses charts, and creates
 * blob URLs for audio/images. Provides save and delete operations.
 */
export const useSongStorage = () => {
  const [savedSongs, setSavedSongs] = useState<UserLoadedSong[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const initializedRef = useRef(false)

  // Load saved songs on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const load = async () => {
      try {
        const stored = await getAllStored()
        const restored = stored
          .map(restoreSong)
          .filter((s): s is UserLoadedSong => s !== null)
        setSavedSongs(restored)
      } catch (err) {
        console.error('Failed to load saved songs:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  /** Save a song's raw files to IndexedDB */
  const saveSong = useCallback(
    async (id: string, name: string, artist: string, files: FileList) => {
      try {
        const storedFiles: StoredFile[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const data = await file.arrayBuffer()
          storedFiles.push({ name: file.name.toLowerCase(), data, type: file.type })
        }

        const stored: StoredSong = { id, name, artist, files: storedFiles }
        await putStored(stored)
      } catch (err) {
        console.error('Failed to save song:', err)
      }
    },
    [],
  )

  /** Delete a song from IndexedDB and remove from state */
  const deleteSong = useCallback(async (id: string) => {
    try {
      await deleteStored(id)
      setSavedSongs(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Failed to delete song:', err)
    }
  }, [])

  return { savedSongs, isLoading, saveSong, deleteSong }
}
