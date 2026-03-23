import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/GameContext'
import type { DifficultyLevel } from '@/store/gameStore'

type LevelOption = {
  id: 1 | 2 | 3 | 4
  emoji: string
  title: string
  subtitle: string
}

const LEVEL_OPTIONS: LevelOption[] = [
  { id: 1, emoji: '🐾', title: '纯新手', subtitle: '点餐靠手指' },
  { id: 2, emoji: '🐾🐾', title: '略知一二', subtitle: '开口还是怕' },
  { id: 3, emoji: '🐾🐾🐾', title: '勉强应付', subtitle: '旅游基本够用' },
  { id: 4, emoji: '🐾🐾🐾🐾', title: '还不错哦', subtitle: '想再提升' },
]

function OnboardingLevel() {
  const navigate = useNavigate()
  const { updateGameState } = useGameStore()
  const [selectedLevel, setSelectedLevel] = useState<LevelOption['id']>(1)

  const handleStart = () => {
    const level = selectedLevel as DifficultyLevel
    updateGameState((prev) => ({
      ...prev,
      difficulty: level,
      adaptiveDifficulty: {
        current: level,
        base: level,
        levelHistory: [],
      },
    }))
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] pt-[52px] px-5 pb-5">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-bold text-[#5D4037]">你的英语水平～</h1>
          <p className="mt-1 text-sm text-[#8D6E63]">选一个最符合你的描述</p>
        </div>

        <div className="flex flex-col gap-3">
          {LEVEL_OPTIONS.map((option) => {
            const isSelected = selectedLevel === option.id
            return (
              <button
                key={option.id}
                onClick={() => setSelectedLevel(option.id)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left shadow-[0_4px_0_0_#E0D5C0]"
                style={{
                  border: isSelected ? '2px solid #FFB840' : '2px solid transparent',
                  backgroundColor: isSelected ? '#FFF3DC' : '#FFFFFF',
                }}
              >
                <span className="text-2xl leading-none">{option.emoji}</span>
                <span className="flex flex-col">
                  <span className="text-base font-bold text-[#5D4037]">{option.title}</span>
                  <span className="text-sm text-[#8D6E63]">{option.subtitle}</span>
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleStart}
          className="mt-8 h-[52px] w-full rounded-[26px] bg-[#FFB840] text-[17px] font-bold text-[#3D1F00] shadow-[0_4px_0_0_#A06800] active:translate-y-[2px] active:shadow-[0_2px_0_0_#A06800]"
        >
          开始我的冒险 →
        </button>
      </div>
    </div>
  )
}

export default OnboardingLevel
