import type { SongData, SongMetadata } from '../types/GuitarGame.types'

/**
 * Mapping of MIDI Notes to game lanes
 * Rock Band/Clone Hero uses these ranges for guitar/bass:
 * - Easy: 60-64
 * - Medium: 72-76
 * - Hard: 84-88
 * - Expert: 96-100
 */
const GUITAR_NOTE_MAP: Record<string, Record<number, number>> = {
  easy: { 60: 0, 61: 1, 62: 2, 63: 3, 64: 4 },
  medium: { 72: 0, 73: 1, 74: 2, 75: 3, 76: 4 },
  hard: { 84: 0, 85: 1, 86: 2, 87: 3, 88: 4 },
  expert: { 96: 0, 97: 1, 98: 2, 99: 3, 100: 4 },
}

/**
 * MIDI Note mapping for drums
 * - Easy: 60-64 (kick, snare, hi-hat, etc.)
 * - Medium: 72-76
 * - Hard: 84-88
 * - Expert: 96-100
 * Note: Drums use the same range but with different interpretation
 */
const DRUMS_NOTE_MAP: Record<string, Record<number, number>> = {
  easy: { 60: 0, 61: 1, 62: 2, 63: 3, 64: 4 },
  medium: { 72: 0, 73: 1, 74: 2, 75: 3, 76: 4 },
  hard: { 84: 0, 85: 1, 86: 2, 87: 3, 88: 4 },
  expert: { 96: 0, 97: 1, 98: 2, 99: 3, 100: 4 },
}

/**
 * Mapping of MIDI tracks to readable instrument names
 */
const INSTRUMENT_NAMES: Record<string, string> = {
  'PART GUITAR': 'Guitar',
  'PART BASS': 'Bass',
  'PART DRUMS': 'Drums',
  'PART VOCALS': 'Vocals',
  'PART KEYS': 'Keys',
  'PART RHYTHM': 'Rhythm Guitar',
  'PART GUITAR COOP': 'Co-op Guitar',
}

/**
 * Instruments that use guitar-style mapping (5 lanes)
 */
const GUITAR_LIKE_INSTRUMENTS = ['PART GUITAR', 'PART BASS', 'PART KEYS', 'PART RHYTHM', 'PART GUITAR COOP']

/**
 * Instruments that use drum-style mapping
 */
const DRUM_LIKE_INSTRUMENTS = ['PART DRUMS']

interface TempoEvent {
  tick: number
  tempo: number // microseconds per beat
}

interface NoteEvent {
  tick: number
  note: number
  velocity: number
  isOn: boolean
}

interface ParsedNote {
  tick: number
  lane: number
  duration: number // in ticks
}

/**
 * MIDI file parser for Rock Band/Clone Hero
 */
export class MidiParser {
  private data: DataView
  private pos: number = 0
  private trackCount: number = 0
  private resolution: number = 480 // ticks per beat (PPQ)
  private tempoTrack: TempoEvent[] = []
  private tracks: Map<string, NoteEvent[]> = new Map()

  constructor(arrayBuffer: ArrayBuffer) {
    this.data = new DataView(arrayBuffer)
  }

  /**
   * Parses the entire MIDI file
   */
  parse(): this {
    this.parseHeader()

    for (let i = 0; i < this.trackCount; i++) {
      this.parseTrack()
    }

    return this
  }

  /**
   * Parses the MIDI header (MThd)
   */
  private parseHeader(): void {
    // Verificar "MThd"
    const magic = this.readString(4)
    if (magic !== 'MThd') {
      throw new Error('Not a valid MIDI file')
    }

    // Tamaño del header (siempre 6)
    const headerLength = this.readUint32()
    if (headerLength !== 6) {
      throw new Error('Invalid MIDI header')
    }

    // Format (0, 1, or 2) - read but not used
    this.readUint16()

    // Number of tracks
    this.trackCount = this.readUint16()

    // Time division (ticks per beat)
    this.resolution = this.readUint16()

    // If highest bit is active, it's SMPTE timing (not supported)
    if (this.resolution & 0x8000) {
      throw new Error('SMPTE timing not supported')
    }
  }

  /**
   * Parses a MIDI track (MTrk)
   */
  private parseTrack(): void {
    // Verificar "MTrk"
    const magic = this.readString(4)
    if (magic !== 'MTrk') {
      throw new Error('Invalid MIDI track')
    }

    const trackLength = this.readUint32()
    const trackEnd = this.pos + trackLength

    let trackName = ''
    const events: NoteEvent[] = []
    let currentTick = 0
    let lastStatus = 0

    while (this.pos < trackEnd) {
      // Read delta time (variable length)
      const deltaTime = this.readVariableLength()
      currentTick += deltaTime

      // Read status byte
      let status = this.readUint8()

      // Running Status support
      // If most significant bit is not set, it's a data byte and we use the previous status
      if (status < 0x80) {
        if (lastStatus === 0) {
          // This should not happen in valid MIDI, but we handle it
          this.pos-- // Go back to skip this data byte
          continue
        }
        status = lastStatus
        this.pos-- // The byte we read was the first data byte, back up to read it correctly
      } else if (status < 0xF0) {
        // Only save as running status if it's not a system message (>= 0xF0)
        lastStatus = status
      }

      if (status === 0xff) {
        // Meta event (no running status)
        const metaType = this.readUint8()
        const metaLength = this.readVariableLength()

        if (metaType === 0x03) {
          // Track name
          trackName = this.readString(metaLength)
        } else if (metaType === 0x51 && metaLength === 3) {
          // Set Tempo
          const tempo = (this.readUint8() << 16) | (this.readUint8() << 8) | this.readUint8()
          this.tempoTrack.push({ tick: currentTick, tempo })
        } else if (metaType === 0x2f) {
          // End of Track
          break
        } else {
          // Saltar otros meta eventos
          this.pos += metaLength
        }
        // Meta-events reset running status in some implementations
      } else if (status === 0xf0 || status === 0xf7) {
        // SysEx event - skip (no running status)
        const sysexLength = this.readVariableLength()
        this.pos += sysexLength
      } else if ((status & 0xf0) === 0x90) {
        // Note On
        const note = this.readUint8()
        const velocity = this.readUint8()
        events.push({
          tick: currentTick,
          note,
          velocity,
          isOn: velocity > 0,
        })
      } else if ((status & 0xf0) === 0x80) {
        // Note Off
        const note = this.readUint8()
        const velocity = this.readUint8()
        events.push({
          tick: currentTick,
          note,
          velocity,
          isOn: false,
        })
      } else if ((status & 0xf0) === 0xc0 || (status & 0xf0) === 0xd0) {
        // Program Change or Channel Pressure (1 data byte)
        this.pos += 1
      } else if ((status & 0xf0) >= 0x80) {
        // Other channel events (2 data bytes: Control Change, Pitch Bend, etc.)
        this.pos += 2
      }
    }

    // Ensure we are at the end of the track
    this.pos = trackEnd

    if (trackName) {
      this.tracks.set(trackName, events)
    } else if (events.length > 0) {
      // If it doesn't have a name but has notes, give it a generic name
      this.tracks.set(`TRACK_${this.tracks.size}`, events)
    }
  }

  /**
   * Gets the instruments available in the MIDI
   */
  getAvailableInstruments(): Array<{ trackName: string; displayName: string }> {
    const instruments: Array<{ trackName: string; displayName: string }> = []

    for (const trackName of this.tracks.keys()) {
      // Only include tracks that are known instruments and have playable notes
      if (INSTRUMENT_NAMES[trackName]) {
        const events = this.tracks.get(trackName)
        if (events && events.length > 0) {
          // Check if it has notes in any difficulty
          const noteMap = GUITAR_LIKE_INSTRUMENTS.includes(trackName) ? GUITAR_NOTE_MAP : DRUMS_NOTE_MAP
          const noteNumbers = new Set(events.map((e) => e.note))

          const hasPlayableNotes = Object.values(noteMap).some((diffMap) =>
            Object.keys(diffMap).some((n) => noteNumbers.has(parseInt(n)))
          )

          if (hasPlayableNotes) {
            instruments.push({
              trackName,
              displayName: INSTRUMENT_NAMES[trackName],
            })
          }
        }
      }
    }

    return instruments
  }

  /**
   * Gets available difficulties for a specific instrument
   */
  getAvailableDifficulties(trackName: string = 'PART GUITAR'): string[] {
    // Try with the specified track, or fallback to PART GUITAR / PART BASS
    let events = this.tracks.get(trackName)
    if (!events) {
      events = this.tracks.get('PART GUITAR') || this.tracks.get('PART BASS')
    }
    if (!events) return []

    const available: string[] = []
    const noteNumbers = new Set(events.map((e) => e.note))

    // Select the correct mapping based on instrument
    const noteMap = DRUM_LIKE_INSTRUMENTS.includes(trackName) ? DRUMS_NOTE_MAP : GUITAR_NOTE_MAP

    // Check which difficulties have notes
    for (const [difficulty, diffNoteMap] of Object.entries(noteMap)) {
      const hasNotes = Object.keys(diffNoteMap).some((n) => noteNumbers.has(parseInt(n)))
      if (hasNotes) {
        available.push(difficulty)
      }
    }

    return available
  }

  /**
   * Gets available track names
   */
  getAvailableTracks(): string[] {
    return Array.from(this.tracks.keys())
  }

  /**
   * Converts ticks to seconds using the tempo track
   */
  private ticksToSeconds(tick: number): number {
    if (this.tempoTrack.length === 0) {
      // Default tempo: 120 BPM = 500000 microseconds per beat
      return (tick / this.resolution) * 0.5
    }

    let seconds = 0
    let lastTick = 0
    let currentTempo = 500000 // 120 BPM default

    for (const tempoEvent of this.tempoTrack) {
      if (tempoEvent.tick > tick) break

      // Compute time since last tempo change
      const deltaTicks = tempoEvent.tick - lastTick
      const deltaBeats = deltaTicks / this.resolution
      const deltaSeconds = deltaBeats * (currentTempo / 1000000)
      seconds += deltaSeconds

      lastTick = tempoEvent.tick
      currentTempo = tempoEvent.tempo
    }

    // Compute remaining time with current tempo
    const remainingTicks = tick - lastTick
    const remainingBeats = remainingTicks / this.resolution
    const remainingSeconds = remainingBeats * (currentTempo / 1000000)
    seconds += remainingSeconds

    return parseFloat(seconds.toFixed(3))
  }

  /**
   * Converts a duration in ticks to seconds
   */
  private ticksDurationToSeconds(startTick: number, durationTicks: number): number {
    const endTick = startTick + durationTicks
    return this.ticksToSeconds(endTick) - this.ticksToSeconds(startTick)
  }

  /**
   * Extracts notes for a specific difficulty
   */
  private extractNotes(difficulty: string, trackName: string = 'PART GUITAR'): ParsedNote[] {
    // Try with the specified track, or fallback to PART GUITAR / PART BASS
    let events = this.tracks.get(trackName)
    if (!events) {
      events = this.tracks.get('PART GUITAR') || this.tracks.get('PART BASS')
    }
    if (!events) return []

    // Select correct mapping based on instrument
    const instrumentNoteMap = DRUM_LIKE_INSTRUMENTS.includes(trackName) ? DRUMS_NOTE_MAP : GUITAR_NOTE_MAP
    const noteMap = instrumentNoteMap[difficulty]
    if (!noteMap) return []

    const notes: ParsedNote[] = []
    const activeNotes: Map<number, number> = new Map() // note -> startTick

    for (const event of events) {
      const lane = noteMap[event.note]
      if (lane === undefined) continue

      if (event.isOn) {
        // Note On - If already active, close it first (avoid infinite notes)
        if (activeNotes.has(event.note)) {
          const prevStartTick = activeNotes.get(event.note)!
          // If it's the same tick, ignore (duplicate note)
          if (prevStartTick < event.tick) {
            notes.push({
              tick: prevStartTick,
              lane,
              duration: event.tick - prevStartTick,
            })
          }
        }
        activeNotes.set(event.note, event.tick)
      } else {
        // Note Off - compute duration
        const startTick = activeNotes.get(event.note)
        if (startTick !== undefined) {
          // Only add if duration is positive
          if (event.tick > startTick) {
            notes.push({
              tick: startTick,
              lane,
              duration: event.tick - startTick,
            })
          } else if (event.tick === startTick) {
            // Zero duration note, give it a minimum duration (~1/32 of a beat)
            notes.push({
              tick: startTick,
              lane,
              duration: Math.max(1, Math.floor(this.resolution / 8)),
            })
          }
          activeNotes.delete(event.note)
        }
      }
    }

    // Close notes that remained open at the end of the track
    if (activeNotes.size > 0 && events.length > 0) {
      const lastTick = events[events.length - 1].tick
      for (const [note, startTick] of activeNotes.entries()) {
        const lane = noteMap[note]
        if (lane !== undefined) {
          notes.push({
            tick: startTick,
            lane: lane,
            duration: Math.max(1, lastTick - startTick),
          })
        }
      }
    }

    return notes.sort((a, b) => a.tick - b.tick)
  }

  /**
   * Converts to the game's SongData format
   */
  convertToSongData(
    difficulty: string,
    metadata?: Partial<SongMetadata>,
    trackName: string = 'PART GUITAR'
  ): SongData | null {
    const notes = this.extractNotes(difficulty, trackName)

    if (notes.length === 0) {
      return null
    }

    // Convert notes into game format
    const songNotes = notes.map((note) => ({
      second: this.ticksToSeconds(note.tick),
      lane: note.lane,
      duration: this.ticksDurationToSeconds(note.tick, note.duration),
    }))

    // Compute total duration
    const lastNote = notes[notes.length - 1]
    const duration = this.ticksToSeconds(lastNote.tick + lastNote.duration) + 5

    // Compute NPS
    const averageNPS = parseFloat((songNotes.length / duration).toFixed(2))

    return {
      metadata: {
        songName: metadata?.songName || 'Unknown Song',
        artist: metadata?.artist || 'Unknown Artist',
        charter: metadata?.charter || '',
        duration: parseFloat(duration.toFixed(2)),
        totalNotes: songNotes.length,
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        chartDifficulty: metadata?.chartDifficulty,
        averageNPS,
        maxNPS: this.calculateMaxNPS(songNotes, duration),
        albumArt: metadata?.albumArt,
      },
      notes: songNotes,
    }
  }

  /**
   * Computes max NPS in 1-second windows
   */
  private calculateMaxNPS(
    notes: Array<{ second: number; lane: number; duration: number }>,
    duration: number
  ): number {
    let maxNPS = 0

    for (let time = 0; time < duration; time += 0.5) {
      const count = notes.filter((n) => n.second >= time && n.second < time + 1).length
      maxNPS = Math.max(maxNPS, count)
    }

    return maxNPS
  }

  // ==========================================
  // Helper reading functions
  // ==========================================

  private readUint8(): number {
    const value = this.data.getUint8(this.pos)
    this.pos += 1
    return value
  }

  private readUint16(): number {
    const value = this.data.getUint16(this.pos, false) // Big endian
    this.pos += 2
    return value
  }

  private readUint32(): number {
    const value = this.data.getUint32(this.pos, false) // Big endian
    this.pos += 4
    return value
  }

  private readString(length: number): string {
    let str = ''
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(this.readUint8())
    }
    return str
  }

  private readVariableLength(): number {
    let value = 0
    let byte: number

    do {
      byte = this.readUint8()
      value = (value << 7) | (byte & 0x7f)
    } while (byte & 0x80)

    return value
  }
}

/**
 * Parses a song.ini file to get metadata
 */
export function parseSongIni(content: string): Partial<SongMetadata> {
  const metadata: Partial<SongMetadata> = {}
  const lines = content.split('\n')

  for (const line of lines) {
    const match = line.match(/^(\w+)\s*=\s*(.+)$/)
    if (!match) continue

    const [, key, value] = match
    const trimmedValue = value.trim()

    switch (key.toLowerCase()) {
      case 'name':
        metadata.songName = trimmedValue
        break
      case 'artist':
        metadata.artist = trimmedValue
        break
      case 'charter':
        metadata.charter = trimmedValue
        break
      case 'diff_guitar':
        metadata.chartDifficulty = parseInt(trimmedValue)
        break
      case 'song_length':
        metadata.duration = parseInt(trimmedValue) / 1000 // ms to seconds
        break
    }
  }

  return metadata
}
