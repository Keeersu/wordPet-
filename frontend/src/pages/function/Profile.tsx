/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 学习中心 — 今日学习摘要、核心统计、冒险进度、薄弱单词快速复习入口。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 今日学习概览（今日新学/今日正确率）
 * - 核心统计 3 列（已学单词/完成关卡/解锁家具）
 * - 冒险进度条 + 继续冒险按钮
 * - 薄弱单词提醒（正确率 <70% 的单词，最多展示 6 个）
 * - 设置入口仅在右上角 Header
 *
 * ## Page Layout
 * h-screen flex flex-col，顶部固定 Header，中间可滚动内容
 * </page-design>
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'

const TOTAL_LEVELS = 20

// ─── 卡片容器样式 ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 16,
  border: '2px solid rgba(93,64,55,0.1)',
  boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
  padding: '14px 16px',
}

function rateColor(rate: number): string {
  if (rate >= 80) return '#66BB6A'
  if (rate >= 60) return '#FFB840'
  return '#EF5350'
}

function rateBg(rate: number): string {
  if (rate >= 80) return 'rgba(102,187,106,0.12)'
  if (rate >= 60) return 'rgba(255,184,64,0.12)'
  return 'rgba(239,83,80,0.12)'
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

function Profile() {
  const navigate = useNavigate()
  const { gameState } = useGameStore()

  const wordCount = Object.keys(gameState.wordHistory).length
  const levelCount = Object.keys(gameState.completedLevels).length
  const furnitureCount = gameState.unlockedFurniture.length
  const progressPct = Math.round((levelCount / TOTAL_LEVELS) * 100)

  // 今日统计
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10) // "2025-01-15"
    let todayWords = 0
    let todayCorrect = 0
    let todayTotal = 0

    for (const [, record] of Object.entries(gameState.wordHistory)) {
      if (record.lastSeen && record.lastSeen.startsWith(today)) {
        todayWords++
        todayCorrect += record.correct
        todayTotal += record.correct + record.wrong
      }
    }

    return {
      words: todayWords,
      rate: todayTotal > 0 ? Math.round((todayCorrect / todayTotal) * 100) : 0,
    }
  }, [gameState.wordHistory])

  // 薄弱单词（正确率 <70%，最多取 6 个，按正确率从低到高）
  const weakWords = useMemo(() => {
    return Object.entries(gameState.wordHistory)
      .map(([word, record]) => {
        const total = record.correct + record.wrong
        const rate = total > 0 ? Math.round((record.correct / total) * 100) : 0
        return { word, rate, total }
      })
      .filter((w) => w.rate < 70 && w.total > 0)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 6)
  }, [gameState.wordHistory])

  const activeChapterId = gameState.currentChapter
  const activeLevelId = gameState.currentLevel

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
        <div style={{ fontWeight: 900, fontSize: 18 }}>学习中心</div>
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
        {/* 1. 今日学习概览 */}
        <div
          style={{
            ...cardStyle,
            background: 'linear-gradient(135deg, #FFF3DC 0%, #FFEDC2 100%)',
            border: '2px solid rgba(255,184,64,0.2)',
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 12 }}>
            ☀️ 今日学习
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div
              style={{
                textAlign: 'center',
                padding: '12px 0',
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.7)',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFB840', lineHeight: 1 }}>
                {todayStats.words}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.55)', marginTop: 4 }}>
                今日学习（个）
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '12px 0',
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.7)',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: todayStats.rate >= 80 ? '#66BB6A' : todayStats.rate >= 60 ? '#FFB840' : '#EF5350',
                  lineHeight: 1,
                }}
              >
                {todayStats.words > 0 ? `${todayStats.rate}%` : '--'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.55)', marginTop: 4 }}>
                今日正确率
              </div>
            </div>
          </div>
        </div>

        {/* 2. 核心统计卡 */}
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

        {/* 3. 冒险进度 + 继续冒险 */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14 }}>🗺️ 冒险进度</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#5D4037' }}>
              第 {activeChapterId} 章 · 第 {activeLevelId} 关
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(93,64,55,0.1)',
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: 4,
                backgroundColor: progressPct >= 100 ? '#66BB6A' : '#FFB840',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.45)' }}>
              {levelCount} / {TOTAL_LEVELS} 关
            </div>
            <button
              onClick={() => navigate(`/chapter/${activeChapterId}/level/${activeLevelId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#FFB840',
                boxShadow: '0 3px 0 0 #A06800',
                color: 'white',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'transform 80ms ease, box-shadow 80ms ease',
              }}
              onPointerDown={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 0 0 #A06800'
              }}
              onPointerUp={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = ''
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 #A06800'
              }}
              onPointerLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = ''
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 #A06800'
              }}
            >
              <Icon icon="lucide:play" style={{ width: 14, height: 14 }} />
              继续冒险
            </button>
          </div>
        </div>

        {/* 4. 薄弱单词提醒 */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14 }}>⚡ 薄弱单词</div>
            {weakWords.length > 0 && (
              <button
                onClick={() => navigate('/collection')}
                style={{
                  fontSize: 12,
                  color: '#FFB840',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                查看图鉴
                <Icon icon="lucide:chevron-right" style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>

          {weakWords.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '16px 0',
                fontSize: 13,
                color: 'rgba(93,64,55,0.45)',
              }}
            >
              {wordCount === 0 ? '还没有学习记录，快去冒险吧！🐾' : '太棒了！暂无薄弱单词 ✨'}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.45)', marginBottom: 10 }}>
                正确率低于 70% 的单词，多练习几遍吧
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {weakWords.map(({ word, rate }) => (
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
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: rateColor(rate),
                        backgroundColor: rateBg(rate),
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      {rate}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default Profile
