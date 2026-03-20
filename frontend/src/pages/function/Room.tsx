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
    <div className="room-bg" style={{ backgroundColor: chapter.bgColor }}>
      {/* 🖼️ ASSET | 房间背景图 | JPG @3x | /assets/rooms/ch{id}/bg.jpg */}
      <img
        src={`/assets/rooms/ch${chapter.id}/bg.jpg`}
        alt={chapter.nameCn}
        className="room-bg__img"
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />

      {/* 占位文字（图片未上传时显示） */}
      <div className="room-bg__placeholder">
        <span className="room-bg__placeholder-icon">🏠</span>
        <span>房间背景图占位</span>
      </div>

      {/* 已解锁家具（完整图叠加） */}
      {furnitureUnlocked && (
        <div className="room-bg__furniture">
          <img
            src={`/assets/rooms/ch${chapter.id}/furniture/lv1/full.png`}
            alt={chapter.furnitureName}
            className="room-bg__furniture-img"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
              const parent = (e.target as HTMLImageElement).parentElement
              if (parent) {
                parent.innerHTML = `<span class="room-bg__furniture-emoji">${chapter.furnitureEmoji}</span>`
              }
            }}
          />
        </div>
      )}

      {/* 猫咪（占位） */}
      <div className="room-bg__cat">🐱</div>
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
              ? '点击开始挑战 →'
              : '完成前几关后解锁'}
        </div>
      </div>

      {/* 右侧：家具 */}
      <div className="room-level__furniture">
        <div className="room-level__furniture-box">
          {furnitureUnlocked ? (
            <img
              src={`/assets/rooms/ch${chapterId}/furniture/lv${levelId}/full.png`}
              alt={furnitureName}
              className="room-level__furniture-img"
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
  const { gameState } = useGameStore()

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

  const handleLevelClick = (levelId: number) => {
    navigate(`/chapter/${chapterId}/level/${levelId}`)
  }

  const handleStartClick = () => {
    if (nextLevelId) {
      navigate(`/chapter/${chapterId}/level/${nextLevelId}`)
    }
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
      <div className="room-scroll">
        <RoomBackground chapter={chapter} furnitureUnlocked={furnitureUnlocked} />

        {/* 信息卡 */}
        <div className="room-section">
          <div className="room-info-card">
            <span className="room-info-card__avatar">🐱</span>
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
