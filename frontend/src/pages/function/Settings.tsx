/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 应用设置页面，包含英语水平调整、音乐/音效开关、账户管理。
 * Style referenceFiles:
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

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#FFF8E7',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        color: '#5D4037',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          background: 'rgba(255,248,231,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(93,64,55,0.08)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 10,
            border: '2px solid rgba(93,64,55,0.12)',
            backgroundColor: 'white',
            boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
            cursor: 'pointer',
            color: '#5D4037',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          <Icon icon="lucide:arrow-left" style={{ width: 16, height: 16 }} />
          返回
        </button>

        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>设置</div>

        <div style={{ width: 68 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px' }}>
        {/* 学习设置 */}
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(93,64,55,0.45)',
              margin: '0 0 10px 4px',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            学习设置
          </p>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '2px solid rgba(93,64,55,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* 英语水平 */}
            <button
              onClick={() => setShowLevelPicker(!showLevelPicker)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: '#5D4037',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#FFF8E7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  📚
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>英语水平</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(93,64,55,0.5)' }}>
                    调整后下一关生效
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FFB840' }}>
                  {currentLevel?.emoji} {currentLevel?.title}
                </span>
                <Icon
                  icon={showLevelPicker ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                  style={{ width: 18, height: 18, color: 'rgba(93,64,55,0.3)' }}
                />
              </div>
            </button>

            {/* 难度选择展开区 */}
            {showLevelPicker && (
              <div
                style={{
                  borderTop: '1px solid rgba(93,64,55,0.06)',
                  padding: '12px 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  animation: 'expandIn 200ms ease-out',
                }}
              >
                {LEVEL_OPTIONS.map((option) => {
                  const isSelected = gameState.difficulty === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleLevelChange(option.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: isSelected ? '2px solid #FFB840' : '2px solid rgba(93,64,55,0.08)',
                        backgroundColor: isSelected ? '#FFF3DC' : '#FAFAF8',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        width: '100%',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{option.emoji}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isSelected ? '#5D4037' : 'rgba(93,64,55,0.7)',
                          }}
                        >
                          {option.title}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: 'rgba(93,64,55,0.4)',
                            marginLeft: 8,
                          }}
                        >
                          {option.subtitle}
                        </span>
                      </span>
                      {isSelected && (
                        <Icon
                          icon="lucide:check"
                          style={{ width: 18, height: 18, color: '#FFB840', flexShrink: 0 }}
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
        <div style={{ marginBottom: 28 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(93,64,55,0.45)',
              margin: '0 0 10px 4px',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            音频设置
          </p>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '2px solid rgba(93,64,55,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* 背景音乐 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#FFF8E7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  🎵
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>背景音乐</p>
              </div>
              <button
                onClick={handleToggleMusic}
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 15,
                  border: 'none',
                  backgroundColor: gameState.settings.musicEnabled ? '#FFB840' : 'rgba(93,64,55,0.15)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 200ms ease',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    position: 'absolute',
                    top: 3,
                    left: gameState.settings.musicEnabled ? 25 : 3,
                    transition: 'left 200ms ease',
                  }}
                />
              </button>
            </div>

            <div style={{ height: 1, backgroundColor: 'rgba(93,64,55,0.06)', margin: '0 16px' }} />

            {/* 音效 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#FFF8E7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  🔊
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>音效 & 朗读</p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(93,64,55,0.5)' }}>
                    包含 TTS 单词朗读
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleSound}
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 15,
                  border: 'none',
                  backgroundColor: gameState.settings.soundEnabled ? '#FFB840' : 'rgba(93,64,55,0.15)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 200ms ease',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    position: 'absolute',
                    top: 3,
                    left: gameState.settings.soundEnabled ? 25 : 3,
                    transition: 'left 200ms ease',
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'rgba(93,64,55,0.45)',
              margin: '0 0 10px 4px',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            关于
          </p>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '2px solid rgba(93,64,55,0.06)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#FFF8E7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              🐱
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>WordPet v1.3</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(93,64,55,0.5)' }}>
                Learn, play, purr. 🐾
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expand animation */}
      <style>{`
        @keyframes expandIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
      `}</style>
    </div>
  )
}

export default Settings
