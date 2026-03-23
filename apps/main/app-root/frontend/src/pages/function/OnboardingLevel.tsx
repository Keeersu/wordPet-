import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/GameContext'
import type { DifficultyLevel } from '@/store/gameStore'
import { AudioToggles } from '@/components/function/AudioToggles'

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
    <div className="onboarding-level-page">
      <AudioToggles className="onboarding-page__audio" />
      <div className="onboarding-level-header">
        <h1 className="onboarding-level-header__title">你的英语水平～</h1>
        <p className="onboarding-level-header__subtitle">选一个最符合你的描述</p>
      </div>

      <div className="onboarding-level-list" role="radiogroup" aria-label="选择英语水平">
        {LEVEL_OPTIONS.map((option) => {
          const isSelected = selectedLevel === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelectedLevel(option.id)}
              className={`onboarding-level-card${isSelected ? ' onboarding-level-card--selected' : ''}`}
            >
              <span className="onboarding-level-card__emoji" aria-hidden="true">{option.emoji}</span>
              <span>
                <span className="onboarding-level-card__title">{option.title}</span>
                <span className="onboarding-level-card__subtitle">{option.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleStart}
        className="onboarding-level-start"
      >
        开始我的冒险
      </button>
    </div>
  )
}

export default OnboardingLevel
