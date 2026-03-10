export interface AudioState {
  isLoaded: boolean
  isPlaying: boolean
  isLoading: boolean
  duration: number
  error: string | null
  stemsLoaded: number
}

export interface AudioStem {
  name: string
  buffer: AudioBuffer
}

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private stems: AudioStem[] = []
  private sourceNodes: AudioBufferSourceNode[] = []
  private masterGain: GainNode | null = null

  private startTime = 0
  private pausedAt = 0
  private calibrationOffsetMs = 0
  private playing = false

  private state: AudioState = {
    isLoaded: false,
    isPlaying: false,
    isLoading: false,
    duration: 0,
    error: null,
    stemsLoaded: 0,
  }

  public onStateChange?: (state: AudioState) => void

  private updateState(partial: Partial<AudioState>) {
    this.state = { ...this.state, ...partial }
    this.onStateChange?.(this.state)
  }

  public getState(): AudioState {
    return this.state
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()

      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
    }
    return this.audioContext
  }

  public async loadAudioFile(file: File): Promise<boolean> {
    try {
      this.updateState({ error: null, isLoaded: false, isLoading: true })
      const ctx = this.getAudioContext()
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {})
      }
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      this.stems = [{ name: file.name, buffer: audioBuffer }]
      this.updateState({
        isLoaded: true,
        isLoading: false,
        duration: audioBuffer.duration,
        stemsLoaded: 1,
      })
      console.log(`✓ Audio cargado: ${audioBuffer.duration.toFixed(2)}s (${file.name})`)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      this.updateState({ isLoaded: false, isLoading: false, error: `Error loading: ${msg}` })
      return false
    }
  }

  public async loadAudioFromUrl(url: string): Promise<boolean> {
    try {
      this.updateState({ error: null, isLoaded: false, isLoading: true })
      const ctx = this.getAudioContext()
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {})
      }
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      const name = url.split('/').pop() || 'audio'
      this.stems = [{ name, buffer: audioBuffer }]

      this.updateState({
        isLoaded: true,
        isLoading: false,
        duration: audioBuffer.duration,
        stemsLoaded: 1,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      this.updateState({ isLoaded: false, isLoading: false, error: `Error loading URL: ${msg}` })
      return false
    }
  }

  public async loadStemsFromUrls(urls: string[]): Promise<boolean> {
    if (urls.length === 0) return false
    try {
      this.updateState({ error: null, isLoaded: false, isLoading: true, stemsLoaded: 0 })
      const ctx = this.getAudioContext()
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {})
      }
      const newStems: AudioStem[] = []
      let maxDuration = 0
      let loadedCount = 0

      const promises = urls.map(async (url) => {
        try {
          const response = await fetch(url)
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
          const name = url.split('/').pop() || 'stem'
          newStems.push({ name, buffer: audioBuffer })
          maxDuration = Math.max(maxDuration, audioBuffer.duration)
          loadedCount++
          this.updateState({ stemsLoaded: loadedCount })
        } catch (err) {
          console.warn(`⚠ No se pudo cargar stem desde URL: ${url}`, err)
        }
      })

      await Promise.all(promises)
      if (newStems.length === 0) throw new Error('Could not load any stem')

      this.stems = newStems
      this.updateState({
        isLoaded: true,
        isLoading: false,
        duration: maxDuration,
        stemsLoaded: newStems.length,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      this.updateState({ isLoaded: false, isLoading: false, error: `Error iterating URLs: ${msg}` })
      return false
    }
  }

  public async loadAudioStems(files: File[]): Promise<boolean> {
    if (files.length === 0) return false
    try {
      this.updateState({ error: null, isLoaded: false, isLoading: true, stemsLoaded: 0 })
      const ctx = this.getAudioContext()
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {})
      }
      const newStems: AudioStem[] = []
      let maxDuration = 0
      let loadedCount = 0

      const promises = files.map(async (file) => {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
          newStems.push({ name: file.name, buffer: audioBuffer })
          maxDuration = Math.max(maxDuration, audioBuffer.duration)
          loadedCount++
          this.updateState({ stemsLoaded: loadedCount })
        } catch (err) {
          console.warn(`⚠ No se pudo cargar stem: ${file.name}`, err)
        }
      })

      await Promise.all(promises)
      if (newStems.length === 0) throw new Error('Could not load any local stem')

      this.stems = newStems
      this.updateState({
        isLoaded: true,
        isLoading: false,
        duration: maxDuration,
        stemsLoaded: newStems.length,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      this.updateState({ isLoaded: false, isLoading: false, error: msg })
      return false
    }
  }

  public play(fromTime = 0): boolean {
    if (!this.audioContext || !this.masterGain || this.stems.length === 0) return false
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch((err) => console.error('Error resuming AudioContext:', err))
    }

    this.stopSources()

    const newSourceNodes: AudioBufferSourceNode[] = []
    for (const stem of this.stems) {
      const sourceNode = this.audioContext.createBufferSource()
      sourceNode.buffer = stem.buffer
      sourceNode.connect(this.masterGain)
      newSourceNodes.push(sourceNode)
    }

    this.sourceNodes = newSourceNodes
    this.startTime = this.audioContext.currentTime

    for (const sourceNode of newSourceNodes) {
      sourceNode.start(0, fromTime)
    }

    this.playing = true
    this.pausedAt = fromTime
    this.updateState({ isPlaying: true })
    return true
  }

  private stopSources(): void {
    for (const sourceNode of this.sourceNodes) {
      try {
        sourceNode.stop()
      } catch {
        // Ignorar
      }
    }
    this.sourceNodes = []
  }

  public async pause(): Promise<void> {
    if (!this.audioContext || !this.playing) return
    this.pausedAt = this.getCurrentTime()
    await this.audioContext.suspend()
    this.playing = false
    this.updateState({ isPlaying: false })
  }

  public async resume(): Promise<void> {
    if (!this.audioContext || this.playing) return
    await this.audioContext.resume()
    this.startTime = this.audioContext.currentTime - this.pausedAt
    this.playing = true
    this.updateState({ isPlaying: true })
  }

  public stop(): void {
    this.stopSources()
    this.pausedAt = 0
    this.startTime = 0
    this.playing = false
    this.updateState({ isPlaying: false })
  }

  public getCurrentTime(): number {
    if (!this.audioContext) return 0
    if (!this.playing) return this.pausedAt

    const elapsed = this.audioContext.currentTime - this.startTime
    const offset = this.calibrationOffsetMs / 1000
    return elapsed + offset
  }

  public setCalibrationOffset(offsetMs: number): void {
    this.calibrationOffsetMs = offsetMs
  }

  public getCalibrationOffset(): number {
    return this.calibrationOffsetMs
  }

  public setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  public cleanup(): void {
    this.stop()
    this.stems = []
    // Si estaba suspendido por pausa, lo reanudamos para evitar bloqueos
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {})
    }
    this.updateState({
      isLoaded: false,
      isPlaying: false,
      isLoading: false,
      duration: 0,
      error: null,
      stemsLoaded: 0,
    })
  }

  public unlock(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(e => console.warn('Could not unlock AudioContext:', e))
    }
  }

  public get isPlaying(): boolean {
    return this.playing
  }

  public get isLoaded(): boolean {
    return this.state.isLoaded
  }
}
