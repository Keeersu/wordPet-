/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 房间详情页，展示章节房间全景、家具收集进度、关卡列表，用户点击「Let's purr!」开始/继续学习。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 显示章节房间背景图（占位色块）+ 已解锁家具叠加
 * - 信息区：猫咪名字 + 章节标题 + 进度 x/4
 * - 关卡 · 家具：4 个关卡条目，每条包含关卡状态 + 右侧对应家具（已解锁图片 / 未解锁占位）
 * - 已学单词展示（2 列网格）
 * - 底部固定「Let's purr! 🐾」按钮 → 跳转当前未完成关卡
 *
 * ## Page Layout
 * 满高页面，顶部固定 Header（返回 + 章节名），中间滚动内容区，底部固定按钮
 * </page-design>
 */

import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'

// ─── 章节元数据 ───────────────────────────────────────────────────────────────

const chapterMeta = [
  {
    id: 1,
    nameCn: '街角流浪',
    nameEn: 'Street Corner',
    themeColor: '#F5E6C8',
    bgColor: '#E8D5A3',
    furnitureName: '纸箱小窝',
    furnitureNameEn: 'Cardboard Box Nest',
    furnitureEmoji: '📦',
    words: [
      { word: 'cat', meaning: '猫', emoji: '🐱' },
      { word: 'box', meaning: '箱子', emoji: '📦' },
      { word: 'rain', meaning: '雨', emoji: '🌧️' },
      { word: 'door', meaning: '门', emoji: '🚪' },
      { word: 'bag', meaning: '袋子', emoji: '👜' },
    ],
  },
  {
    id: 2,
    nameCn: '温暖新家',
    nameEn: 'Warm Home',
    themeColor: '#C8E8F5',
    bgColor: '#A0CCE8',
    furnitureName: '柔软沙发',
    furnitureNameEn: 'Cozy Sofa',
    furnitureEmoji: '🛋️',
    words: [
      { word: 'sofa', meaning: '沙发', emoji: '🛋️' },
      { word: 'lamp', meaning: '台灯', emoji: '💡' },
      { word: 'book', meaning: '书', emoji: '📚' },
      { word: 'cup', meaning: '杯子', emoji: '☕' },
      { word: 'mat', meaning: '垫子', emoji: '🪆' },
    ],
  },
  {
    id: 3,
    nameCn: '幼儿园',
    nameEn: 'Kindergarten',
    themeColor: '#D8F0FF',
    bgColor: '#B0D8F0',
    furnitureName: '小课桌',
    furnitureNameEn: 'Little Desk',
    furnitureEmoji: '🪑',
    words: [
      { word: 'desk', meaning: '桌子', emoji: '🪑' },
      { word: 'pen', meaning: '笔', emoji: '✏️' },
      { word: 'rule', meaning: '尺子', emoji: '📏' },
      { word: 'ball', meaning: '球', emoji: '⚽' },
      { word: 'cake', meaning: '蛋糕', emoji: '🎂' },
    ],
  },
  {
    id: 4,
    nameCn: '公园探险',
    nameEn: 'Park Adventure',
    themeColor: '#E5F4D8',
    bgColor: '#C0DCA0',
    furnitureName: '公园长椅',
    furnitureNameEn: 'Park Bench',
    furnitureEmoji: '🪵',
    words: [
      { word: 'tree', meaning: '树', emoji: '🌳' },
      { word: 'duck', meaning: '鸭子', emoji: '🦆' },
      { word: 'park', meaning: '公园', emoji: '🏞️' },
      { word: 'friend', meaning: '朋友', emoji: '👫' },
      { word: 'happy', meaning: '快乐', emoji: '😊' },
    ],
  },
  {
    id: 5,
    nameCn: '厨房美食',
    nameEn: 'Kitchen Feast',
    themeColor: '#FFF0D9',
    bgColor: '#F0D8A8',
    furnitureName: '小餐桌',
    furnitureNameEn: 'Dining Table',
    furnitureEmoji: '🍽️',
    words: [
      { word: 'cook', meaning: '烹饪', emoji: '👨‍🍳' },
      { word: 'rice', meaning: '米饭', emoji: '🍚' },
      { word: 'bread', meaning: '面包', emoji: '🍞' },
      { word: 'knife', meaning: '刀', emoji: '🔪' },
      { word: 'taste', meaning: '味道', emoji: '😋' },
    ],
  },
] as const

type ChapterMeta = (typeof chapterMeta)[number]

const chapterFurnitureMap: Record<number, [string, string, string, string]> = {
  1: ['纸箱小窝', '旧报纸被', '流浪猫碗', '街角路灯'],
  2: ['柔软沙发', '温暖地毯', '小书架', '落地灯'],
  3: ['小课桌', '彩色书包', '黑板', '积木玩具'],
  4: ['公园长椅', '小喷泉', '花圃', '路边秋千'],
  5: ['小餐桌', '料理台', '香料架', '小冰箱'],
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function getLevelKey(chapterId: number, levelId: number) {
  return `${chapterId}-${levelId}`
}

// ─── 子组件：房间背景占位 ─────────────────────────────────────────────────────

function RoomBackground({ chapter, furnitureUnlocked }: { chapter: ChapterMeta; furnitureUnlocked: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '375 / 202',
        backgroundColor: chapter.bgColor,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 🖼️ ASSET | 房间背景图 | JPG @3x | /assets/rooms/ch{id}/bg.jpg */}
      <img
        src={`/assets/rooms/ch${chapter.id}/bg.jpg`}
        alt={chapter.nameCn}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          // 图片未上传时隐藏，显示占位
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />

      {/* 占位文字（图片未上传时显示） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: 'rgba(93,64,55,0.4)',
          fontWeight: 700,
          fontSize: 14,
          zIndex: 0,
        }}
      >
        <span style={{ fontSize: 48 }}>🏠</span>
        <span>房间背景图占位</span>
      </div>

      {/* 已解锁家具（完整图叠加） */}
      {furnitureUnlocked && (
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            right: '12%',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'furnitureDrop 600ms cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          {/* 🖼️ ASSET | 完整家具图 | PNG @3x | /assets/rooms/ch{id}/furniture/lv1/full.png */}
          <img
            src={`/assets/rooms/ch${chapter.id}/furniture/lv1/full.png`}
            alt={chapter.furnitureName}
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            onError={(e) => {
              // 图片未上传时显示 emoji 占位
              ;(e.target as HTMLImageElement).style.display = 'none'
              const parent = (e.target as HTMLImageElement).parentElement
              if (parent) {
                parent.innerHTML = `<span style="font-size:52px">${chapter.furnitureEmoji}</span>`
              }
            }}
          />
        </div>
      )}

      {/* 猫咪（占位） */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '10%',
          zIndex: 3,
          fontSize: 40,
        }}
      >
        🐱
      </div>
    </div>
  )
}

// ─── 子组件：关卡条目 ─────────────────────────────────────────────────────────

type LevelStatus = 'completed' | 'current' | 'locked'

function LevelRow({
  chapterId,
  levelId,
  status,
  accuracy,
  furnitureName,
  furnitureUnlocked,
  onClick,
}: {
  chapterId: number
  levelId: number
  status: LevelStatus
  accuracy?: number
  furnitureName: string
  furnitureUnlocked: boolean
  onClick: () => void
}) {
  const isLocked = status === 'locked'
  const isCompleted = status === 'completed'
  const isCurrent = status === 'current'

  const bgColor = isCompleted ? '#F0FBF0' : isCurrent ? '#FFFBF0' : '#F5F0EA'
  const borderColor = isCompleted ? '#66BB6A' : isCurrent ? '#FFB840' : 'rgba(93,64,55,0.12)'
  const shadowColor = isCompleted ? '#4A9050' : isCurrent ? '#A06800' : 'rgba(93,64,55,0.1)'

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 12,
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        boxShadow: `0 3px 0 0 ${shadowColor}`,
        cursor: isLocked ? 'default' : 'pointer',
        opacity: isLocked ? 0.5 : 1,
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      onPointerDown={(e) => {
        if (!isLocked) {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(2px)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 1px 0 0 ${shadowColor}`
        }
      }}
      onPointerUp={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = ''
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 3px 0 0 ${shadowColor}`
      }}
      onPointerLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.transform = ''
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 3px 0 0 ${shadowColor}`
      }}
    >
      {/* 关卡序号圆 */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: isCompleted ? '#66BB6A' : isCurrent ? '#FFB840' : 'rgba(93,64,55,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: isCompleted ? 16 : 14,
          fontWeight: 900,
          color: isCompleted || isCurrent ? 'white' : 'rgba(93,64,55,0.4)',
        }}
      >
        {isCompleted ? '✓' : isLocked ? '🔒' : levelId}
      </div>

      {/* 关卡信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#5D4037' }}>
          第 {levelId} 关
        </div>
        <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.55)', marginTop: 2 }}>
          {isCompleted
            ? `正确率 ${Math.round(accuracy! * 100)}%`
            : isCurrent
              ? '点击开始挑战 →'
              : '完成前几关后解锁'}
        </div>
      </div>

      {/* 右侧：家具 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* 🖼️ ASSET | 家具图 | /assets/rooms/ch{id}/furniture/lv{levelId}/full.png */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: 'rgba(93,64,55,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {furnitureUnlocked ? (
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
                  fb.style.cssText = 'font-size:18px;font-weight:900;color:rgba(93,64,55,0.5)'
                  parent.appendChild(fb)
                }
              }}
            />
          ) : (
            <span style={{ fontSize: 22, opacity: 0.4 }}>❓</span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: furnitureUnlocked ? '#5D4037' : 'rgba(93,64,55,0.4)',
            textAlign: 'center',
            maxWidth: 56,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {furnitureName}
        </div>
        {furnitureUnlocked && (
          <span style={{ fontSize: 12, fontWeight: 800, color: '#66BB6A', lineHeight: 1, marginTop: -2 }}>✓</span>
        )}
      </div>
    </div>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────

function Room() {
  const { chapterId: chapterIdParam } = useParams()
  const navigate = useNavigate()
  const { gameState } = useGameStore()

  const chapterId = Number(chapterIdParam ?? 1)

  // 找到当前章节元数据
  const chapter = chapterMeta.find((c) => c.id === chapterId) ?? chapterMeta[0]

  // 计算各关卡状态
  const levelStatuses = useMemo(() => {
    return [1, 2, 3, 4].map((levelId) => {
      const key = getLevelKey(chapterId, levelId)
      const record = gameState.completedLevels[key]
      if (record) {
        return { levelId, status: 'completed' as LevelStatus, accuracy: record.accuracy }
      }
      // 第一关或前一关已完成才能解锁
      const prevKey = getLevelKey(chapterId, levelId - 1)
      const prevCompleted = levelId === 1 || !!gameState.completedLevels[prevKey]

      // 当前章节解锁了才能进入
      const chapterUnlocked = chapterId <= gameState.currentChapter

      if (!chapterUnlocked) return { levelId, status: 'locked' as LevelStatus }
      if (!prevCompleted) return { levelId, status: 'locked' as LevelStatus }
      return { levelId, status: 'current' as LevelStatus }
    })
  }, [chapterId, gameState.completedLevels, gameState.currentChapter])

  const completedCount = levelStatuses.filter((l) => l.status === 'completed').length
  const chapterFurnitures = chapterFurnitureMap[chapterId] ?? chapterFurnitureMap[1]
  const furnitureId = `furniture_ch${chapterId}`
  const furnitureUnlocked = gameState.unlockedFurniture.includes(furnitureId) || completedCount >= 4

  // 「Let's purr!」按钮目标关卡：第一个未完成的关卡
  const nextLevelId = levelStatuses.find((l) => l.status === 'current')?.levelId ?? null
  const allCompleted = completedCount >= 4

  const handleLevelClick = (levelId: number) => {
    navigate(`/chapter/${chapterId}/level/${levelId}`)
  }

  const handleStartClick = () => {
    if (nextLevelId) {
      navigate(`/chapter/${chapterId}/level/${nextLevelId}`)
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
      {/* ── CSS 动画 ── */}
      <style>{`
        @keyframes furnitureDrop {
          from { opacity: 0; transform: translateY(-30px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── 顶部导航 ── */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate('/')}
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
      </div>

      {/* ── 可滚动内容区 ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 100,
        }}
      >
        {/* 1. 房间全景图 */}
        <RoomBackground chapter={chapter} furnitureUnlocked={furnitureUnlocked} />

        {/* 2. 信息卡 */}
        <div style={{ padding: '16px 16px 0' }}>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '2px solid rgba(93,64,55,0.1)',
              boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 32 }}>🐱</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {gameState.cat.name} · {chapter.nameCn}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.55)', marginTop: 2 }}>
                {chapter.nameEn} · {completedCount}/4 关已完成
              </div>
            </div>
            <div
              style={{
                backgroundColor: completedCount >= 4 ? '#66BB6A' : '#FFB840',
                color: 'white',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {completedCount >= 4 ? '已完成 🎉' : `${completedCount}/4`}
            </div>
          </div>
        </div>

        {/* 3. 关卡 · 家具 */}
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
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>
              🗺️ 关卡 · 家具
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {levelStatuses.map(({ levelId, status, accuracy }) => {
                const fName = chapterFurnitures[levelId - 1]
                const fUnlocked = gameState.unlockedFurniture.includes(`furniture_ch${chapterId}_lv${levelId}`)
                return (
                  <LevelRow
                    key={levelId}
                    chapterId={chapterId}
                    levelId={levelId}
                    status={status}
                    accuracy={accuracy}
                    furnitureName={fName}
                    furnitureUnlocked={fUnlocked}
                    onClick={() => handleLevelClick(levelId)}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* 5. 已学单词（2 列网格） */}
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
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12 }}>
              📚 本章单词
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {chapter.words.map(({ word, meaning, emoji }) => {
                const wordRecord = gameState.wordHistory[word]
                const learned = !!wordRecord
                return (
                  <div
                    key={word}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      backgroundColor: learned ? 'rgba(102,187,106,0.08)' : 'rgba(93,64,55,0.04)',
                      border: `1.5px solid ${learned ? 'rgba(102,187,106,0.3)' : 'rgba(93,64,55,0.1)'}`,
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#5D4037' }}>{word}</div>
                      <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.55)' }}>{meaning}</div>
                    </div>
                    {learned && (
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: '#66BB6A', flexShrink: 0 }}>✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 底部固定按钮 ── */}
      {!allCompleted && nextLevelId && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(to top, rgba(255,248,231,1) 70%, rgba(255,248,231,0))',
            zIndex: 40,
          }}
        >
          <button
            onClick={handleStartClick}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 16,
              border: '2.5px solid #F5C87A',
              backgroundColor: '#FFB840',
              boxShadow: '0 4px 0 0 #A06800',
              color: '#3D1F00',
              fontWeight: 900,
              fontSize: 17,
              fontFamily: 'inherit',
              cursor: 'pointer',
              letterSpacing: 0.5,
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
            Let&apos;s purr! 🐾 第 {nextLevelId} 关
          </button>
        </div>
      )}

      {/* 全部完成时的底部提示 */}
      {allCompleted && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(to top, rgba(255,248,231,1) 70%, rgba(255,248,231,0))',
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 16,
              border: '2.5px solid #66BB6A',
              backgroundColor: 'rgba(102,187,106,0.1)',
              color: '#3A7D40',
              fontWeight: 900,
              fontSize: 16,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            ✓ 本章已全部完成！{chapter.furnitureEmoji} 家具已解锁
          </div>
        </div>
      )}
    </div>
  )
}

export default Room
