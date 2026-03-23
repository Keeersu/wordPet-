/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 应用设置页面，包含英语水平调整、音乐/音效开关、账户管理。
 * Style referenceFiles: styles/settings.css, styles/components.css
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 修改英语水平（4级难度选择）
 * - 切换背景音乐开关
 * - 切换音效开关
 * - 导航：返回 (Header Back)
 *
 * ## Page Layout
 * 顶部导航（返回按钮 + 标题），分组设置项（学习设置 + 音频设置）
 * </page-design>
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'
import type { DifficultyLevel } from '@/store/gameStore'

const LEVEL_OPTIONS: Array<{
  id: DifficultyLevel
  emoji: string
  title: string
  subtitle: string
}> = [
  { id: 1, emoji: '🐾', title: '纯新手', subtitle: '点餐靠手指' },
  { id: 2, emoji: '🐾🐾', title: '略知一二', subtitle: '开口还是怕' },
  { id: 3, emoji: '🐾🐾🐾', title: '勉强应付', subtitle: '旅游基本够用' },
  { id: 4, emoji: '🐾🐾🐾🐾', title: '还不错哦', subtitle: '想再提升' },
]

function Settings() {
  const navigate = useNavigate()
  const { gameState, updateGameState } = useGameStore()
  const [showLevelPicker, setShowLevelPicker] = useState(false)

  const currentLevel = LEVEL_OPTIONS.find((l) => l.id === gameState.difficulty)

  const handleLevelChange = (level: DifficultyLevel) => {
    updateGameState((prev) => ({
      ...prev,
      difficulty: level,
      adaptiveDifficulty: {
        ...prev.adaptiveDifficulty,
        current: level,
        base: level,
      },
    }))
    setShowLevelPicker(false)
  }

  const handleToggleMusic = () => {
    updateGameState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        musicEnabled: !prev.settings.musicEnabled,
      },
    }))
  }

  const handleToggleSound = () => {
    updateGameState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: !prev.settings.soundEnabled,
      },
    }))
  }

  const handleToggleTts = () => {
    updateGameState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ttsEnabled: !prev.settings.ttsEnabled,
      },
    }))
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header page-header--padded">
        <button onClick={() => navigate(-1)} className="back-btn">
          <Icon icon="lucide:arrow-left" width={16} height={16} />
          返回
        </button>
        <div className="page-header__title--sm">设置</div>
        <div className="page-header__spacer" />
      </div>

      {/* Content */}
      <div className="settings-content">
        {/* 学习设置 */}
        <div className="settings-section">
          <p className="settings-section__label">学习设置</p>
          <div className="settings-section__card">
            {/* 英语水平 */}
            <button
              onClick={() => setShowLevelPicker(!showLevelPicker)}
              className="settings-item"
            >
              <div className="settings-item__left">
                <div className="settings-item__icon">📚</div>
                <div style={{ textAlign: 'left' }}>
                  <p className="settings-item__title">英语水平</p>
                  <p className="settings-item__subtitle">调整后下一关生效</p>
                </div>
              </div>
              <div className="settings-item__right">
                <span className="settings-item__value" title={`${currentLevel?.emoji} ${currentLevel?.title}`}>
                  {currentLevel?.title}
                </span>
                <Icon
                  icon={showLevelPicker ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                  width={18}
                  height={18}
                  style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }}
                />
              </div>
            </button>

            {/* 难度选择展开区 */}
            {showLevelPicker && (
              <div className="settings-level-picker">
                {LEVEL_OPTIONS.map((option) => {
                  const isSelected = gameState.difficulty === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleLevelChange(option.id)}
                      className={`settings-level-option ${isSelected ? 'settings-level-option--selected' : 'settings-level-option--unselected'}`}
                    >
                      <span className="settings-level-option__emoji">{option.emoji}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        <span className={`settings-level-option__title ${isSelected ? 'settings-level-option__title--selected' : 'settings-level-option__title--unselected'}`}>
                          {option.title}
                        </span>
                        <span className="settings-level-option__subtitle">
                          {option.subtitle}
                        </span>
                      </span>
                      {isSelected && (
                        <Icon
                          icon="lucide:check"
                          width={18}
                          height={18}
                          style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 音频设置 */}
        <div className="settings-section">
          <p className="settings-section__label">音频设置</p>
          <div className="settings-section__card">
            {/* 背景音乐 */}
            <div className="settings-item">
              <div className="settings-item__left">
                <div className="settings-item__icon">
                  <Icon icon="lucide:music" style={{ width: 20, height: 20, color: '#FFB840' }} />
                </div>
                <p className="settings-item__title">背景音乐</p>
              </div>
              <button
                onClick={handleToggleMusic}
                className={`toggle ${gameState.settings.musicEnabled ? 'toggle--on' : 'toggle--off'}`}
              >
                <div className="toggle__thumb" />
              </button>
            </div>

            <div className="settings-divider" />

            {/* 音效 */}
            <div className="settings-item">
              <div className="settings-item__left">
                <div className="settings-item__icon">
                  <Icon icon="lucide:volume-2" style={{ width: 20, height: 20, color: '#FFB840' }} />
                </div>
                <div>
                  <p className="settings-item__title">音效</p>
                  <p className="settings-item__subtitle">答题音效反馈</p>
                </div>
              </div>
              <button
                onClick={handleToggleSound}
                className={`toggle ${gameState.settings.soundEnabled ? 'toggle--on' : 'toggle--off'}`}
              >
                <div className="toggle__thumb" />
              </button>
            </div>

            <div className="settings-divider" />

            {/* 朗读 */}
            <div className="settings-item">
              <div className="settings-item__left">
                <div className="settings-item__icon">
                  <Icon icon="lucide:mic" style={{ width: 20, height: 20, color: '#FFB840' }} />
                </div>
                <div>
                  <p className="settings-item__title">朗读</p>
                  <p className="settings-item__subtitle">TTS 单词朗读</p>
                </div>
              </div>
              <button
                onClick={handleToggleTts}
                className={`toggle ${gameState.settings.ttsEnabled ? 'toggle--on' : 'toggle--off'}`}
              >
                <div className="toggle__thumb" />
              </button>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div>
          <p className="settings-section__label">关于</p>
          <div className="settings-about">
            <div className="settings-item__icon">🐱</div>
            <div>
              <p className="settings-about__title">WordPet v1.3</p>
              <p className="settings-about__subtitle">Learn, play, purr. 🐾</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
