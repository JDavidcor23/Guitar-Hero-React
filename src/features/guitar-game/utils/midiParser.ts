import type { SongData, SongMetadata } from '../types/GuitarGame.types'

/**
 * Mapeo de notas MIDI a carriles del juego
 * Rock Band/Clone Hero usa estos rangos para guitarra/bajo:
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
 * Mapeo de notas MIDI para batería (drums)
 * - Easy: 60-64 (kick, snare, hi-hat, etc.)
 * - Medium: 72-76
 * - Hard: 84-88
 * - Expert: 96-100
 * Nota: En drums se usa el mismo rango pero con diferente interpretación
 */
const DRUMS_NOTE_MAP: Record<string, Record<number, number>> = {
  easy: { 60: 0, 61: 1, 62: 2, 63: 3, 64: 4 },
  medium: { 72: 0, 73: 1, 74: 2, 75: 3, 76: 4 },
  hard: { 84: 0, 85: 1, 86: 2, 87: 3, 88: 4 },
  expert: { 96: 0, 97: 1, 98: 2, 99: 3, 100: 4 },
}

/**
 * Mapeo de tracks MIDI a nombres de instrumentos legibles
 */
const INSTRUMENT_NAMES: Record<string, string> = {
  'PART GUITAR': 'Guitarra',
  'PART BASS': 'Bajo',
  'PART DRUMS': 'Batería',
  'PART VOCALS': 'Voz',
  'PART KEYS': 'Teclado',
  'PART RHYTHM': 'Guitarra Rítmica',
  'PART GUITAR COOP': 'Guitarra Coop',
}

/**
 * Instrumentos que usan el mapeo de guitarra (5 carriles)
 */
const GUITAR_LIKE_INSTRUMENTS = ['PART GUITAR', 'PART BASS', 'PART KEYS', 'PART RHYTHM', 'PART GUITAR COOP']

/**
 * Instrumentos que usan el mapeo de batería
 */
const DRUM_LIKE_INSTRUMENTS = ['PART DRUMS']

interface TempoEvent {
  tick: number
  tempo: number // microsegundos por beat
}

interface NoteEvent {
  tick: number
  note: number
  velocity: number
  isOn: boolean
}

interface ParsedNote {
  tick: number
  carril: number
  duration: number // en ticks
}

/**
 * Parser de archivos MIDI para Rock Band/Clone Hero
 */
export class MidiParser {
  private data: DataView
  private pos: number = 0
  private trackCount: number = 0
  private resolution: number = 480 // ticks por beat (PPQ)
  private tempoTrack: TempoEvent[] = []
  private tracks: Map<string, NoteEvent[]> = new Map()

  constructor(arrayBuffer: ArrayBuffer) {
    this.data = new DataView(arrayBuffer)
  }

  /**
   * Parsea el archivo MIDI completo
   */
  parse(): this {
    this.parseHeader()

    for (let i = 0; i < this.trackCount; i++) {
      this.parseTrack()
    }

    return this
  }

  /**
   * Parsea el header MIDI (MThd)
   */
  private parseHeader(): void {
    // Verificar "MThd"
    const magic = this.readString(4)
    if (magic !== 'MThd') {
      throw new Error('No es un archivo MIDI válido')
    }

    // Tamaño del header (siempre 6)
    const headerLength = this.readUint32()
    if (headerLength !== 6) {
      throw new Error('Header MIDI inválido')
    }

    // Formato (0, 1, o 2) - lo leemos pero no lo usamos
    this.readUint16()

    // Número de tracks
    this.trackCount = this.readUint16()

    // División de tiempo (ticks por beat)
    this.resolution = this.readUint16()

    // Si el bit más alto está activo, es SMPTE timing (no soportado)
    if (this.resolution & 0x8000) {
      throw new Error('SMPTE timing no soportado')
    }
  }

  /**
   * Parsea un track MIDI (MTrk)
   */
  private parseTrack(): void {
    // Verificar "MTrk"
    const magic = this.readString(4)
    if (magic !== 'MTrk') {
      throw new Error('Track MIDI inválido')
    }

    const trackLength = this.readUint32()
    const trackEnd = this.pos + trackLength

    let trackName = ''
    const events: NoteEvent[] = []
    let currentTick = 0
    let lastStatus = 0

    while (this.pos < trackEnd) {
      // Leer delta time (variable length)
      const deltaTime = this.readVariableLength()
      currentTick += deltaTime

      // Leer byte de status
      let status = this.readUint8()

      // Soporte para Running Status
      // Si el byte más significativo no está activo, es un byte de datos y usamos el status anterior
      if (status < 0x80) {
        if (lastStatus === 0) {
          // Esto no debería pasar en un MIDI válido, pero lo manejamos
          this.pos-- // Retroceder para saltar este byte de datos
          continue
        }
        status = lastStatus
        this.pos-- // El byte que leímos era el primer byte de datos, retroceder para leerlo bien
      } else if (status < 0xF0) {
        // Solo guardar como running status si no es un system message (>= 0xF0)
        lastStatus = status
      }

      if (status === 0xff) {
        // Meta evento (no tiene running status)
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
        // Los meta-eventos resetean el running status en algunas implementaciones
      } else if (status === 0xf0 || status === 0xf7) {
        // SysEx evento - saltar (no tiene running status)
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
        // Program Change o Channel Pressure (1 byte de datos)
        this.pos += 1
      } else if ((status & 0xf0) >= 0x80) {
        // Otros eventos de canal (2 bytes de datos: Control Change, Pitch Bend, etc.)
        this.pos += 2
      }
    }

    // Asegurar que estamos al final del track
    this.pos = trackEnd

    if (trackName) {
      this.tracks.set(trackName, events)
    } else if (events.length > 0) {
      // Si no tiene nombre pero tiene notas, darle un nombre genérico
      this.tracks.set(`TRACK_${this.tracks.size}`, events)
    }
  }

  /**
   * Obtiene los instrumentos disponibles en el MIDI
   */
  getAvailableInstruments(): Array<{ trackName: string; displayName: string }> {
    const instruments: Array<{ trackName: string; displayName: string }> = []

    for (const trackName of this.tracks.keys()) {
      // Solo incluir tracks que son instrumentos conocidos y tienen notas jugables
      if (INSTRUMENT_NAMES[trackName]) {
        const events = this.tracks.get(trackName)
        if (events && events.length > 0) {
          // Verificar si tiene notas en alguna dificultad
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
   * Obtiene las dificultades disponibles para un instrumento específico
   */
  getAvailableDifficulties(trackName: string = 'PART GUITAR'): string[] {
    // Intentar con el track especificado, o fallback a PART GUITAR / PART BASS
    let events = this.tracks.get(trackName)
    if (!events) {
      events = this.tracks.get('PART GUITAR') || this.tracks.get('PART BASS')
    }
    if (!events) return []

    const available: string[] = []
    const noteNumbers = new Set(events.map((e) => e.note))

    // Seleccionar el mapeo correcto según el instrumento
    const noteMap = DRUM_LIKE_INSTRUMENTS.includes(trackName) ? DRUMS_NOTE_MAP : GUITAR_NOTE_MAP

    // Verificar qué dificultades tienen notas
    for (const [difficulty, diffNoteMap] of Object.entries(noteMap)) {
      const hasNotes = Object.keys(diffNoteMap).some((n) => noteNumbers.has(parseInt(n)))
      if (hasNotes) {
        available.push(difficulty)
      }
    }

    return available
  }

  /**
   * Obtiene los nombres de tracks disponibles
   */
  getAvailableTracks(): string[] {
    return Array.from(this.tracks.keys())
  }

  /**
   * Convierte ticks a segundos usando el tempo track
   */
  private ticksToSeconds(tick: number): number {
    if (this.tempoTrack.length === 0) {
      // Tempo default: 120 BPM = 500000 microsegundos por beat
      return (tick / this.resolution) * 0.5
    }

    let seconds = 0
    let lastTick = 0
    let currentTempo = 500000 // 120 BPM default

    for (const tempoEvent of this.tempoTrack) {
      if (tempoEvent.tick > tick) break

      // Calcular tiempo desde el último cambio de tempo
      const deltaTicks = tempoEvent.tick - lastTick
      const deltaBeats = deltaTicks / this.resolution
      const deltaSeconds = deltaBeats * (currentTempo / 1000000)
      seconds += deltaSeconds

      lastTick = tempoEvent.tick
      currentTempo = tempoEvent.tempo
    }

    // Calcular tiempo restante con el tempo actual
    const remainingTicks = tick - lastTick
    const remainingBeats = remainingTicks / this.resolution
    const remainingSeconds = remainingBeats * (currentTempo / 1000000)
    seconds += remainingSeconds

    return parseFloat(seconds.toFixed(3))
  }

  /**
   * Convierte una duración en ticks a segundos
   */
  private ticksDurationToSeconds(startTick: number, durationTicks: number): number {
    const endTick = startTick + durationTicks
    return this.ticksToSeconds(endTick) - this.ticksToSeconds(startTick)
  }

  /**
   * Extrae las notas de una dificultad específica
   */
  private extractNotes(difficulty: string, trackName: string = 'PART GUITAR'): ParsedNote[] {
    // Intentar con el track especificado, o fallback a PART GUITAR / PART BASS
    let events = this.tracks.get(trackName)
    if (!events) {
      events = this.tracks.get('PART GUITAR') || this.tracks.get('PART BASS')
    }
    if (!events) return []

    // Seleccionar el mapeo correcto según el instrumento
    const instrumentNoteMap = DRUM_LIKE_INSTRUMENTS.includes(trackName) ? DRUMS_NOTE_MAP : GUITAR_NOTE_MAP
    const noteMap = instrumentNoteMap[difficulty]
    if (!noteMap) return []

    const notes: ParsedNote[] = []
    const activeNotes: Map<number, number> = new Map() // note -> startTick

    for (const event of events) {
      const carril = noteMap[event.note]
      if (carril === undefined) continue

      if (event.isOn) {
        // Note On - Si ya estaba activa, cerrarla primero (evitar notas infinitas)
        if (activeNotes.has(event.note)) {
          const prevStartTick = activeNotes.get(event.note)!
          // Si es el mismo tick, ignorar (nota duplicada)
          if (prevStartTick < event.tick) {
            notes.push({
              tick: prevStartTick,
              carril,
              duration: event.tick - prevStartTick,
            })
          }
        }
        activeNotes.set(event.note, event.tick)
      } else {
        // Note Off - calcular duración
        const startTick = activeNotes.get(event.note)
        if (startTick !== undefined) {
          // Solo agregar si la duración es positiva
          if (event.tick > startTick) {
            notes.push({
              tick: startTick,
              carril,
              duration: event.tick - startTick,
            })
          } else if (event.tick === startTick) {
            // Nota de duración cero, darle una duración mínima (1/32 de beat aprox)
            notes.push({
              tick: startTick,
              carril,
              duration: Math.max(1, Math.floor(this.resolution / 8)),
            })
          }
          activeNotes.delete(event.note)
        }
      }
    }

    // Cerrar notas que quedaron abiertas al final del track
    if (activeNotes.size > 0 && events.length > 0) {
      const lastTick = events[events.length - 1].tick
      for (const [note, startTick] of activeNotes.entries()) {
        const carril = noteMap[note]
        if (carril !== undefined) {
          notes.push({
            tick: startTick,
            carril: carril,
            duration: Math.max(1, lastTick - startTick),
          })
        }
      }
    }

    return notes.sort((a, b) => a.tick - b.tick)
  }

  /**
   * Convierte a formato SongData del juego
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

    // Convertir notas a formato del juego
    const songNotes = notes.map((note) => ({
      segundo: this.ticksToSeconds(note.tick),
      carril: note.carril,
      duracion: this.ticksDurationToSeconds(note.tick, note.duration),
    }))

    // Calcular duración total
    const lastNote = notes[notes.length - 1]
    const duration = this.ticksToSeconds(lastNote.tick + lastNote.duration) + 5

    // Calcular NPS
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
      },
      notes: songNotes,
    }
  }

  /**
   * Calcula el NPS máximo en ventanas de 1 segundo
   */
  private calculateMaxNPS(
    notes: Array<{ segundo: number; carril: number; duracion: number }>,
    duration: number
  ): number {
    let maxNPS = 0

    for (let time = 0; time < duration; time += 0.5) {
      const count = notes.filter((n) => n.segundo >= time && n.segundo < time + 1).length
      maxNPS = Math.max(maxNPS, count)
    }

    return maxNPS
  }

  // ==========================================
  // Funciones auxiliares de lectura
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
 * Parsea un archivo song.ini para obtener metadata
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
        metadata.duration = parseInt(trimmedValue) / 1000 // ms a segundos
        break
    }
  }

  return metadata
}
