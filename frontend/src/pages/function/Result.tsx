/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 关卡结算页，进入时先全屏展示家具解锁动画，点击继续后展示正确率、单词回顾，提供返回房间或进入下一关的入口。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - Phase 1: 全屏家具解锁动画（FurnitureReveal 组件）
 *   - 深色背景 + 星光粒子
 *   - 家具弹性缩放出场 + 光晕扩散
 *   - 家具名称 + "新家具已解锁！" 文字淡入
 *   - 底部「太棒了！」按钮
 * - Phase 2: 结算详情（点击继续后展示）
 *   - 成绩卡：正确率 + 鼓励文案
 *   - 本关单词回顾（2 列网格，答错标红）
 *   - 底部两按钮：返回房间 / 下一关（或返回首页）
 *
 * ## Page Layout
 * 先全屏 overlay 动画，过渡到顶部固定导航 + 中间可滚动内容 + 底部固定双按钮
 * </page-design>
 */

import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'
import FurnitureReveal from './FurnitureReveal'

// ─── 家具名映射 ──────────────────────────────────────────────────────────────

const chapterFurnitureMap: Record<number, [string, string, string, string]> = {
  1: ['纸箱小窝', '旧报纸被', '流浪猫碗', '街角路灯'],
  2: ['柔软沙发', '温暖地毯', '小书架', '落地灯'],
  3: ['小课桌', '彩色书包', '黑板', '积木玩具'],
  4: ['公园长椅', '小喷泉', '花圃', '路边秋千'],
  5: ['小餐桌', '料理台', '香料架', '小冰箱'],
}

// 家具 emoji 映射（与 Room.tsx 保持一致）
const chapterFurnitureEmoji: Record<number, [string, string, string, string]> = {
  1: ['📦', '📰', '🥣', '🏮'],
  2: ['🛋️', '🧶', '📚', '🪔'],
  3: ['🪑', '🎒', '📝', '🧩'],
  4: ['🪵', '⛲', '🌺', '🎠'],
  5: ['🍽️', '🔪', '🧂', '🧊'],
}

// 当前 mock 题库的 10 个单词，后续接真实题库后可动态获取
const LEVEL_WORDS = ['sofa', 'lamp', 'chair', 'table', 'clock', 'window', 'pillow', 'carpet', 'shelf', 'mirror']

// ─── 主页面 ──────────────────────────────────────────────────────────────────

function Result() {
  const navigate = useNavigate()
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

  // ── 页面阶段：reveal（家具解锁动画） → detail（结算详情）
  const [stage, setStage] = useState<'reveal' | 'detail'>(
    furnitureUnlocked ? 'reveal' : 'detail'
  )
  const [detailVisible, setDetailVisible] = useState(stage === 'detail')

  const handleRevealContinue = useCallback(() => {
    setStage('detail')
    // 短延迟让过渡更自然
    setTimeout(() => setDetailVisible(true), 50)
  }, [])

  // 正确率颜色 & 鼓励文案
  const rateColor = accuracyPct >= 80 ? '#66BB6A' : accuracyPct >= 60 ? '#FFB840' : '#EF5350'
  const encourageText =
    accuracyPct >= 80
      ? '太棒了！继续保持 🎉'
      : accuracyPct >= 60
        ? '不错哦！再接再厉 🐾'
        : '没关系，下次一定！💪'

  const isLastLevel = levelId >= 4

  const handleBack = () => navigate(`/rooms/${chapterId}`)
  const handleNext = () => {
    if (isLastLevel) {
      navigate('/')
    } else {
      navigate(`/chapter/${chapterId}/level/${levelId + 1}`)
    }
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
      {/* ── 注入详情页过渡动画 ── */}
      <style>{detailKeyframes}</style>

      {/* ── 顶部导航 ── */}
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
          onClick={handleBack}
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

        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>
          第 {levelId} 关完成！
        </div>

        {/* 占位，让标题居中 */}
        <div style={{ width: 68 }} />
      </div>

      {/* ── 可滚动内容区 ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
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
              <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>🏠 本关解锁</div>
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
                {/* 小号家具图 */}
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
                    ✓ 已放入房间
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. 本关单词回顾 */}
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
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>📚 本关单词</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LEVEL_WORDS.map((word) => {
                const wr = gameState.wordHistory[word]
                const hasWrong = wr ? wr.wrong > 0 : false
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
                    {wr ? (
                      <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.55)', marginTop: 2 }}>
                        ✓ {wr.correct} &nbsp; ✗ {wr.wrong}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.35)', marginTop: 2 }}>
                        未作答
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 底部固定按钮区 ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, rgba(255,248,231,1) 70%, rgba(255,248,231,0))',
          zIndex: 40,
          display: 'flex',
          gap: 12,
          animation: 'detailSlideUp 500ms 300ms ease-out both',
        }}
      >
        {/* 返回房间 */}
        <button
          onClick={handleBack}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 16,
            border: '2px solid #FFB840',
            backgroundColor: 'white',
            color: '#FFB840',
            fontWeight: 900,
            fontSize: 15,
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
            transition: 'transform 80ms ease, box-shadow 80ms ease',
          }}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 0 0 rgba(93,64,55,0.08)'
          }}
          onPointerUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 rgba(93,64,55,0.08)'
          }}
          onPointerLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 rgba(93,64,55,0.08)'
          }}
        >
          返回房间
        </button>

        {/* 下一关 / 返回首页 */}
        <button
          onClick={handleNext}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: 16,
            border: '2.5px solid white',
            backgroundColor: '#FFB840',
            color: '#3D1F00',
            fontWeight: 900,
            fontSize: 15,
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 4px 0 0 #A06800',
            transition: 'transform 80ms ease, box-shadow 80ms ease',
          }}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(4px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0px 0 0 #A06800'
          }}
          onPointerUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 #A06800'
          }}
          onPointerLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 #A06800'
          }}
        >
          {isLastLevel ? '返回首页' : '下一关 →'}
        </button>
      </div>
    </div>
  )
}

// ─── 详情页入场动画 ──────────────────────────────────────────────────────────

const detailKeyframes = `
@keyframes detailSlideUp {
  0%   { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }
}
`

export default Result
