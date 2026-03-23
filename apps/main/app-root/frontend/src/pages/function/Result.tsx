/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 关卡结算页，展示本关正确率、解锁家具、单词回顾，提供返回房间或进入下一关的入口。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 成绩卡：正确率 + 鼓励文案
 * - 家具解锁卡：展示本关解锁的家具（图片占位 + 名称）
 * - 本关单词回顾（2 列网格，答错标红）
 * - 底部两按钮：返回房间 / 下一关（或返回首页）
 *
 * ## Page Layout
 * 顶部固定导航，中间可滚动内容区，底部固定双按钮
 * </page-design>
 */

import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'

// ─── 家具名映射 ──────────────────────────────────────────────────────────────

const chapterFurnitureMap: Record<number, [string, string, string, string]> = {
  1: ['纸箱小窝', '旧报纸被', '流浪猫碗', '街角路灯'],
  2: ['柔软沙发', '温暖地毯', '小书架', '落地灯'],
  3: ['小课桌', '彩色书包', '黑板', '积木玩具'],
  4: ['公园长椅', '小喷泉', '花圃', '路边秋千'],
  5: ['小餐桌', '料理台', '香料架', '小冰箱'],
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
  const furnitureName = furnitures[levelId - 1]
  const furnitureKey = `furniture_ch${chapterId}_lv${levelId}`
  const furnitureUnlocked = gameState.unlockedFurniture.includes(furnitureKey)

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
      }}
    >
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
        <div style={{ padding: '16px 16px 0' }}>
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

        {/* 2. 家具解锁卡 */}
        <div style={{ padding: '16px 16px 0' }}>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '2px solid rgba(93,64,55,0.1)',
              boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>🏠 解锁家具</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {furnitureUnlocked ? (
                <>
                  {/* 🖼️ ASSET | 家具完整图 | /assets/rooms/ch{id}/furniture/lv{levelId}/full.png */}
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      backgroundColor: 'rgba(93,64,55,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={`/assets/rooms/ch${chapterId}/furniture/lv${levelId}/full.png`}
                      alt={furnitureName}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                        const parent = (e.target as HTMLImageElement).parentElement
                        if (parent && !parent.querySelector('[data-fallback="true"]')) {
                          const fb = document.createElement('span')
                          fb.textContent = furnitureName.charAt(0)
                          fb.setAttribute('data-fallback', 'true')
                          fb.style.cssText = 'font-size:40px;font-weight:900;color:rgba(93,64,55,0.4)'
                          parent.appendChild(fb)
                        }
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#5D4037' }}>{furnitureName}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#66BB6A' }}>✓ 已解锁</div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      backgroundColor: 'rgba(93,64,55,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 40, opacity: 0.3 }}>❓</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(93,64,55,0.45)' }}>
                    完成本关即可解锁
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. 本关单词回顾 */}
        <div style={{ padding: '16px 16px 0' }}>
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

export default Result
