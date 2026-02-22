import React from 'react'
import { useCassettePlayer, BAR_HEIGHTS, formatTime } from './hooks/useCassettePlayer.hook'
import { PlayIcon, PauseIcon } from './CassetteIcons'
import './CassettePlayer.css'

// ─── Types ──────────────────────────────────────────────────

export interface CassettePlayerProps {
  title: string
  artist: string
  coverImage?: string
  audioSrc?: string | string[]
  icon1?: React.ReactNode
  icon2?: React.ReactNode
  icon3?: React.ReactNode
  brandLabel?: string
  onIconClick?: (index: 1 | 2 | 3) => void
  onEnded?: () => void
  startTime?: number
}

// ─── Component ──────────────────────────────────────────────

/**
 * Cassette tape player with retro-styled UI.
 *
 * Purely presentational — all playback logic lives in useCassettePlayer.
 */
export const CassettePlayer: React.FC<CassettePlayerProps> = ({
  title,
  artist,
  coverImage,
  audioSrc,
  onIconClick,
  onEnded,
  startTime = 30,
}) => {
  const {
    audioRefs,
    progressRef,
    playing,
    currentTime,
    duration,
    expanded,
    sources,
    progress,
    togglePlay,
    toggleExpanded,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    handleProgressClick,
    getBarStyle,
  } = useCassettePlayer({ audioSrc, startTime, onEnded })

  return (
    <>
      {/* 
        Render invisible audio elements for each source.
        - For single-track songs, this renders one <audio> tag.
        - For multi-stem songs (e.g., separate tracks for guitar, bass, drums), 
          it renders multiple tags that are synced by the hook.
        - The ref stores the DOM elements so the hook can call .play(), .pause(), 
          and sync their .currentTime.
      */}
      {sources.map((sourceUrl, index) => (
        <audio
          key={index}
          ref={(audioElement) => {
            if (audioElement) {
              audioRefs.current[index] = audioElement
            }
          }}
          src={sourceUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="auto"
        />
      ))}

      <div className="cp-wrapper">
        {/* ─── Cassette body ─── */}
        <div className="cp-cassette">
          {/* Corner screws */}
          <div className="cp-screw cp-screw-tl" />
          <div className="cp-screw cp-screw-tr" />
          <div className="cp-screw cp-screw-bl" />
          <div className="cp-screw cp-screw-br" />

          {/* Label with song info */}
          <div className="cp-label">
            <div className="cp-label-letter">A</div>
            <div className="cp-label-content">
              <div className="cp-label-line" />
              <div className="cp-label-title">{title}</div>
              <div className="cp-label-artist">{artist}</div>
              <div className="cp-label-line" />
            </div>
          </div>

          {/* Gold tape section */}
          <div className="cp-tape-section">
            <div className="cp-inner-window">
              {/* Left reel */}
              <div className={`cp-reel${playing ? ' cp-spinning' : ''}`}>
                <div className="cp-reel-lines">
                  <div className="cp-reel-line" />
                  <div className="cp-reel-line" />
                  <div className="cp-reel-line" />
                  <div className="cp-reel-line" />
                </div>
              </div>

              {/* Center: album cover */}
              <div className="cp-center">
                {coverImage ? (
                  <img className="cp-cover" src={coverImage} alt={title} />
                ) : (
                  <div className="cp-cover cp-cover--placeholder">🎵</div>
                )}
              </div>

              {/* Right reel */}
              <div className={`cp-reel${playing ? ' cp-spinning' : ''}`}>
                <div className="cp-reel-lines">
                  <div className="cp-reel-line" />
                  <div className="cp-reel-line" />
                  <div className="cp-reel-line" />
                  <div className="cp-reel-line" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom dots */}
          <div className="cp-bottom">
            <div className="cp-dot" />
            <div className="cp-dot" />
            <div className="cp-center-screw" />
            <div className="cp-dot" />
            <div className="cp-dot" />
          </div>
        </div>

        {/* ─── Toggle tab ─── */}
        <button className="cp-toggle-tab" onClick={toggleExpanded}>
          {expanded ? 'hide' : 'listen · select'}
          <span className={`cp-toggle-arrow${expanded ? ' cp-open' : ''}`}>▼</span>
        </button>

        {/* ─── Playback controls (collapsible) ─── */}
        <div className={`cp-collapse${expanded ? ' cp-open' : ''}`}>
          <div className="cp-controls">
            <div className="cp-time-row">
              <button className="cp-play-btn" onClick={togglePlay}>
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <div
                className="cp-progress-wrap"
                ref={progressRef}
                onClick={handleProgressClick}
              >
                <div
                  className="cp-progress-fill"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="cp-time">
                {formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}
              </div>
            </div>

            <div className="cp-waveform">
              {BAR_HEIGHTS.map((height, index) => (
                <div
                  key={index}
                  className="cp-bar"
                  style={getBarStyle(height, index)}
                />
              ))}
            </div>

            {onIconClick && (
              <button
                className="cp-select-btn"
                onClick={() => onIconClick(1)}
              >
                SELECT
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Backward-compat export
export const CASSETTEPLAYER = CassettePlayer
