/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 关卡结算页，进入时先全屏展示家具解锁动画，点击继续后展示正确率、单词回顾（含释义/例句/掌握度/发音），提供返回房间、再来一遍或进入下一关的入口。
 * Style referenceFiles:
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
      onClick={() => setExpanded(!expanded)}
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        backgroundColor: config.bgColor,
        border: `1.5px solid ${config.borderColor}`,
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
    >
      {/* ── 顶部行：单词 + 掌握标签 + 发音 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 单词 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#5D4037', fontFamily: "'Nunito', sans-serif" }}>
              {detail.word}
            </span>
            {/* 掌握度标签 */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 7px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                color: config.color,
                backgroundColor: 'rgba(255,255,255,0.7)',
                border: `1px solid ${config.borderColor}`,
                lineHeight: 1.4,
                flexShrink: 0,
              }}
            >
              <Icon icon={config.icon} style={{ width: 11, height: 11 }} />
              {config.label}
            </span>
          </div>
          {/* 中文释义 */}
          <div style={{ fontSize: 13, color: 'rgba(93,64,55,0.6)', marginTop: 3, lineHeight: 1.3 }}>
            {detail.meaning}
          </div>
        </div>

        {/* 发音按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            speakWord(detail.word, expanded ? detail.sentence : undefined)
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,184,64,0.15)',
            border: '1.5px solid rgba(255,184,64,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon icon="lucide:volume-2" style={{ width: 15, height: 15, color: '#FFB840' }} />
        </button>

        {/* 展开/收起指示 */}
        <Icon
          icon={expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
          style={{
            width: 16,
            height: 16,
            color: 'rgba(93,64,55,0.3)',
            flexShrink: 0,
            transition: 'transform 200ms ease',
          }}
        />
      </div>

      {/* ── 展开详情 ── */}
      {expanded && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px dashed ${config.borderColor}`,
            animation: 'expandIn 200ms ease-out',
          }}
        >
          {/* 例句 */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(93,64,55,0.45)', marginBottom: 3 }}>
              例句
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#5D4037',
                fontStyle: 'italic',
                fontFamily: "'Nunito', sans-serif",
                lineHeight: 1.5,
                padding: '6px 10px',
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.6)',
              }}
            >
              &ldquo;{detail.sentence}&rdquo;
            </div>
          </div>

          {/* 答题统计 */}
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon icon="lucide:check" style={{ width: 13, height: 13, color: '#66BB6A' }} />
              <span style={{ color: '#66BB6A', fontWeight: 700 }}>答对 {detail.stats.correct} 次</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon icon="lucide:x" style={{ width: 13, height: 13, color: '#EF5350' }} />
              <span style={{ color: '#EF5350', fontWeight: 700 }}>答错 {detail.stats.wrong} 次</span>
            </div>
            {detail.stats.firstCorrect && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon icon="lucide:zap" style={{ width: 13, height: 13, color: '#FFB840' }} />
                <span style={{ color: '#FFB840', fontWeight: 700 }}>一次通过</span>
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
      style={{
        minHeight: '100dvh',
        backgroundColor: '#FFF8E7',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        color: '#5D4037',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: detailVisible ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}
    >
      {/* ── 注入动画 ── */}
      <style>{animationKeyframes}</style>

      {/* ── 顶部导航 ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 16px',
          background: 'rgba(255,248,231,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(93,64,55,0.08)',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>
          第 {levelId} 关完成！
        </div>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 120 }}>
        {/* 1. 成绩卡 */}
        <div
          style={{
            padding: '16px 16px 0',
            animation: 'detailSlideUp 500ms ease-out forwards',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '2px solid rgba(93,64,55,0.1)',
              boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
              padding: '24px 16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, fontWeight: 900, color: rateColor, lineHeight: 1 }}>
              {accuracyPct}%
            </div>
            <div style={{ fontSize: 13, color: 'rgba(93,64,55,0.55)', marginTop: 6 }}>正确率</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12, color: '#5D4037' }}>
              {encourageText}
            </div>

            {/* 掌握度概览条 */}
            {levelWordDetails.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {masteryCount.mastered > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#66BB6A' }}>
                    <Icon icon="lucide:circle-check" style={{ width: 13, height: 13 }} />
                    已掌握 {masteryCount.mastered}
                  </span>
                )}
                {masteryCount.weak > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#FFB840' }}>
                    <Icon icon="lucide:alert-circle" style={{ width: 13, height: 13 }} />
                    需复习 {masteryCount.weak}
                  </span>
                )}
                {masteryCount.failed > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#EF5350' }}>
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
          <div
            style={{
              padding: '16px 16px 0',
              animation: 'detailSlideUp 500ms 100ms ease-out both',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                border: '2px solid rgba(93,64,55,0.1)',
                boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>本关解锁</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '8px 12px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,215,0,0.06)',
                  border: '1.5px solid rgba(255,215,0,0.2)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: 'rgba(93,64,55,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={furnitureImage}
                    alt={furnitureName}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#5D4037' }}>
                    {furnitureName}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#66BB6A', marginTop: 2 }}>
                    已放入房间
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. 本关单词回顾（增强版） */}
        <div
          style={{
            padding: '16px 16px 0',
            animation: 'detailSlideUp 500ms 200ms ease-out both',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '2px solid rgba(93,64,55,0.1)',
              boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                本关单词
              </div>
              <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.4)', fontWeight: 600 }}>
                点击展开详情
              </div>
            </div>

            {sortedWords.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedWords.map((detail) => (
                  <WordCard key={detail.word} detail={detail} />
                ))}
              </div>
            ) : (
              /* 兜底：如果没有 route state（直接访问 URL），用 wordHistory 回退 */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(gameState.wordHistory)
                  .slice(-10)
                  .map(([word, wr]) => {
                    const hasWrong = wr.wrong > 0
                    return (
                      <div
                        key={word}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 10,
                          backgroundColor: hasWrong ? 'rgba(239,83,80,0.06)' : 'rgba(93,64,55,0.04)',
                          border: `1.5px solid ${hasWrong ? 'rgba(239,83,80,0.35)' : 'rgba(93,64,55,0.1)'}`,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#5D4037' }}>{word}</div>
                        <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.55)', marginTop: 2 }}>
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
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, rgba(255,248,231,1) 70%, rgba(255,248,231,0))',
          zIndex: 40,
          display: 'flex',
          gap: 10,
          animation: 'detailSlideUp 500ms 300ms ease-out both',
        }}
      >
        {/* 返回首页 */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: 46,
            height: 46,
            flexShrink: 0,
            borderRadius: 14,
            border: '2px solid rgba(93,64,55,0.15)',
            backgroundColor: 'white',
            color: '#5D4037',
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 3px 0 0 rgba(93,64,55,0.08)',
            transition: 'transform 80ms ease, box-shadow 80ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 0 0 rgba(93,64,55,0.08)'
          }}
          onPointerUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 rgba(93,64,55,0.08)'
          }}
          onPointerLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 rgba(93,64,55,0.08)'
          }}
        >
          <Icon icon="lucide:home" style={{ width: 20, height: 20 }} />
        </button>

        {/* 再来一遍 */}
        <button
          onClick={handleReplay}
          style={{
            flex: 1,
            padding: '13px 4px',
            borderRadius: 14,
            border: '2px solid rgba(93,64,55,0.15)',
            backgroundColor: 'white',
            color: '#5D4037',
            fontWeight: 800,
            fontSize: 14,
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 3px 0 0 rgba(93,64,55,0.08)',
            transition: 'transform 80ms ease, box-shadow 80ms ease',
          }}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 0 0 rgba(93,64,55,0.08)'
          }}
          onPointerUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 rgba(93,64,55,0.08)'
          }}
          onPointerLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 rgba(93,64,55,0.08)'
          }}
        >
          再来一遍
        </button>

        {/* 下一关 */}
        {hasNextLevel ? (
          <button
            onClick={handleNextLevel}
            style={{
              flex: 1,
              padding: '13px 4px',
              borderRadius: 14,
              border: '2.5px solid white',
              backgroundColor: '#FFB840',
              color: '#3D1F00',
              fontWeight: 900,
              fontSize: 14,
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 3px 0 0 #A06800',
              transition: 'transform 80ms ease, box-shadow 80ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            onPointerDown={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(3px)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0px 0 0 #A06800'
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
            下一关
            <Icon icon="lucide:arrow-right" style={{ width: 16, height: 16 }} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              padding: '13px 4px',
              borderRadius: 14,
              border: '2.5px solid white',
              backgroundColor: '#66BB6A',
              color: 'white',
              fontWeight: 900,
              fontSize: 14,
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 3px 0 0 #4A9050',
              transition: 'transform 80ms ease, box-shadow 80ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            onPointerDown={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(3px)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0px 0 0 #4A9050'
            }}
            onPointerUp={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.transform = ''
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 #4A9050'
            }}
            onPointerLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.transform = ''
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 0 #4A9050'
            }}
          >
            🎉 全部通关！
          </button>
        )}
      </div>
    </div>
  )
}

// ─── 动画 ────────────────────────────────────────────────────────────────────

const animationKeyframes = `
@keyframes detailSlideUp {
  0%   { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes expandIn {
  0%   { opacity: 0; transform: translateY(-6px); }
  100% { opacity: 1; transform: translateY(0); }
}
`

export default Result
