import { useState } from 'react'
import { useGamepadNavigation } from '../../../../hooks/useGamepadNavigation'

interface PauseOverlayProps {
  onResume: () => void
  onControls: () => void
  onRestart: () => void
  onExit: () => void
}

export const PauseOverlay = ({
  onResume,
  onControls,
  onRestart,
  onExit
}: PauseOverlayProps) => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonsCount = 4

  useGamepadNavigation({
    enabled: true,
    onUp: () => setFocusedIndex(prev => Math.max(0, prev - 1)),
    onDown: () => setFocusedIndex(prev => Math.min(buttonsCount - 1, prev + 1)),
    onConfirm: () => {
      switch (focusedIndex) {
        case 0:
          onResume()
          break
        case 1:
          onControls()
          break
        case 2:
          onRestart()
          break
        case 3:
          onExit()
          break
      }
    }
  })

  return (
    <>
      <h1 className="game-pause-title">PAUSA</h1>
      <div className="game-pause-buttons">
        <button
          className={`game-pause-btn game-pause-btn--resume ${focusedIndex === 0 ? 'game-pause-btn--focused' : ''}`}
          onClick={onResume}
        >
          ▶ CONTINUAR
        </button>
        <button
          className={`game-pause-btn game-pause-btn--controls ${focusedIndex === 1 ? 'game-pause-btn--focused' : ''}`}
          onClick={onControls}
        >
          ⚙ CONTROLES
        </button>
        <button
          className={`game-pause-btn game-pause-btn--restart ${focusedIndex === 2 ? 'game-pause-btn--focused' : ''}`}
          onClick={onRestart}
        >
          ↻ REPETIR CANCIÓN
        </button>
        <button
          className={`game-pause-btn game-pause-btn--exit ${focusedIndex === 3 ? 'game-pause-btn--focused' : ''}`}
          onClick={onExit}
        >
          ✕ SALIR
        </button>
      </div>
    </>
  )
}
