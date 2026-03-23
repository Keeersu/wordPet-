/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 房间详情页，展示章节房间全景、家具收集进度、关卡列表，用户点击「Let's purr!」开始/继续学习。
 * Style referenceFiles: styles/room.css
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

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'
import type { GameState } from '@/store/gameStore'
import { generateRoomCatImage, incrementDailyCount, getDailyGenerationCount, MAX_DAILY_GENERATIONS } from '@/lib/catGeneration'
import { getRoomCatStyle } from '@/lib/catStyleSpec'
import { preloadImages } from '@/lib/imageCache'
import { useResolvedCatImage } from '@/lib/useResolvedCatImage'

// ─── 章节元数据 ───────────────────────────────────────────────────────────────

const chapterMeta = [
  {
    id: 1,
    nameCn: '流浪街角',
    nameEn: 'Street Corner',
    themeColor: '#F5E6C8',
    bgColor: '#E8D5A3',
    furnitureName: '纸箱',
    furnitureNameEn: 'Cardboard Box',
    furnitureEmoji: '📦',
    words: [
      { word: 'cat', meaning: '猫', emoji: '🐱' },
      { word: 'box', meaning: '纸箱', emoji: '📦' },
      { word: 'bike', meaning: '自行车', emoji: '🚲' },
      { word: 'mat', meaning: '垫子', emoji: '🛏️' },
      { word: 'bin', meaning: '垃圾桶', emoji: '🗑️' },
    ],
  },
  {
    id: 2,
    nameCn: '温馨小家',
    nameEn: 'Cozy Home',
    themeColor: '#C8E8F5',
    bgColor: '#A0CCE8',
    furnitureName: '钟表',
    furnitureNameEn: 'Clock',
    furnitureEmoji: '🕰️',
    words: [
      { word: 'clock', meaning: '钟表', emoji: '🕰️' },
      { word: 'pillow', meaning: '抱枕', emoji: '🛋️' },
      { word: 'carpet', meaning: '地毯', emoji: '🧶' },
      { word: 'table', meaning: '茶几', emoji: '☕' },
      { word: 'bed', meaning: '床', emoji: '🛏️' },
    ],
  },
  {
    id: 3,
    nameCn: '厨房冒险',
    nameEn: 'Kitchen Adventure',
    themeColor: '#FFF0D9',
    bgColor: '#F0D8A8',
    furnitureName: '锅',
    furnitureNameEn: 'Pot',
    furnitureEmoji: '🍳',
    words: [
      { word: 'pot', meaning: '锅', emoji: '🍳' },
      { word: 'glove', meaning: '手套', emoji: '🧤' },
      { word: 'carrot', meaning: '胡萝卜', emoji: '🥕' },
      { word: 'napkin', meaning: '纸巾', emoji: '🧻' },
      { word: 'cook', meaning: '烹饪', emoji: '👨‍🍳' },
    ],
  },
  {
    id: 4,
    nameCn: '趣味乐园',
    nameEn: 'Fun Playground',
    themeColor: '#D8F0FF',
    bgColor: '#B0D8F0',
    furnitureName: '挂画',
    furnitureNameEn: 'Wall Painting',
    furnitureEmoji: '🖼️',
    words: [
      { word: 'picture', meaning: '挂画', emoji: '🖼️' },
      { word: 'shelf', meaning: '书架', emoji: '📚' },
      { word: 'desk', meaning: '书桌', emoji: '🪑' },
      { word: 'chair', meaning: '椅子', emoji: '💺' },
      { word: 'play', meaning: '玩', emoji: '🎮' },
    ],
  },
  {
    id: 5,
    nameCn: '阳光书房',
    nameEn: 'Sunny Study',
    themeColor: '#E5F4D8',
    bgColor: '#C0DCA0',
    furnitureName: '沙发',
    furnitureNameEn: 'Sofa',
    furnitureEmoji: '🛋️',
    words: [
      { word: 'sofa', meaning: '沙发', emoji: '🛋️' },
      { word: 'lamp', meaning: '灯', emoji: '💡' },
      { word: 'plant', meaning: '植物', emoji: '🌿' },
      { word: 'curtain', meaning: '窗帘', emoji: '🪟' },
      { word: 'book', meaning: '书', emoji: '📚' },
    ],
  },
] as const

type ChapterMeta = (typeof chapterMeta)[number]

const chapterFurnitureMap: Record<number, [string, string, string, string]> = {
  1: ['纸箱', '自行车', '垫子', '垃圾桶'],
  2: ['钟表', '抱枕', '地毯', '茶几'],
  3: ['锅', '手套', '胡萝卜', '纸巾'],
  4: ['挂画', '书架', '书桌', '椅子'],
  5: ['沙发', '落地灯', '植物', '窗帘'],
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function getLevelKey(chapterId: number, levelId: number) {
  return `${chapterId}-${levelId}`
}

function getRoomStage(completedCount: number) {
  return Math.max(0, Math.min(completedCount, 4))
}

// ─── 子组件：房间背景占位 ─────────────────────────────────────────────────────

function RoomBackground({ chapter, completedCount, gameState, onRoomImageReady }: {
  chapter: ChapterMeta
  completedCount: number
  gameState: GameState
  onRoomImageReady?: (chapterId: number, imageUrl: string) => void
}) {
  const [bgLoaded, setBgLoaded] = useState(false)
  const isGenerated = !!gameState.cat.generatedAppearance?.imageUrl
  const hasRoomImage = !!gameState.cat.generatedAppearance?.roomImages?.[chapter.id]
  const resolvedCatSrc = useResolvedCatImage(gameState.cat, chapter.id)
  const [generating, setGenerating] = useState(false)
  const stage = getRoomStage(completedCount)
  const bgSrc = `/assets/rooms/ch${chapter.id}/progress/stage${stage}.jpg`
  const catSrc = isGenerated && !hasRoomImage ? '' : resolvedCatSrc

  useEffect(() => {
    preloadImages([bgSrc])
  }, [bgSrc])

  useEffect(() => {
    if (!isGenerated || hasRoomImage || generating) return
    const appearance = gameState.cat.generatedAppearance
    if (!appearance?.tags) return
    if (getDailyGenerationCount() >= MAX_DAILY_GENERATIONS) return

    let cancelled = false
    setGenerating(true)
    generateRoomCatImage(appearance.tags, chapter.id, appearance.rawImageUrl, gameState.cat.personality)
      .then(({ rawImageUrl }) => {
        if (cancelled) return
        incrementDailyCount()
        onRoomImageReady?.(chapter.id, rawImageUrl)
      })
      .catch((e) => {
        console.error('[Room] generateRoomCatImage failed:', e)
      })
      .finally(() => {
        if (!cancelled) setGenerating(false)
      })
    return () => { cancelled = true }
  }, [isGenerated, hasRoomImage, chapter.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const catPositionStyle = getRoomCatStyle(chapter.id)

  return (
    <div
      className={`room-bg ${bgLoaded ? 'room-bg--image-only' : ''}`}
      style={{ backgroundColor: bgLoaded ? 'transparent' : chapter.bgColor }}
    >
      <img
        src={bgSrc}
        alt={chapter.nameCn}
        className="room-bg__img"
        fetchPriority="high"
        decoding="async"
        onLoad={() => { setBgLoaded(true) }}
        onError={(e) => { setBgLoaded(false); (e.target as HTMLImageElement).style.display = 'none' }}
      />

      {!bgLoaded && (
        <div className="room-bg__placeholder">
          <span className="room-bg__placeholder-icon">🏠</span>
          <span>房间背景图占位</span>
        </div>
      )}

      <div className="room-bg__cat" style={catPositionStyle}>
        {catSrc ? (
          <img
            src={catSrc}
            alt={gameState.cat.name}
            className="h-full w-full object-contain"
            decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement!.textContent = '🐱' }}
          />
        ) : generating ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FFB840] border-t-transparent" />
          </div>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl">🐱</span>
        )}
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
  const [furnitureLoaded, setFurnitureLoaded] = useState(false)

  const statusClass = isCompleted ? 'room-level--completed' : status === 'current' ? 'room-level--current' : 'room-level--locked'

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`room-level ${statusClass}`}
    >
      {/* 关卡序号圆 */}
      <div className="room-level__num">
        {isCompleted ? '✓' : isLocked ? '🔒' : levelId}
      </div>

      {/* 关卡信息 */}
      <div className="room-level__info">
        <div className="room-level__title">第 {levelId} 关</div>
        <div className="room-level__desc">
          {isCompleted
            ? `正确率 ${Math.round(accuracy! * 100)}%`
            : status === 'current'
              ? '点击开始挑战'
              : '完成前几关后解锁'}
        </div>
      </div>

      {/* 右侧：家具 */}
      <div className="room-level__furniture">
        <div
          className={`room-level__furniture-box ${
            furnitureUnlocked && furnitureLoaded ? 'room-level__furniture-box--image-only' : ''
          }`}
        >
          {furnitureUnlocked ? (
            <>
              <img
                src={`/assets/rooms/ch${chapterId}/furniture/lv${levelId}/full.png`}
                alt={furnitureName}
                className="room-level__furniture-img"
                loading="lazy"
                decoding="async"
                onLoad={() => {
                  setFurnitureLoaded(true)
                }}
                onError={(e) => {
                  setFurnitureLoaded(false)
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              {!furnitureLoaded && (
                <span className="room-level__furniture-fallback">{furnitureName.charAt(0)}</span>
              )}
            </>
          ) : (
            <span className="room-level__furniture-placeholder">❓</span>
          )}
        </div>
        <div className={`room-level__furniture-name ${furnitureUnlocked ? 'room-level__furniture-name--unlocked' : 'room-level__furniture-name--locked'}`}>
          {furnitureName}
        </div>
        {furnitureUnlocked && (
          <span className="room-level__furniture-check">✓</span>
        )}
      </div>
    </div>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────

function Room() {
  const { chapterId: chapterIdParam } = useParams()
  const navigate = useNavigate()
  const { gameState, updateGameState } = useGameStore()

  const chapterId = Number(chapterIdParam ?? 1)
  const chapter = chapterMeta.find((c) => c.id === chapterId) ?? chapterMeta[0]

  const levelStatuses = useMemo(() => {
    return [1, 2, 3, 4].map((levelId) => {
      const key = getLevelKey(chapterId, levelId)
      const record = gameState.completedLevels[key]
      if (record) {
        return { levelId, status: 'completed' as LevelStatus, accuracy: record.accuracy }
      }
      const prevKey = getLevelKey(chapterId, levelId - 1)
      const prevCompleted = levelId === 1 || !!gameState.completedLevels[prevKey]
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
  const nextLevelId = levelStatuses.find((l) => l.status === 'current')?.levelId ?? null
  const allCompleted = completedCount >= 4
  const avatarSrc = useResolvedCatImage(gameState.cat)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [chapterId])

  const handleLevelClick = (levelId: number) => {
    navigate(`/chapter/${chapterId}/level/${levelId}`)
  }

  const handleStartClick = () => {
    if (nextLevelId) {
      navigate(`/chapter/${chapterId}/level/${nextLevelId}`)
    }
  }

  const handleRoomImageReady = (chId: number, imageUrl: string) => {
    updateGameState((prev) => {
      if (!prev.cat.generatedAppearance) return prev
      const existing = prev.cat.generatedAppearance.roomImages ?? {}
      return {
        ...prev,
        cat: {
          ...prev.cat,
          generatedAppearance: {
            ...prev.cat.generatedAppearance,
            roomImages: { ...existing, [chId]: imageUrl },
          },
        },
      }
    })
  }

  return (
    <div className="room-page">
      {/* ── 顶部导航 ── */}
      <div className="room-back-wrap">
        <button onClick={() => navigate('/')} className="back-btn">
          <Icon icon="lucide:arrow-left" style={{ width: 16, height: 16 }} />
          返回
        </button>
      </div>

      {/* ── 可滚动内容区 ── */}
      <div className="room-scroll" ref={scrollRef}>
        <RoomBackground chapter={chapter} completedCount={completedCount} gameState={gameState} onRoomImageReady={handleRoomImageReady} />

        {/* 信息卡 */}
        <div className="room-section">
          <div className="room-info-card">
            <span className="room-info-card__avatar">
              <img
                src={avatarSrc}
                alt={gameState.cat.name}
                className="h-full w-full rounded-full object-contain"
                decoding="async"
                onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createTextNode('🐱')) }}
              />
            </span>
            <div className="room-info-card__text">
              <div className="room-info-card__name">
                {gameState.cat.name} · {chapter.nameCn}
              </div>
              <div className="room-info-card__sub">
                {chapter.nameEn} · {completedCount}/4 关已完成
              </div>
            </div>
            <div className={`room-info-card__badge ${completedCount >= 4 ? 'room-info-card__badge--done' : 'room-info-card__badge--progress'}`}>
              {completedCount >= 4 ? '已完成 🎉' : `${completedCount}/4`}
            </div>
          </div>
        </div>

        {/* 关卡 · 家具 */}
        <div className="room-section">
          <div className="card card--padded">
            <div className="room-card-title">🗺️ 关卡 · 家具</div>
            <div className="room-levels">
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

        {/* 本章单词 */}
        <div className="room-section">
          <div className="card card--padded">
            <div className="room-card-title">📚 本章单词</div>
            <div className="room-words-grid">
              {chapter.words.map(({ word, meaning, emoji }) => {
                const learned = !!gameState.wordHistory[word]
                return (
                  <div key={word} className={`room-word-item ${learned ? 'room-word-item--learned' : 'room-word-item--unlearned'}`}>
                    <span className="room-word-item__emoji">{emoji}</span>
                    <div className="room-word-item__text">
                      <div className="room-word-item__word">{word}</div>
                      <div className="room-word-item__meaning">{meaning}</div>
                    </div>
                    {learned && <span className="room-word-item__check">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── 底部固定按钮 ── */}
      {!allCompleted && nextLevelId && (
        <div className="room-bottom-bar">
          <button onClick={handleStartClick} className="room-start-btn btn">
            Let&apos;s purr! 🐾 第 {nextLevelId} 关
          </button>
        </div>
      )}

      {allCompleted && (
        <div className="room-bottom-bar">
          <div className="room-complete-banner">
            ✓ 本章已全部完成！{chapter.furnitureEmoji} 家具已解锁
          </div>
        </div>
      )}
    </div>
  )
}

export default Room
