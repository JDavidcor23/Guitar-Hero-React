import type {
  HitResult,
  LaneFlashState,
  GameStats,
  LastHitInfo,
  SongData,
  GameNote,
} from '../types/GuitarGame.types'
import {
  GAME_CONFIG,
  HIT_WINDOWS,
  FEEDBACK_DURATION,
  SPAWN_AHEAD_TIME,
  SPAWN_Y,
  SUSTAIN_CONFIG,
  SUSTAIN_SCORING,
} from '../constants/game.constants'
import { drawHighway } from '../renderers/highwayRenderer'
import { drawNote, drawHitZone, drawSustainTail } from '../renderers/noteRenderer'
import { drawHUD } from '../renderers/hudRenderer'
import { getMultiplier, calculatePoints } from '../utils/scoring'

export interface GameplayEngineConfig {
  canvas: HTMLCanvasElement
  song: SongData
  onGameEnd: (stats: GameStats) => void
  onStatsChange?: (stats: GameStats) => void
  getAudioTime?: () => number
  calibrationOffset?: number
}

export class GameplayEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private song: SongData
  private onGameEnd: (stats: GameStats) => void
  private onStatsChange?: (stats: GameStats) => void
  private getAudioTime?: () => number
  private calibrationOffset: number

  private gameNotes: GameNote[] = []
  private nextNoteIndex = 0
  
  private stats: GameStats = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    goods: 0,
    oks: 0,
    misses: 0,
    sustainsHit: 0,
    sustainsComplete: 0,
    sustainsDropped: 0,
  }
  
  private lastHit: LastHitInfo = {
    result: null,
    points: 0,
    expireTime: 0,
  }

  private laneFlashes: LaneFlashState = {}
  private activeSustains = new Map<number, number>()

  private gameTime = 0
  private gameStartTimestamp: number | null = null
  private pausedGameTime = 0
  private isPaused = false
  private animationId: number | null = null
  private lastFrameTime = 0
  private isDestroyed = false

  private noteSpeed: number

  constructor(config: GameplayEngineConfig) {
    this.canvas = config.canvas
    const context = this.canvas.getContext('2d')
    if (!context) throw new Error('Could not get 2D context from canvas')
    this.ctx = context

    this.song = config.song
    this.onGameEnd = config.onGameEnd
    this.onStatsChange = config.onStatsChange
    this.getAudioTime = config.getAudioTime
    this.calibrationOffset = config.calibrationOffset || 0

    this.noteSpeed = (GAME_CONFIG.hitZoneY - SPAWN_Y) / SPAWN_AHEAD_TIME

    this.initNotes()
  }

  private initNotes() {
    this.gameNotes = this.song.notes.map((note) => ({
      segundo: note.segundo,
      carril: note.carril,
      y: SPAWN_Y,
      spawned: false,
      hit: false,
      missed: false,
      duracion: note.duracion || 0,
    }))
  }

  public start() {
    this.isPaused = false
    this.lastFrameTime = performance.now()
    this.loop(this.lastFrameTime)
  }

  public pause() {
    this.isPaused = true
    this.pausedGameTime = this.gameTime
    this.gameStartTimestamp = null
  }

  public resume() {
    this.isPaused = false
    this.lastFrameTime = performance.now()
    if (this.animationId === null) {
      this.loop(this.lastFrameTime)
    }
  }

  public setPaused(paused: boolean) {
    if (paused) {
      this.pause()
    } else {
      this.resume()
    }
  }

  public destroy() {
    this.isDestroyed = true
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public handleButtonDown(lane: number) {
    if (this.isPaused || this.isDestroyed) return

    const currentTime = performance.now()
    this.laneFlashes[lane] = currentTime + FEEDBACK_DURATION.flash

    let closestNote: GameNote | null = null
    let closestDistance = Infinity

    for (const note of this.gameNotes) {
      if (!note.spawned || note.hit || note.missed || note.carril !== lane) continue
      const distance = Math.abs(note.y - GAME_CONFIG.hitZoneY)
      if (distance < closestDistance && distance <= HIT_WINDOWS.ok) {
        closestNote = note
        closestDistance = distance
      }
    }

    let result: HitResult = null

    if (closestNote) {
      if (closestDistance <= HIT_WINDOWS.perfect) {
        result = 'perfect'
        this.stats.perfects++
      } else if (closestDistance <= HIT_WINDOWS.good) {
        result = 'good'
        this.stats.goods++
      } else if (closestDistance <= HIT_WINDOWS.ok) {
        result = 'ok'
        this.stats.oks++
      }

      this.stats.combo++
      const points = calculatePoints(result, this.stats.combo)
      this.stats.score += points

      if (this.stats.combo > this.stats.maxCombo) {
        this.stats.maxCombo = this.stats.combo
      }

      closestNote.hit = true

      if (closestNote.duracion > 0) {
        closestNote.sustainActive = true
        this.activeSustains.set(lane, this.gameNotes.indexOf(closestNote))
        this.stats.sustainsHit++
      }

      this.lastHit = { result, points, expireTime: currentTime + FEEDBACK_DURATION.text }
      this.onStatsChange?.(this.stats)
    } else {
      result = 'miss'
      this.stats.combo = 0
      this.stats.misses++
      this.lastHit = { result, points: 0, expireTime: currentTime + FEEDBACK_DURATION.text }
      this.onStatsChange?.(this.stats)
    }
  }

  public handleButtonUp(lane: number) {
    if (this.isPaused || this.isDestroyed) return

    const noteIndex = this.activeSustains.get(lane)
    if (noteIndex !== undefined) {
      const note = this.gameNotes[noteIndex]
      const expectedEnd = note.segundo + note.duracion

      if (this.gameTime >= expectedEnd) {
        note.sustainComplete = true
        note.sustainActive = false
        this.stats.sustainsComplete++
        const { multiplier } = getMultiplier(this.stats.combo)
        this.stats.score += SUSTAIN_SCORING.completionBonus * multiplier
      } else {
        note.sustainReleased = true
        note.sustainActive = false
        const heldPercent = (this.gameTime - note.segundo) / note.duracion
        if (heldPercent < SUSTAIN_SCORING.minHoldPercent) {
          this.stats.combo = 0
          this.stats.sustainsDropped++
        }
      }

      this.activeSustains.delete(lane)
      this.onStatsChange?.(this.stats)
    }
  }

  private loop = (currentTime: number) => {
    if (this.isDestroyed) return

    const deltaTime = this.lastFrameTime === 0 ? 0 : (currentTime - this.lastFrameTime) / 1000
    this.lastFrameTime = currentTime

    if (!this.isPaused) {
      this.updateGameTime(currentTime)

      if (this.gameTime >= this.song.metadata.duration) {
        for (const note of this.gameNotes) {
          if (note.spawned && !note.hit && !note.missed) {
            note.missed = true
            this.stats.misses++
          }
        }
        this.onGameEnd(this.stats)
        return
      }

      this.spawnNotes()
      this.updateNotes(deltaTime)
      this.updateSustains(deltaTime)
    }

    this.render(currentTime)

    this.animationId = requestAnimationFrame(this.loop)
  }

  private updateGameTime(currentTime: number) {
    if (this.getAudioTime) {
      const audioTime = this.getAudioTime()
      if (audioTime >= 0) {
        this.gameTime = audioTime + this.calibrationOffset / 1000
      } else {
        if (this.gameStartTimestamp === null) this.gameStartTimestamp = currentTime
        this.gameTime = this.pausedGameTime + (currentTime - this.gameStartTimestamp) / 1000
      }
    } else {
      if (this.gameStartTimestamp === null) this.gameStartTimestamp = currentTime
      this.gameTime = this.pausedGameTime + (currentTime - this.gameStartTimestamp) / 1000
    }
  }

  private spawnNotes() {
    while (this.nextNoteIndex < this.gameNotes.length) {
      const note = this.gameNotes[this.nextNoteIndex]
      if (note.segundo - SPAWN_AHEAD_TIME <= this.gameTime) {
        const timeUntilHit = note.segundo - this.gameTime
        note.y = GAME_CONFIG.hitZoneY - timeUntilHit * this.noteSpeed
        note.spawned = true
        this.nextNoteIndex++
      } else {
        break
      }
    }
  }

  private updateNotes(deltaTime: number) {
    for (const note of this.gameNotes) {
      if (!note.spawned || note.hit || note.missed) continue
      note.y += this.noteSpeed * deltaTime

      if (note.y > GAME_CONFIG.hitZoneY + GAME_CONFIG.noteRadius * 2) {
        note.missed = true
        this.stats.combo = 0
        this.stats.misses++
        this.lastHit = {
          result: 'miss',
          points: 0,
          expireTime: performance.now() + FEEDBACK_DURATION.text,
        }
        this.onStatsChange?.(this.stats)
      }
    }
  }

  private updateSustains(deltaTime: number) {
    for (const [lane, noteIndex] of this.activeSustains.entries()) {
      const note = this.gameNotes[noteIndex]
      const expectedEnd = note.segundo + note.duracion
      const { multiplier } = getMultiplier(this.stats.combo)
      
      const pointsThisFrame = Math.floor(SUSTAIN_SCORING.pointsPerSecond * deltaTime * multiplier)
      this.stats.score += pointsThisFrame

      if (this.gameTime >= expectedEnd) {
        note.sustainComplete = true
        note.sustainActive = false
        this.stats.sustainsComplete++
        this.stats.score += SUSTAIN_SCORING.completionBonus * multiplier
        this.activeSustains.delete(lane)
        this.onStatsChange?.(this.stats)
      }
    }
  }

  private render(currentTime: number) {
    drawHighway(this.ctx, this.canvas, this.gameTime)

    for (const note of this.gameNotes) {
      if (note.spawned && note.duracion > 0 && !note.missed && !note.sustainComplete && !note.sustainReleased) {
        const tailLength = Math.max(SUSTAIN_CONFIG.minVisualLength, note.duracion * this.noteSpeed)
        let headY = note.y
        let tailEndY = note.y - tailLength

        if (note.sustainActive) {
          headY = GAME_CONFIG.hitZoneY
          const elapsedInSustain = this.gameTime - note.segundo
          const consumedLength = elapsedInSustain * this.noteSpeed
          tailEndY = GAME_CONFIG.hitZoneY - tailLength + consumedLength
        }

        tailEndY = Math.max(SPAWN_Y, tailEndY)
        drawSustainTail(
          this.ctx,
          note.carril,
          headY,
          tailEndY,
          !!note.sustainActive,
          !!note.sustainComplete,
          !!note.sustainReleased
        )
      }
    }

    const sortedNotes = [...this.gameNotes].sort((a, b) => a.y - b.y)
    for (const note of sortedNotes) {
      if (note.spawned && !note.hit && !note.missed) {
        drawNote(this.ctx, note.carril, note.y)
      }
      if (note.sustainActive) {
        drawNote(this.ctx, note.carril, GAME_CONFIG.hitZoneY)
      }
    }

    drawHitZone(this.ctx, this.laneFlashes, currentTime)
    drawHUD(
      this.ctx,
      this.stats,
      this.lastHit,
      currentTime,
      this.gameTime,
      this.song.metadata.duration,
      this.song.metadata.songName,
      getMultiplier
    )
  }
}
