import type { SongData } from '../types/GuitarGame.types'

interface BPMChange {
  beat: number
  bpm: number
}

interface ChartNote {
  beat: number
  carril: number
  sustainBeats: number // Duración del sustain en beats (0 = nota normal)
}

/**
 * Parsea archivos .chart de Clone Hero
 */
export class ChartParser {
  private metadata = {
    songName: 'Unknown Song',
    artist: 'Unknown Artist',
    charter: '',
    chartDifficulty: 0,
  }
  private resolution = 192
  private bpmTrack: BPMChange[] = []
  private difficulties: Record<string, ChartNote[]> = {
    easy: [],
    medium: [],
    hard: [],
    expert: [],
  }

  /**
   * Parsea el contenido del archivo .chart
   */
  parse(chartContent: string): this {
    const lines = chartContent.split('\n')
    let currentSection: string | null = null

    for (const line of lines) {
      const trimmed = line.trim()

      // Detectar sección [Section]
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1)
        continue
      }

      // Ignorar líneas vacías y llaves
      if (!trimmed || trimmed === '{' || trimmed === '}') {
        continue
      }

      // Parsear según sección
      if (currentSection === 'Song') {
        this.parseSongMetadata(trimmed)
      } else if (currentSection === 'SyncTrack') {
        this.parseSyncTrack(trimmed)
      } else if (currentSection === 'EasySingle') {
        this.parseNote(trimmed, 'easy')
      } else if (currentSection === 'MediumSingle') {
        this.parseNote(trimmed, 'medium')
      } else if (currentSection === 'HardSingle') {
        this.parseNote(trimmed, 'hard')
      } else if (currentSection === 'ExpertSingle') {
        this.parseNote(trimmed, 'expert')
      }
    }

    return this
  }

  /**
   * Parsea metadatos [Song]
   */
  private parseSongMetadata(line: string): void {
    const match = line.match(/(\w+)\s*=\s*"?([^"]+)"?/)
    if (match) {
      const [, key, value] = match
      const cleanValue = value.replace(/"/g, '').trim()

      if (key === 'Name') this.metadata.songName = cleanValue
      else if (key === 'Artist') this.metadata.artist = cleanValue
      else if (key === 'Charter') this.metadata.charter = cleanValue
      else if (key === 'Difficulty') this.metadata.chartDifficulty = parseInt(cleanValue)
      else if (key === 'Resolution') this.resolution = parseInt(cleanValue)
    }
  }

  /**
   * Parsea cambios de BPM [SyncTrack]
   * Formato: 0 = B 88200
   */
  private parseSyncTrack(line: string): void {
    const match = line.match(/(\d+)\s*=\s*B\s+(\d+)/)
    if (match) {
      this.bpmTrack.push({
        beat: parseInt(match[1]),
        bpm: parseInt(match[2]) / 1000, // micro-BPM a BPM
      })
    }
  }

  /**
   * Parsea notas [EasySingle], [MediumSingle], etc.
   * Formato: 12864 = N 0 480 (beat, carril, sustainBeats)
   * sustainBeats > 0 significa que es una nota sostenida
   */
  private parseNote(line: string, difficulty: string): void {
    const match = line.match(/(\d+)\s*=\s*N\s+(\d+)\s+(\d+)/)
    if (match) {
      const carril = parseInt(match[2])
      // Filtrar carriles inválidos (5 y 6 son force strum/tap notes)
      if (carril < 5) {
        this.difficulties[difficulty].push({
          beat: parseInt(match[1]),
          carril: carril,
          sustainBeats: parseInt(match[3]), // Ahora capturamos la duración del sustain
        })
      }
    }
  }

  /**
   * Convierte beats a segundos usando BPM variable
   */
  private beatsToSeconds(beat: number): number {
    // Encontrar BPM activo en ese beat
    let activeBPM = 120 // default

    for (const sync of this.bpmTrack) {
      if (sync.beat <= beat) {
        activeBPM = sync.bpm
      } else {
        break
      }
    }

    // Convertir beats a segundos
    const actualBeats = beat / this.resolution
    const seconds = (actualBeats / activeBPM) * 60

    return parseFloat(seconds.toFixed(3))
  }

  /**
   * Convierte una duración en beats a segundos
   * Usado para calcular la duración de notas sostenidas
   */
  private beatsDurationToSeconds(startBeat: number, durationBeats: number): number {
    if (durationBeats === 0) return 0

    // Encontrar BPM activo al inicio del sustain
    let activeBPM = 120 // default
    for (const sync of this.bpmTrack) {
      if (sync.beat <= startBeat) {
        activeBPM = sync.bpm
      } else {
        break
      }
    }

    // Convertir beats a segundos
    const actualBeats = durationBeats / this.resolution
    const seconds = (actualBeats / activeBPM) * 60

    return parseFloat(seconds.toFixed(3))
  }

  /**
   * Calcula NPS (Notas Por Segundo) de un array de notas
   */
  private calculateNPS(notes: ChartNote[], duration: number): { average: number; max: number } {
    if (notes.length === 0 || duration === 0) {
      return { average: 0, max: 0 }
    }

    // NPS promedio
    const average = notes.length / duration

    // NPS máximo (ventana de 1 segundo)
    let maxNPS = 0
    const windowSize = 1.0 // 1 segundo

    for (let time = 0; time < duration; time += 0.5) {
      const notesInWindow = notes.filter((note) => {
        const noteTime = this.beatsToSeconds(note.beat)
        return noteTime >= time && noteTime < time + windowSize
      }).length

      maxNPS = Math.max(maxNPS, notesInWindow)
    }

    return {
      average: parseFloat(average.toFixed(2)),
      max: maxNPS,
    }
  }

  /**
   * Obtiene dificultades disponibles
   */
  getAvailableDifficulties(): string[] {
    const available: string[] = []

    if (this.difficulties.easy.length > 0) available.push('easy')
    if (this.difficulties.medium.length > 0) available.push('medium')
    if (this.difficulties.hard.length > 0) available.push('hard')
    if (this.difficulties.expert.length > 0) available.push('expert')

    return available
  }

  /**
   * Convierte una dificultad a formato SongData
   */
  convertToSongData(difficulty: string): SongData | null {
    const notes = this.difficulties[difficulty]

    if (!notes || notes.length === 0) {
      return null
    }

    // Convertir notas a formato del juego (incluyendo duración de sustains)
    const songNotes = notes.map((note) => ({
      segundo: this.beatsToSeconds(note.beat),
      carril: note.carril,
      duracion: this.beatsDurationToSeconds(note.beat, note.sustainBeats),
    }))

    // Ordenar por tiempo
    songNotes.sort((a, b) => a.segundo - b.segundo)

    // Calcular duración (último beat + buffer)
    const lastBeat = Math.max(...notes.map((n) => n.beat))
    const duration = this.beatsToSeconds(lastBeat) + 5

    // Calcular NPS
    const npsStats = this.calculateNPS(notes, duration)

    return {
      metadata: {
        songName: this.metadata.songName,
        artist: this.metadata.artist,
        charter: this.metadata.charter,
        duration: parseFloat(duration.toFixed(2)),
        totalNotes: songNotes.length,
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        chartDifficulty: this.metadata.chartDifficulty,
        averageNPS: npsStats.average,
        maxNPS: npsStats.max,
      },
      notes: songNotes,
    }
  }
}
