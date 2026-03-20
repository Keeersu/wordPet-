/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 学习中心 — 今日学习摘要、核心统计、冒险进度、薄弱单词快速复习入口。
 * Style referenceFiles: styles/profile.css, styles/components.css
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
import { rateColor, rateBgColor as rateBg } from '@/lib/utils/colors'

const TOTAL_LEVELS = 20

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
    <div className="profile-page">
      {/* ── Header ── */}
      <div className="page-header profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <Icon icon="lucide:arrow-left" style={{ width: 16, height: 16 }} />
          返回
        </button>
        <div className="page-header__title">学习中心</div>
        <button className="icon-btn icon-btn--sm" onClick={() => navigate('/settings')}>
          <Icon icon="lucide:settings" style={{ width: 18, height: 18, color: '#5D4037' }} />
        </button>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div className="profile-content">
        {/* 1. 今日学习概览 */}
        <div className="card card--padded profile-today">
          <div className="profile-today__title">
            ☀️ 今日学习
          </div>
          <div className="profile-today__grid">
            <div className="profile-today__stat">
              <div className="profile-today__value profile-today__value--primary">
                {todayStats.words}
              </div>
              <div className="profile-today__label">
                今日学习（个）
              </div>
            </div>
            <div className="profile-today__stat">
              <div
                className="profile-today__value"
                style={{
                  color: todayStats.rate >= 80 ? '#66BB6A' : todayStats.rate >= 60 ? '#FFB840' : '#EF5350',
                }}
              >
                {todayStats.words > 0 ? `${todayStats.rate}%` : '--'}
              </div>
              <div className="profile-today__label">
                今日正确率
              </div>
            </div>
          </div>
        </div>

        {/* 2. 核心统计卡 */}
        <div className="card card--padded">
          <div className="profile-stats__title">📊 学习统计</div>
          <div className="profile-stats__grid">
            {[
              { value: wordCount, label: '已学单词', unit: '个' },
              { value: levelCount, label: '完成关卡', unit: '关' },
              { value: furnitureCount, label: '解锁家具', unit: '件' },
            ].map((item) => (
              <div key={item.label} className="profile-stats__item">
                <div className="profile-stats__value">
                  {item.value}
                </div>
                <div className="profile-stats__label">
                  {item.label}（{item.unit}）
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 冒险进度 + 继续冒险 */}
        <div className="card card--padded">
          <div className="profile-progress__header">
            <div className="profile-progress__title">🗺️ 冒险进度</div>
            <div className="profile-progress__chapter">
              第 {activeChapterId} 章 · 第 {activeLevelId} 关
            </div>
          </div>
          <div className="profile-progress__bar">
            <div
              className="profile-progress__fill"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct >= 100 ? '#66BB6A' : '#FFB840',
              }}
            />
          </div>
          <div className="profile-progress__footer">
            <div className="profile-progress__count">
              {levelCount} / {TOTAL_LEVELS} 关
            </div>
            <button
              className="btn btn-primary profile-progress__btn"
              onClick={() => navigate(`/chapter/${activeChapterId}/level/${activeLevelId}`)}
            >
              <Icon icon="lucide:play" style={{ width: 14, height: 14 }} />
              继续冒险
            </button>
          </div>
        </div>

        {/* 4. 薄弱单词提醒 */}
        <div className="card card--padded">
          <div className="profile-weak__header">
            <div className="profile-weak__title">⚡ 薄弱单词</div>
            {weakWords.length > 0 && (
              <button className="profile-weak__link" onClick={() => navigate('/collection')}>
                查看图鉴
                <Icon icon="lucide:chevron-right" style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>

          {weakWords.length === 0 ? (
            <div className="profile-weak__empty">
              {wordCount === 0 ? '还没有学习记录，快去冒险吧！🐾' : '太棒了！暂无薄弱单词 ✨'}
            </div>
          ) : (
            <>
              <div className="profile-weak__hint">
                正确率低于 70% 的单词，多练习几遍吧
              </div>
              <div className="profile-weak__grid">
                {weakWords.map(({ word, rate }) => (
                  <div key={word} className="profile-weak__item">
                    <span className="profile-weak__word">{word}</span>
                    <span
                      className="rate-badge"
                      style={{ color: rateColor(rate), backgroundColor: rateBg(rate) }}
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
