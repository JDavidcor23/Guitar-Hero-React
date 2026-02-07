import { useState } from 'react'
import { Gameplay } from './features/gameplay'
import { StartScreen } from './features/start-screen'

function App() {
  const [showStartScreen, setShowStartScreen] = useState(true)

  if (showStartScreen) {
    return <StartScreen onComplete={() => setShowStartScreen(false)} />
  }

  return <Gameplay />
}

export default App
