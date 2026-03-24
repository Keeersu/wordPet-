export type DifficultyLevel = 1 | 2 | 3 | 4

export type CatGender = 'male' | 'female'
export type CatPersonality = 'homebody' | 'lively' | 'mysterious' | 'sleepy'

export type CatFurColor = 'orange' | 'white' | 'black' | 'gray' | 'calico' | 'tuxedo' | 'cream' | 'siamese'
export type CatAccessory = 'none' | 'ribbon' | 'scarf' | 'beret' | 'glasses' | 'collar'

export interface CatGenerationTags {
  furColor: CatFurColor
  accessory: CatAccessory
}

export interface GeneratedAppearance {
  /** 基本形象照（去背景后，用于显示） */
  imageUrl: string
  /** 原始 CDN URL（未去背景，用于图生图的 image_urls 参考） */
  rawImageUrl?: string
  tags: CatGenerationTags
  generatedAt: string
  /** 各房间的全身动作图，key 为 chapterId (1-5) */
  roomImages?: Record<number, string>
}

export interface CatProfile {
  name: string
  appearance: number
  gender: CatGender
  personality: CatPersonality
  generatedAppearance?: GeneratedAppearance
}

function isTransientImageUrl(url?: string): boolean {
  return typeof url === 'string' && url.startsWith('blob:')
}

function normalizeGeneratedAppearance(generatedAppearance?: GeneratedAppearance): GeneratedAppearance | undefined {
  if (!generatedAppearance) return generatedAppearance

  const normalizedImageUrl =
    isTransientImageUrl(generatedAppearance.imageUrl) && generatedAppearance.rawImageUrl
      ? generatedAppearance.rawImageUrl
      : generatedAppearance.imageUrl

  const filteredRoomImages = Object.entries(generatedAppearance.roomImages ?? {}).filter(([, url]) => !isTransientImageUrl(url))
  const normalizedRoomImages = filteredRoomImages.length > 0
    ? Object.fromEntries(filteredRoomImages) as Record<number, string>
    : undefined

  return {
    ...generatedAppearance,
    imageUrl: normalizedImageUrl,
    roomImages: normalizedRoomImages,
  }
}

export function getCatImageSrc(cat: CatProfile): string {
  if (cat.generatedAppearance?.imageUrl) {
    return cat.generatedAppearance.imageUrl
  }
  return `/assets/cat/appearance_${cat.appearance}_${cat.personality}.png`
}

/**
 * 获取猫咪在指定房间的动作图；若尚未生成则回退到基本形象照。
 */
export function getCatRoomImageSrc(cat: CatProfile, chapterId: number): string {
  const roomImg = cat.generatedAppearance?.roomImages?.[chapterId]
  if (roomImg) return roomImg
  return getCatImageSrc(cat)
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
  ttsEnabled: boolean
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
      ttsEnabled: true,
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

    // 迁移：旧版本可能缺少 ttsEnabled，默认为 true
    if (parsed.settings && parsed.settings.ttsEnabled === undefined) {
      parsed.settings.ttsEnabled = true
    }

    parsed.cat = {
      ...parsed.cat,
      generatedAppearance: normalizeGeneratedAppearance(parsed.cat?.generatedAppearance),
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
