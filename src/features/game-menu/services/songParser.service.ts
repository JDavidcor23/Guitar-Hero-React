import type { SongData, SongMetadata } from '../../gameplay/types/GuitarGame.types'
import { ChartParser } from '../../gameplay/utils/chartParser'
import { MidiParser, parseSongIni } from '../../gameplay/utils/midiParser'

export interface InstrumentInfo {
  trackName: string
  displayName: string
}

export interface ParserInterface {
  getAvailableDifficulties(trackName?: string): string[]
  getAvailableInstruments?: () => InstrumentInfo[]
  convertToSongData(
    difficulty: string,
    metadata?: Partial<SongMetadata>,
    trackName?: string
  ): SongData | null
}

export interface ParseResult {
  parser: ParserInterface
  metadata: Partial<SongMetadata>
  instruments: InstrumentInfo[]
  difficulties: string[]
  currentInstrument: string
  songData: SongData
}

export async function parseChartContent(
  content: string,
  metadata: Partial<SongMetadata> = {}
): Promise<ParseResult> {
  const parser = new ChartParser()
  parser.parse(content)

  const difficulties = parser.getAvailableDifficulties()
  if (difficulties.length === 0) {
    throw new Error('No se encontraron notas en el archivo')
  }

  const defaultDifficulty = difficulties[difficulties.length - 1]
  const songData = parser.convertToSongData(defaultDifficulty, metadata)

  if (!songData) {
    throw new Error('Error al convertir las notas')
  }

  return {
    parser,
    metadata,
    instruments: [],
    difficulties,
    currentInstrument: 'PART GUITAR',
    songData,
  }
}

export async function parseMidiContent(
  arrayBuffer: ArrayBuffer,
  metadata: Partial<SongMetadata> = {}
): Promise<ParseResult> {
  const parser = new MidiParser(arrayBuffer)
  parser.parse()

  const instruments = parser.getAvailableInstruments()
  const currentInstrument =
    instruments.find((i) => i.trackName === 'PART GUITAR')?.trackName ||
    instruments[0]?.trackName ||
    'PART GUITAR'

  const difficulties = parser.getAvailableDifficulties(currentInstrument)
  if (difficulties.length === 0) {
    throw new Error('No se encontraron notas jugables en el archivo MIDI')
  }

  const defaultDifficulty = difficulties[difficulties.length - 1]
  const songData = parser.convertToSongData(defaultDifficulty, metadata, currentInstrument)

  if (!songData) {
    throw new Error('Error al convertir las notas MIDI')
  }

  return {
    parser,
    metadata,
    instruments,
    difficulties,
    currentInstrument,
    songData,
  }
}

export async function loadFromFileService(file: File, iniFile?: File): Promise<ParseResult> {
  let metadata: Partial<SongMetadata> = {}
  if (iniFile) {
    const iniContent = await iniFile.text()
    metadata = parseSongIni(iniContent)
  }

  const extension = file.name.toLowerCase().split('.').pop()
  if (extension === 'chart' || extension === 'txt') {
    const content = await file.text()
    return parseChartContent(content, metadata)
  } else if (extension === 'mid' || extension === 'midi') {
    const arrayBuffer = await file.arrayBuffer()
    return parseMidiContent(arrayBuffer, metadata)
  } else {
    throw new Error(`Formato no soportado: .${extension}`)
  }
}

export async function loadFromFolderService(files: FileList): Promise<ParseResult> {
  let chartFile: File | null = null
  let iniFile: File | null = null

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const name = file.name.toLowerCase()
    if (name === 'notes.mid' || name === 'notes.midi') {
      chartFile = file
    } else if (name === 'notes.chart') {
      chartFile = file
    } else if (name === 'song.ini') {
      iniFile = file
    }
  }

  if (!chartFile) {
    throw new Error('No se encontró notes.mid o notes.chart en la carpeta')
  }
  return loadFromFileService(chartFile, iniFile || undefined)
}

export async function loadFromUrlsService(
  chartUrl: string,
  metadata: Partial<SongMetadata> = {}
): Promise<ParseResult> {
  const response = await fetch(chartUrl)
  if (!response.ok) throw new Error('No se pudo descargar el archivo de la canción')

  const extension = chartUrl.toLowerCase().split('.').pop()
  if (extension === 'chart' || chartUrl.endsWith('.txt')) {
    const content = await response.text()
    return parseChartContent(content, metadata)
  } else if (extension === 'mid' || extension === 'midi') {
    const arrayBuffer = await response.arrayBuffer()
    return parseMidiContent(arrayBuffer, metadata)
  } else {
    throw new Error(`Formato no soportado: .${extension}`)
  }
}
