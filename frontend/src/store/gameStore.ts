export type DifficultyLevel = 1 | 2 | 3 | 4

export type CatGender = 'male' | 'female'
export type CatPersonality = 'homebody' | 'lively' | 'mysterious' | 'sleepy'

export interface CatProfile {
  name: string
  appearance: number
  gender: CatGender
  personality: CatPersonality
}

export interface AdaptiveDifficultyState {
  current: DifficultyLevel
  base: DifficultyLevel
  levelHistory: number[]
}

export interface CompletedLevelRecord {
  accuracy: number
  completedAt: string
}

export interface WordHistoryRecord {
  correct: number
  wrong: number
  lastSeen: string
  mastered?: boolean
}

export interface GameSettings {
  musicEnabled: boolean
  soundEnabled: boolean
}

export interface GameState {
  version: string
  sessionId: string
  cat: CatProfile
  onboardingDone: boolean
  difficulty: DifficultyLevel
  adaptiveDifficulty: AdaptiveDifficultyState
  currentChapter: number
  currentLevel: number
  completedLevels: Record<string, CompletedLevelRecord>
  unlockedFurniture: string[]
  wordHistory: Record<string, WordHistoryRecord>
  storyProgress: Record<string, boolean>
  settings: GameSettings
}

export const STORAGE_KEY = 'wordpet_state'

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pendingState: GameState | null = null

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createDefaultState(): GameState {
  return {
    version: '1.3',
    sessionId: generateSessionId(),
    cat: {
      name: 'Momo',
      appearance: 1,
      gender: 'female',
      personality: 'homebody',
    },
    onboardingDone: false,
    difficulty: 1,
    adaptiveDifficulty: {
      current: 1,
      base: 1,
      levelHistory: [],
    },
    currentChapter: 1,
    currentLevel: 1,
    completedLevels: {},
    unlockedFurniture: [],
    wordHistory: {},
    storyProgress: {},
    settings: {
      musicEnabled: true,
      soundEnabled: true,
    },
  }
}

export function getGameState(): GameState {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as GameState
    if (!parsed) return createDefaultState()

    const completedLevels = parsed.completedLevels ?? {}
    let maxChapter = 1
    let maxLevel = 1

    for (const key of Object.keys(completedLevels)) {
      const [ch, lv] = key.split('-').map(Number)
      if (ch > maxChapter || (ch === maxChapter && lv >= maxLevel)) {
        maxChapter = ch
        maxLevel = lv
      }
    }

    if (maxChapter > parsed.currentChapter ||
        (maxChapter === parsed.currentChapter && maxLevel >= parsed.currentLevel)) {
      if (maxLevel >= 4) {
        parsed.currentChapter = Math.min(maxChapter + 1, 5)
        parsed.currentLevel = 1
      } else {
        parsed.currentChapter = maxChapter
        parsed.currentLevel = maxLevel + 1
      }
    }

    return parsed
  } catch {
    return createDefaultState()
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return

  pendingState = state

  if (saveTimer) {
    clearTimeout(saveTimer)
  }

  saveTimer = setTimeout(() => {
    if (!pendingState) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingState))
    pendingState = null
    saveTimer = null
  }, 300)
}
