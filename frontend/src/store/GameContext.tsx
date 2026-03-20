import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { getGameState, saveGameState, type GameState } from './gameStore'
import { saveGameStateToServer, loadGameStateFromServer, getCachedUser } from './authStore'

interface GameContextValue {
  gameState: GameState
  updateGameState: (updater: (prev: GameState) => GameState) => void
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncAt: string | null
  syncNow: () => Promise<void>
  loadFromCloud: () => Promise<boolean>
}

const GameContext = createContext<GameContextValue | null>(null)

// Debounced cloud sync timer
let cloudSyncTimer: ReturnType<typeof setTimeout> | null = null

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(getGameState)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

  // Sync to cloud (debounced, only if logged in)
  const syncToCloud = useCallback(async (state: GameState) => {
    const user = getCachedUser()
    if (!user) return // Not logged in, skip cloud sync

    if (cloudSyncTimer) {
      clearTimeout(cloudSyncTimer)
    }

    cloudSyncTimer = setTimeout(async () => {
      setSyncStatus('syncing')
      try {
        const success = await saveGameStateToServer(state)
        if (success) {
          setSyncStatus('synced')
          setLastSyncAt(new Date().toISOString())
        } else {
          setSyncStatus('error')
        }
      } catch {
        setSyncStatus('error')
      }
    }, 1500) // 1.5s debounce for cloud sync (longer than localStorage)
  }, [])

  const updateGameState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev)
      // Always save to localStorage (immediate, debounced 300ms in gameStore)
      saveGameState(next)
      // Also sync to cloud (debounced 1.5s)
      void syncToCloud(next)
      return next
    })
  }, [syncToCloud])

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    const user = getCachedUser()
    if (!user) return

    setSyncStatus('syncing')
    try {
      const success = await saveGameStateToServer(gameStateRef.current)
      if (success) {
        setSyncStatus('synced')
        setLastSyncAt(new Date().toISOString())
      } else {
        setSyncStatus('error')
      }
    } catch {
      setSyncStatus('error')
    }
  }, [])

  // Load from cloud and merge (returns true if cloud data was newer)
  const loadFromCloud = useCallback(async (): Promise<boolean> => {
    const user = getCachedUser()
    if (!user) return false

    setSyncStatus('syncing')
    try {
      const cloudState = await loadGameStateFromServer() as GameState | null
      if (!cloudState) {
        // No cloud data — push local to cloud
        await saveGameStateToServer(gameStateRef.current)
        setSyncStatus('synced')
        setLastSyncAt(new Date().toISOString())
        return false
      }

      // Merge strategy: compare by completedLevels count (more progress = newer)
      const localLevels = Object.keys(gameStateRef.current.completedLevels).length
      const cloudLevels = Object.keys(cloudState.completedLevels || {}).length

      if (cloudLevels > localLevels) {
        // Cloud has more progress — use cloud state
        setGameState(cloudState)
        saveGameState(cloudState)
        setSyncStatus('synced')
        setLastSyncAt(new Date().toISOString())
        return true
      } else if (localLevels > cloudLevels) {
        // Local has more progress — push to cloud
        await saveGameStateToServer(gameStateRef.current)
        setSyncStatus('synced')
        setLastSyncAt(new Date().toISOString())
        return false
      } else {
        // Same number of levels — merge word history (take max counts)
        const mergedWordHistory = { ...cloudState.wordHistory }
        for (const [word, record] of Object.entries(gameStateRef.current.wordHistory)) {
          const existing = mergedWordHistory[word]
          if (!existing || record.correct + record.wrong > existing.correct + existing.wrong) {
            mergedWordHistory[word] = record
          }
        }

        const mergedState: GameState = {
          ...gameStateRef.current,
          wordHistory: mergedWordHistory,
          unlockedFurniture: Array.from(new Set([
            ...gameStateRef.current.unlockedFurniture,
            ...(cloudState.unlockedFurniture || []),
          ])),
        }

        setGameState(mergedState)
        saveGameState(mergedState)
        await saveGameStateToServer(mergedState)
        setSyncStatus('synced')
        setLastSyncAt(new Date().toISOString())
        return false
      }
    } catch {
      setSyncStatus('error')
      return false
    }
  }, [])

  // On mount, try to sync with cloud if logged in
  useEffect(() => {
    const user = getCachedUser()
    if (user) {
      void loadFromCloud()
    }
  }, [loadFromCloud])

  const value = useMemo<GameContextValue>(
    () => ({
      gameState,
      updateGameState,
      syncStatus,
      lastSyncAt,
      syncNow,
      loadFromCloud,
    }),
    [gameState, updateGameState, syncStatus, lastSyncAt, syncNow, loadFromCloud],
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
