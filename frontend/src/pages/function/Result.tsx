/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 关卡结算页，进入时先全屏展示家具解锁动画，点击继续后展示正确率、单词回顾（含释义/例句/掌握度/发音），提供返回房间、再来一遍或进入下一关的入口。
 * Style referenceFiles: src/styles/result.css, src/styles/components.css
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - Phase 1: 全屏家具解锁动画（FurnitureReveal 组件）
 * - Phase 2: 结算详情
 *   - 成绩卡：正确率 + 鼓励文案
 *   - 本关单词回顾：
 *     - 掌握度分类（已掌握/需复习/未掌握）+ 排序
 *     - 中文释义
 *     - 🔊 发音按钮
 *     - 点击展开：例句 + 答题次数明细
 *   - 底部三按钮：返回首页（图标） / 再来一遍 / 下一关（或全部通关）
 *
 * ## Page Layout
 * 先全屏 overlay 动画，过渡到顶部固定导航 + 中间可滚动内容 + 底部固定三按钮
 * </page-design>
 */

import { useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'
import FurnitureReveal from './FurnitureReveal'
import { speakWord as _speakWord } from '@/lib/utils/tts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LevelWordDetail {
  word: string
  meaning: string
  sentence: string
  type: string
  stats: { correct: number; wrong: number; firstCorrect: boolean }
}

type MasteryLevel = 'mastered' | 'weak' | 'failed'

// ─── TTS（使用公共 speakWord） ──────────────────────────────────────────────

function speakWord(word: string, sentence?: string) {
  _speakWord(word, { sentence })
}

// ─── 家具名映射 ──────────────────────────────────────────────────────────────

const chapterFurnitureMap: Record<number, [string, string, string, string]> = {
  1: ['纸箱小窝', '旧报纸被', '流浪猫碗', '街角路灯'],
  2: ['柔软沙发', '温暖地毯', '小书架', '落地灯'],
  3: ['小课桌', '彩色书包', '黑板', '积木玩具'],
  4: ['公园长椅', '小喷泉', '花圃', '路边秋千'],
  5: ['小餐桌', '料理台', '香料架', '小冰箱'],
}

const chapterFurnitureEmoji: Record<number, [string, string, string, string]> = {
  1: ['📦', '📰', '🥣', '🏮'],
  2: ['🛋️', '🧶', '📚', '🪔'],
  3: ['🪑', '🎒', '📝', '🧩'],
  4: ['🪵', '⛲', '🌺', '🎠'],
  5: ['🍽️', '🔪', '🧂', '🧊'],
}

// ─── 掌握度工具函数 ──────────────────────────────────────────────────────────

function getMasteryLevel(stats: LevelWordDetail['stats']): MasteryLevel {
  if (stats.correct === 0 && stats.wrong > 0) return 'failed'
  if (stats.firstCorrect) return 'mastered'
  return 'weak'
}

function getMasteryConfig(level: MasteryLevel) {
  switch (level) {
    case 'mastered':
      return {
        label: '已掌握',
        color: '#66BB6A',
        bgColor: 'rgba(102,187,106,0.08)',
        borderColor: 'rgba(102,187,106,0.3)',
        icon: 'lucide:circle-check',
        sortOrder: 2,
      }
    case 'weak':
      return {
        label: '需复习',
        color: '#FFB840',
        bgColor: 'rgba(255,184,64,0.08)',
        borderColor: 'rgba(255,184,64,0.3)',
        icon: 'lucide:alert-circle',
        sortOrder: 1,
      }
    case 'failed':
      return {
        label: '待掌握',
        color: '#EF5350',
        bgColor: 'rgba(239,83,80,0.06)',
        borderColor: 'rgba(239,83,80,0.35)',
        icon: 'lucide:circle-x',
        sortOrder: 0,
      }
  }
}

// ─── 单词卡组件 ──────────────────────────────────────────────────────────────

function WordCard({ detail }: { detail: LevelWordDetail }) {
  const [expanded, setExpanded] = useState(false)
  const mastery = getMasteryLevel(detail.stats)
  const config = getMasteryConfig(mastery)

  return (
    <div
      className="result-word-card"
      onClick={() => setExpanded(!expanded)}
      style={{
        backgroundColor: config.bgColor,
        border: `1.5px solid ${config.borderColor}`,
      }}
    >
      {/* ── 顶部行：单词 + 掌握标签 + 发音 ── */}
      <div className="result-word-card__top">
        {/* 单词 */}
        <div className="result-word-card__info">
          <div className="result-word-card__word-row">
            <span className="result-word-card__word">
              {detail.word}
            </span>
            {/* 掌握度标签 */}
            <span
              className={`mastery-tag mastery-tag--${mastery}`}
              style={{ color: config.color, borderColor: config.borderColor }}
            >
              <Icon icon={config.icon} style={{ width: 11, height: 11 }} />
              {config.label}
            </span>
          </div>
          {/* 中文释义 */}
          <div className="result-word-card__meaning">
            {detail.meaning}
          </div>
        </div>

        {/* 发音按钮 */}
        <button
          className="speak-btn"
          onClick={(e) => {
            e.stopPropagation()
            speakWord(detail.word, expanded ? detail.sentence : undefined)
          }}
        >
          <Icon icon="lucide:volume-2" style={{ width: 15, height: 15, color: '#FFB840' }} />
        </button>

        {/* 展开/收起指示 */}
        <Icon
          icon={expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
          className="result-word-card__chevron"
        />
      </div>

      {/* ── 展开详情 ── */}
      {expanded && (
        <div
          className="result-word-card__detail"
          style={{ borderTopColor: config.borderColor }}
        >
          {/* 例句 */}
          <div className="result-word-card__sentence-box">
            <div className="result-word-card__sentence-label">
              例句
            </div>
            <div className="result-word-card__sentence">
              &ldquo;{detail.sentence}&rdquo;
            </div>
          </div>

          {/* 答题统计 */}
          <div className="result-word-card__stats">
            <div className="result-word-card__stat-item">
              <Icon icon="lucide:check" style={{ width: 13, height: 13, color: '#66BB6A' }} />
              <span className="result-word-card__stat-correct">答对 {detail.stats.correct} 次</span>
            </div>
            <div className="result-word-card__stat-item">
              <Icon icon="lucide:x" style={{ width: 13, height: 13, color: '#EF5350' }} />
              <span className="result-word-card__stat-wrong">答错 {detail.stats.wrong} 次</span>
            </div>
            {detail.stats.firstCorrect && (
              <div className="result-word-card__stat-item">
                <Icon icon="lucide:zap" style={{ width: 13, height: 13, color: '#FFB840' }} />
                <span className="result-word-card__stat-first">一次通过</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chapterId: cidParam, levelId: lidParam } = useParams()
  const { gameState } = useGameStore()

  const chapterId = Number(cidParam ?? 1)
  const levelId = Number(lidParam ?? 1)

  const completedKey = `${chapterId}-${levelId}`
  const record = gameState.completedLevels[completedKey]
  const accuracyPct = record ? Math.round(record.accuracy * 100) : 0

  const furnitures = chapterFurnitureMap[chapterId] ?? chapterFurnitureMap[1]
  const emojis = chapterFurnitureEmoji[chapterId] ?? chapterFurnitureEmoji[1]
  const furnitureName = furnitures[levelId - 1]
  const furnitureEmoji = emojis[levelId - 1]
  const furnitureKey = `furniture_ch${chapterId}_lv${levelId}`
  const furnitureUnlocked = gameState.unlockedFurniture.includes(furnitureKey)
  const furnitureImage = `/assets/rooms/ch${chapterId}/furniture/lv${levelId}/full.png`

  // 从路由 state 获取本关单词详情
  const routeState = location.state as { levelWordDetails?: LevelWordDetail[] } | null
  const levelWordDetails: LevelWordDetail[] = routeState?.levelWordDetails ?? []

  // 判断家具是否已展示过（避免"再来一遍"时重复弹出）
  const revealShownKey = `furniture_revealed_ch${chapterId}_lv${levelId}`
  const alreadyRevealed = sessionStorage.getItem(revealShownKey) === '1'

  // 按掌握度排序：未掌握 → 需复习 → 已掌握
  const sortedWords = [...levelWordDetails].sort((a, b) => {
    const aOrder = getMasteryConfig(getMasteryLevel(a.stats)).sortOrder
    const bOrder = getMasteryConfig(getMasteryLevel(b.stats)).sortOrder
    return aOrder - bOrder
  })

  // 统计各掌握度数量
  const masteryCount = {
    mastered: sortedWords.filter((w) => getMasteryLevel(w.stats) === 'mastered').length,
    weak: sortedWords.filter((w) => getMasteryLevel(w.stats) === 'weak').length,
    failed: sortedWords.filter((w) => getMasteryLevel(w.stats) === 'failed').length,
  }

  // ── 页面阶段：reveal（家具解锁动画） → detail（结算详情）
  // 如果家具已解锁 且 之前没展示过 → 先展示动画；否则直接显示详情
  const shouldShowReveal = furnitureUnlocked && !alreadyRevealed
  const [stage, setStage] = useState<'reveal' | 'detail'>(
    shouldShowReveal ? 'reveal' : 'detail'
  )
  const [detailVisible, setDetailVisible] = useState(stage === 'detail')

  const handleRevealContinue = useCallback(() => {
    // 标记已展示过，后续"再来一遍"不会重复弹出
    sessionStorage.setItem(revealShownKey, '1')
    setStage('detail')
    setTimeout(() => setDetailVisible(true), 50)
  }, [revealShownKey])

  // 正确率颜色 & 鼓励文案
  const rateColor = accuracyPct >= 80 ? '#66BB6A' : accuracyPct >= 60 ? '#FFB840' : '#EF5350'
  const encourageText =
    accuracyPct >= 80
      ? '太棒了！继续保持'
      : accuracyPct >= 60
        ? '不错哦！再接再厉'
        : '没关系，下次一定！'

  const handleReplay = () => navigate(`/chapter/${chapterId}/level/${levelId}`)

  // 下一关逻辑
  const MAX_CHAPTERS = 5
  const LEVELS_PER_CHAPTER = 4
  const hasNextLevel = !(chapterId >= MAX_CHAPTERS && levelId >= LEVELS_PER_CHAPTER)
  const nextChapter = levelId >= LEVELS_PER_CHAPTER ? chapterId + 1 : chapterId
  const nextLevel = levelId >= LEVELS_PER_CHAPTER ? 1 : levelId + 1

  const handleNextLevel = () => {
    navigate(`/chapter/${nextChapter}/level/${nextLevel}`)
  }

  // ── Reveal 阶段 ──
  if (stage === 'reveal') {
    return (
      <FurnitureReveal
        furnitureName={furnitureName}
        furnitureEmoji={furnitureEmoji}
        furnitureImage={furnitureImage}
        chapterId={chapterId}
        levelId={levelId}
        onContinue={handleRevealContinue}
      />
    )
  }

  // ── Detail 阶段（结算详情）──
  return (
    <div
      className={`result-page ${detailVisible ? 'result-page--visible' : 'result-page--entering'}`}
    >
      {/* ── 顶部导航 ── */}
      <div className="result-header">
        <div className="result-header__title">
          第 {levelId} 关完成！
        </div>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div className="result-content">
        {/* 1. 成绩卡 */}
        <div className="result-score-card result-anim-slide-1">
          <div className="result-score-card__inner">
            <div className="result-score__value" style={{ color: rateColor }}>
              {accuracyPct}%
            </div>
            <div className="result-score__label">正确率</div>
            <div className="result-score__encourage">
              {encourageText}
            </div>

            {/* 掌握度概览条 */}
            {levelWordDetails.length > 0 && (
              <div className="result-mastery-summary">
                {masteryCount.mastered > 0 && (
                  <span className="result-mastery-item result-mastery-item--mastered">
                    <Icon icon="lucide:circle-check" style={{ width: 13, height: 13 }} />
                    已掌握 {masteryCount.mastered}
                  </span>
                )}
                {masteryCount.weak > 0 && (
                  <span className="result-mastery-item result-mastery-item--weak">
                    <Icon icon="lucide:alert-circle" style={{ width: 13, height: 13 }} />
                    需复习 {masteryCount.weak}
                  </span>
                )}
                {masteryCount.failed > 0 && (
                  <span className="result-mastery-item result-mastery-item--failed">
                    <Icon icon="lucide:circle-x" style={{ width: 13, height: 13 }} />
                    待掌握 {masteryCount.failed}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. 已解锁家具卡片（缩小版，作为回顾） */}
        {furnitureUnlocked && (
          <div className="result-furniture result-anim-slide-2">
            <div className="result-furniture__inner">
              <div className="result-furniture__title">本关解锁</div>
              <div className="result-furniture__display">
                <div className="result-furniture__img-box">
                  <img
                    src={furnitureImage}
                    alt={furnitureName}
                    className="result-furniture__img"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent && !parent.querySelector('[data-fallback="true"]')) {
                        const fb = document.createElement('span')
                        fb.textContent = furnitureEmoji
                        fb.setAttribute('data-fallback', 'true')
                        fb.style.cssText = 'font-size:28px'
                        parent.appendChild(fb)
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="result-furniture__name">
                    {furnitureName}
                  </div>
                  <div className="result-furniture__status">
                    已放入房间
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. 本关单词回顾（增强版） */}
        <div className="result-words result-anim-slide-3">
          <div className="result-words__inner">
            <div className="result-words__header">
              <div className="result-words__title">
                本关单词
              </div>
              <div className="result-words__hint">
                点击展开详情
              </div>
            </div>

            {sortedWords.length > 0 ? (
              <div className="result-words__list">
                {sortedWords.map((detail) => (
                  <WordCard key={detail.word} detail={detail} />
                ))}
              </div>
            ) : (
              /* 兜底：如果没有 route state（直接访问 URL），用 wordHistory 回退 */
              <div className="result-words__grid">
                {Object.entries(gameState.wordHistory)
                  .slice(-10)
                  .map(([word, wr]) => {
                    const hasWrong = wr.wrong > 0
                    return (
                      <div
                        key={word}
                        className={`result-words__grid-item ${hasWrong ? 'result-words__grid-item--error' : ''}`}
                      >
                        <div className="result-words__grid-word">{word}</div>
                        <div className="result-words__grid-stats">
                          答对 {wr.correct} &nbsp; 答错 {wr.wrong}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 底部固定按钮区（3 按钮） ── */}
      <div className="result-actions result-anim-slide-4">
        {/* 返回首页 */}
        <button
          className="btn-secondary icon-btn--lg result-actions__home"
          onClick={() => navigate('/')}
        >
          <Icon icon="lucide:home" style={{ width: 20, height: 20 }} />
        </button>

        {/* 再来一遍 */}
        <button
          className="btn-secondary result-actions__replay"
          onClick={handleReplay}
        >
          再来一遍
        </button>

        {/* 下一关 */}
        {hasNextLevel ? (
          <button
            className="btn-primary result-actions__next"
            onClick={handleNextLevel}
          >
            下一关
            <Icon icon="lucide:arrow-right" style={{ width: 16, height: 16 }} />
          </button>
        ) : (
          <button
            className="btn-success result-actions__next"
            onClick={() => navigate('/')}
          >
            🎉 全部通关！
          </button>
        )}
      </div>
    </div>
  )
}

export default Result
