/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 个人主页，展示猫咪信息卡、学习统计、冒险进度和已学单词回顾。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 猫咪信息卡（头像占位 + 名字 + 标签）
 * - 学习统计 3 列 grid（已学单词 / 完成关卡 / 解锁家具）
 * - 冒险进度条（已完成关卡 / 20 总关卡）
 * - 已学单词回顾（2 列网格，显示正确率）
 * - 底部 MainTabBar
 *
 * ## Page Layout
 * h-screen flex flex-col，顶部固定 Header，中间可滚动内容，底部 MainTabBar
 * </page-design>
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'

const PERSONALITY_LABEL: Record<string, string> = {
  homebody: '居家',
  lively: '活泼',
  mysterious: '神秘',
}

const TOTAL_LEVELS = 20

// ─── 卡片容器样式 ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 16,
  border: '2px solid rgba(93,64,55,0.1)',
  boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
  padding: '14px 16px',
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

function Profile() {
  const navigate = useNavigate()
  const { gameState } = useGameStore()
  const { cat } = gameState

  const wordCount = Object.keys(gameState.wordHistory).length
  const levelCount = Object.keys(gameState.completedLevels).length
  const furnitureCount = gameState.unlockedFurniture.length
  const progressPct = Math.round((levelCount / TOTAL_LEVELS) * 100)

  const wordEntries = useMemo(() => {
    return Object.entries(gameState.wordHistory).map(([word, record]) => {
      const total = record.correct + record.wrong
      const rate = total > 0 ? Math.round((record.correct / total) * 100) : 0
      return { word, correct: record.correct, wrong: record.wrong, rate }
    })
  }, [gameState.wordHistory])

  const genderSuffix = cat.gender === 'male' ? 'm' : 'f'

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFF8E7',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        color: '#5D4037',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'rgba(255,255,255,0.8)',
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
        <div style={{ fontWeight: 900, fontSize: 18 }}>我的</div>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '2px solid rgba(93,64,55,0.12)',
            backgroundColor: 'white',
            boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon icon="lucide:settings" style={{ width: 18, height: 18, color: '#5D4037' }} />
        </button>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingBottom: 120,
        }}
      >
        {/* 1. 猫咪卡片 */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
          {/* 🖼️ ASSET | 猫咪头像 | /assets/cat/appearance_{appearance}_{personality}_{m|f}.png */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,184,64,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <img
              src={`/assets/cat/appearance_${cat.appearance}_${cat.personality}_${genderSuffix}.png`}
              alt={cat.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
                const parent = (e.target as HTMLImageElement).parentElement
                if (parent && !parent.querySelector('[data-fallback="true"]')) {
                  const fb = document.createElement('span')
                  fb.textContent = '🐱'
                  fb.setAttribute('data-fallback', 'true')
                  fb.style.cssText = 'font-size:36px'
                  parent.appendChild(fb)
                }
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>{cat.name}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,184,64,0.15)',
                  color: '#A06800',
                }}
              >
                {cat.gender === 'male' ? '♂ 男孩猫' : '♀ 女孩猫'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,184,64,0.15)',
                  color: '#A06800',
                }}
              >
                {PERSONALITY_LABEL[cat.personality] ?? cat.personality}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.55)' }}>正在陪伴中 🐾</div>
          </div>
        </div>

        {/* 2. 学习统计卡 */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>📊 学习统计</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { value: wordCount, label: '已学单词', unit: '个' },
              { value: levelCount, label: '完成关卡', unit: '关' },
              { value: furnitureCount, label: '解锁家具', unit: '件' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  textAlign: 'center',
                  padding: '10px 0',
                  borderRadius: 12,
                  backgroundColor: 'rgba(93,64,55,0.04)',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFB840', lineHeight: 1 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.55)', marginTop: 4 }}>
                  {item.label}（{item.unit}）
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 冒险进度 */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>🗺️ 冒险进度</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#5D4037', marginBottom: 8 }}>
            第 {gameState.currentChapter} 章 · 第 {gameState.currentLevel} 关
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(93,64,55,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: 4,
                backgroundColor: '#FFB840',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.45)', marginTop: 6, textAlign: 'right' }}>
            {levelCount} / {TOTAL_LEVELS} 关
          </div>
        </div>

        {/* 4. 已学单词回顾 */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14 }}>📚 已学单词</div>
            <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.45)', fontWeight: 600 }}>
              共 {wordCount} 个
            </div>
          </div>

          {wordEntries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 0',
                fontSize: 13,
                color: 'rgba(93,64,55,0.45)',
              }}
            >
              还没有学习记录，快去冒险吧！🐾
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {wordEntries.map(({ word, rate }) => {
                const rateColor = rate >= 80 ? '#66BB6A' : rate >= 60 ? '#FFB840' : '#EF5350'
                return (
                  <div
                    key={word}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(93,64,55,0.04)',
                      border: '1.5px solid rgba(93,64,55,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#5D4037' }}>{word}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: rateColor }}>{rate}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Profile
