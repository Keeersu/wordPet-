import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getGameState, saveGameState, type GameState } from './gameStore'

interface GameContextValue {
  gameState: GameState
  updateGameState: (updater: (prev: GameState) => GameState) => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(getGameState)

  const updateGameState = (updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev)
      saveGameState(next)
      return next
    })
  }

  const value = useMemo<GameContextValue>(
    () => ({
      gameState,
      updateGameState,
    }),
    [gameState],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameStore(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameStore must be used within a GameProvider')
  }
  return context
}
