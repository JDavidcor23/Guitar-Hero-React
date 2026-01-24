import { useGuitarGame } from './hooks/useGuitarGame.hook'
import './GuitarGame.css'

export const GuitarGame = () => {
  const { canvasRef, canvasWidth, canvasHeight } = useGuitarGame()

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="game-canvas"
      />
    </div>
  )
}
