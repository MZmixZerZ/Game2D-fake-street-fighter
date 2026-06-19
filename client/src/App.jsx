import React, { useState } from 'react'
import MainMenu from './screens/MainMenu'
import CharacterSelect from './screens/CharacterSelect'
import GameCanvas from './components/GameCanvas'
import ResultScreen from './screens/ResultScreen'

export default function App() {
  const [screen, setScreen]       = useState('menu')
  const [gameConfig, setGameConfig] = useState({ mode: 'pvp', p1Character: 'samuraiMack', p2Character: 'kenji' })
  const [result, setResult]       = useState(null)
  const [gameKey, setGameKey]     = useState(0)

  const goMenu   = () => { setScreen('menu'); setResult(null) }
  const goSelect = (mode) => { setGameConfig(c => ({ ...c, mode })); setScreen('select') }
  const startGame = (cfg) => { setGameConfig(cfg); setScreen('game'); setResult(null); setGameKey(k => k + 1) }
  const endGame   = (r) => { setResult(r); setScreen('result') }
  const rematch   = () => { setScreen('game'); setResult(null); setGameKey(k => k + 1) }

  return (
    <div className="app">
      {screen === 'menu'   && <MainMenu onStart={goSelect} />}
      {screen === 'select' && <CharacterSelect mode={gameConfig.mode} onStart={startGame} onBack={goMenu} />}
      {screen === 'game'   && <GameCanvas key={gameKey} config={gameConfig} onGameEnd={endGame} />}
      {screen === 'result' && <ResultScreen result={result} onRestart={rematch} onMenu={goMenu} />}
    </div>
  )
}
