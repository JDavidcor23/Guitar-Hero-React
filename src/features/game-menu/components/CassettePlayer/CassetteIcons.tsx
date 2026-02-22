import React from 'react'

interface IconProps {
  width?: string | number
  height?: string | number
  className?: string
}

/** Play icon SVG component (Triangle) */
export const PlayIcon: React.FC<IconProps> = ({ width = 15, height = 15, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <polygon points="6,4 20,12 6,20" />
  </svg>
)

/** Pause icon SVG component (Two vertical bars) */
export const PauseIcon: React.FC<IconProps> = ({ width = 15, height = 15, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="5" y="4" width="4" height="16" rx="1" />
    <rect x="15" y="4" width="4" height="16" rx="1" />
  </svg>
)
