import React from 'react'
import './DebugOverlay.css'

interface DebugOverlayProps {
  gameState: string
  songName: string | undefined
  isAudioLoaded: boolean
  isAudioLoading: boolean
  stemsLoaded: number
  audioError: string | null
  gameTime: number
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  gameState,
  songName,
  isAudioLoaded,
  isAudioLoading,
  stemsLoaded,
  audioError,
  gameTime
}) => {
  return (
    <div className="debug-overlay">
      <h3>🛠️ Debug Mode</h3>
      <div className="debug-item"><strong>State:</strong> {gameState}</div>
      <div className="debug-item"><strong>Song:</strong> {songName || 'None'}</div>
      <div className="debug-item"><strong>Audio Loaded:</strong> {isAudioLoaded ? '✅ Yes' : '❌ No'}</div>
      <div className="debug-item"><strong>Loading:</strong> {isAudioLoading ? '🔄 Yes' : 'No'}</div>
      <div className="debug-item"><strong>Stems:</strong> {stemsLoaded}</div>
      <div className="debug-item"><strong>Time:</strong> {gameTime.toFixed(3)}s</div>
      {audioError && (
        <div className="debug-item error"><strong>Error:</strong> {audioError}</div>
      )}
      <div className="debug-hint">Press <b>D</b> to toggle</div>
    </div>
  )
}
