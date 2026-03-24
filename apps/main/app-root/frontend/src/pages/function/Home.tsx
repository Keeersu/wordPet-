/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 展示所有关卡房间的主页，用户可在此选择房间开始冒险学习。
 * Style referenceFiles: styles/home.css, styles/components.css
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 浏览并选择冒险房间（关卡）
 * - 查看当前解锁房间进度
 * - 点击悬浮按钮直接继续上次的冒险
 * - 导航：图鉴 (Tab)、练习 (Tab)、我的 (Tab)、设置 (Header)
 *
 * ## Basic Layout
 * Immersive: 透明渐变背景 + Header + 滚动 Main + 悬浮 FAB + Tab Bar
 *
 * ## Reuse Components
 * - `MainTabBar` (图鉴、练习、我的)
 *
 * ## Page Layout
 * 外层容器满高 `h-screen`，绝对定位固定背景层（从上到下渐变天蓝到草绿）。
 *
 * **Header**: scroll-reveal / sticky 磨砂玻璃效果 nav-bar
 * - 左侧：房屋图标 + 文本 "3"（已解锁数量）
 * - 右侧：设置齿轮图标（导航至 /settings）
 *
 * **Main** `flex-1 overflow-y-auto relative` (内容在渐变背景上滚动):
 * 1. **房间卡片列表** (list, 居中垂直排列, 间距 16px):
 *    - 布局: `relative` 容器 (宽311px)
 *    - 图像层: 顶部居中 311x169px
 *    - 边框装饰层: `absolute` 底部对齐，比图像高 18px
 *    - 内容: 顶部居中章节名；左下角进度标签；右下角状态标签
 *    - 卡片状态:
 *      - Card 1: 橙色主题，状态"进行中"
 *      - Card 2: 略微灰度，状态"已完成"
 *      - Card 3: 灰色遮罩 + 🔒，状态"未解锁"
 * 2. **底部场景图** (占位): `h-[350px] w-full`，草绿色背景，居中文本 "🖼️ 底部场景图"
 *
 * **Overlay**:
 * - 悬浮按钮 (FAB): fixed bottom-right，圆形64px，播放图标 "▶"
 *
 * **Bottom**: Reuse `MainTabBar`
 *
 * ## Mock Data
 * 房间列表：
 * 1. "街角流浪 · Street Corner" - 进度 1/4 - 进行中
 * 2. "温馨小屋 · Cozy Room" - 进度 4/4 - 已完成
 * 3. "神秘花园 · Secret Garden" - 进度 0/4 - 未解锁
 *
 * ## Reference
 * - site-map.md
 * </page-design>
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { MainTabBar } from '@/components/function/MainTabBar'
import { useGameStore } from '@/store/GameContext'
import { getCatImageSrc, getCatRoomImageSrc, type GameState } from '@/store/gameStore'
import { CHAPTERS } from '@/data/chapters'
import { preloadImages } from '@/lib/imageCache'

const BirdSvg = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <path fill="currentColor" d="M 12 4 C 8.6 4 5.9 6.8 6 10.2 C 6 10.9 5.8 11.6 5.5 12.2 L 3 17 L 6.2 16.3 C 7.5 18.5 9.7 20 12.5 20 C 16.6 20 20 16.4 20 12 V 9 C 20 6.2 17.8 4 15 4 H 12 Z"/>
    {/* Beak */}
    <path fill="currentColor" d="M 20 8.5 L 23 10 L 20 11.5 Z"/>
    {/* Eye */}
    <circle cx="16.5" cy="8" r="1.2" fill="#5A3A31"/>
    {/* Wing */}
    <path className="home-roof-bird__wing" fill="#ffffff" fillOpacity="0.6" d="M 12.5 10 C 14.5 10 15.5 12 14.5 14.5 C 13.5 17 11.5 18 9.5 17 C 7.5 16 7.5 13 8.5 11.5 C 9.5 10 11 10 12.5 10 Z"/>
  </svg>
)

const PAPER_FAB_FALLBACK_IMAGE_URL =
  'https://workers.paper.design/file-assets/01KKNBS08ZA5774YRC17FK851S/01KM676Q1YAXV1MJ9VC50EBM6S.png'
const EMPTY_ROOM_LOCKED_OVERLAY_SRC = '/assets/rooms/empty/locked-overlay.png'

type RoomStatus = 'empty' | 'available' | 'in_progress' | 'completed' | 'locked'

interface Room {
  id: number
  nameCn: string
  nameEn: string
  progress: string
  stage: number
  status: RoomStatus
  themeColor: string
}

/** 使用公共章节元数据 */
const chapterMeta = CHAPTERS

const statusLabel: Record<RoomStatus, string> = {
  empty: '',
  available: '已开启',
  in_progress: '进行中',
  completed: '已完成',
  locked: '未解锁',
}

const statusBgColor: Record<RoomStatus, string> = {
  empty: 'transparent',
  available: 'var(--color-primary)',
  in_progress: 'var(--color-primary)',
  completed: 'var(--color-success)',
  locked: 'var(--color-text-disabled)',
}

function getCompletedLevelCount(
  chapterId: number,
  completedLevels: GameState['completedLevels'],
): number {
  let count = 0
  for (let levelId = 1; levelId <= 4; levelId += 1) {
    if (completedLevels[`${chapterId}-${levelId}`]) {
      count += 1
    }
  }
  return count
}

function RoomCard({ room, emptyUnlocked, onClick }: { room: Room; emptyUnlocked?: boolean; onClick?: () => void }) {
  const isLocked = room.status === 'locked'
  const isEmpty = room.status === 'empty'
  const isCompleted = room.status === 'completed'
  const [bgLoaded, setBgLoaded] = useState(false)

  return (
    <div
      className={`home-room-card${isLocked ? ' home-room-card--locked' : ''}${isEmpty ? ' home-room-card--empty' : ''}`}
      data-room-id={room.id}
      onClick={onClick}
    >
      {/* 层1：房间背景图（独立） */}
      <div
        className="home-room-card__bg"
        style={{
          backgroundColor: bgLoaded ? 'transparent' : (isEmpty ? '#F5EDE8' : room.themeColor),
          filter: isCompleted ? 'saturate(0.7)' : undefined,
        }}
      >
        <img
          src={isEmpty ? '/assets/rooms/empty/bg.jpg' : `/assets/rooms/ch${room.id}/progress/stage${room.stage}.jpg`}
          alt={isEmpty ? '空房间' : room.nameCn}
          className="home-room-card__bg-img"
          onLoad={() => setBgLoaded(true)}
          onError={(e) => {
            setBgLoaded(false)
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        {(isLocked || isEmpty) && (
          <div
            className="home-room-card__locked-cover"
            style={{ opacity: (isEmpty && emptyUnlocked) ? 0 : 1 }}
          >
            <img
              src={EMPTY_ROOM_LOCKED_OVERLAY_SRC}
              alt=""
              className="home-room-card__locked-cover-img"
            />
          </div>
        )}
      </div>

      {/* 层2：边框 + 文案（成组，宽度跟随边框图） */}
      <div className="home-room-card__frame">
        <img
          src="/assets/rooms/borders/border.png"
          alt=""
          className="home-room-card__border"
        />
        {room.nameCn && (
          <div className="home-room-card__name">
            {room.nameEn ? `${room.nameCn} · ${room.nameEn}` : room.nameCn}
          </div>
        )}
      </div>
    </div>
  )
}

const hasScrolledRef = { current: false }

function Home() {
  const navigate = useNavigate()
  const { gameState, updateGameState } = useGameStore()
  const [showSettings, setShowSettings] = useState(false)
  const [fabImageSrc, setFabImageSrc] = useState('/assets/ui/buttons/btn-quick-start.png')
  const [fabHasVisualAsset, setFabHasVisualAsset] = useState(true)
  const [settingsBgLoaded, setSettingsBgLoaded] = useState(false)

  const rooms = useMemo<Room[]>(() => {
    return chapterMeta.map((chapter) => {
      const completedCount = getCompletedLevelCount(chapter.id, gameState.completedLevels)
      const stage = Math.min(completedCount, 4)
      const status: RoomStatus =
        chapter.id > gameState.currentChapter
          ? 'locked'
          : completedCount >= 4
            ? 'completed'
            : completedCount > 0
              ? 'in_progress'
              : 'available'

      return {
        id: chapter.id,
        nameCn: chapter.nameCn,
        nameEn: chapter.nameEn,
        progress: `${stage}/4`,
        stage,
        status,
        themeColor: chapter.themeColor,
      }
    })
  }, [gameState.completedLevels, gameState.currentChapter])

  const allRoomsCompleted = rooms.every((r) => r.status === 'completed')

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeChapterId = gameState.currentChapter
  const activeLevelId = gameState.currentLevel

  useEffect(() => {
    const completedCount = getCompletedLevelCount(activeChapterId, gameState.completedLevels)
    const stage = Math.min(completedCount, 4)
    const srcs = [
      `/assets/rooms/ch${activeChapterId}/progress/stage${stage}.jpg`,
      getCatImageSrc(gameState.cat),
      getCatRoomImageSrc(gameState.cat, activeChapterId),
    ].filter(Boolean)
    preloadImages(srcs)
  }, [activeChapterId, gameState.cat, gameState.completedLevels])

  useEffect(() => {
    if (hasScrolledRef.current) return
    const container = scrollRef.current
    const el = bottomRef.current
    if (!container || !el) return

    const scroll = () => el.scrollIntoView({ block: 'end' })
    scroll()

    const observer = new ResizeObserver(scroll)
    observer.observe(container)

    const timer = setTimeout(() => {
      observer.disconnect()
      hasScrolledRef.current = true
    }, 2000)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  const handleRoomCardClick = (room: Room) => {
    if (room.status === 'locked') return
    navigate(`/rooms/${room.id}`)
  }

  const handleFabClick = () => {
    navigate(`/chapter/${activeChapterId}/level/${activeLevelId}`)
  }

  return (
    <div className="home-page">
      {/* 1. Full-screen fixed gradient background */}
      <div className="home-bg" />

      {/* 2. Fixed top navigation bar */}
      <div className="home-header">
        <div className="home-header__inner">
          <div className="home-header__left" />

          {/* Right: settings gear */}
          <button
            className="home-header__settings-btn"
            onClick={() => setShowSettings(true)}
          >
            <Icon icon="lucide:settings" className="home-header__settings-icon" />
          </button>
        </div>
      </div>

      {/* 3. Scrollable room card list — reversed so ch1 is at bottom (tower layout) */}
      <div className="home-scroll" ref={scrollRef}>
        {/* Blue gradient behind top scene, extends down to empty room */}
        <div className="home-top-gradient" />

        {/* Top scene (above empty room, overlaps gradient) */}
        <div className="home-scene-placeholder home-scene-placeholder--top">
          <div className="home-chimney-smoke" aria-hidden="true">
            <span className="home-chimney-smoke__puff home-chimney-smoke__puff--1" />
            <span className="home-chimney-smoke__puff home-chimney-smoke__puff--2" />
            <span className="home-chimney-smoke__puff home-chimney-smoke__puff--3" />
            <span className="home-chimney-smoke__puff home-chimney-smoke__puff--big" />
          </div>
          <div className="home-roof-birds" aria-hidden="true">
            <div className="home-roof-bird home-roof-bird--yellow home-roof-bird--red-path">
              <BirdSvg className="home-roof-bird__svg" />
            </div>
            <div className="home-roof-bird home-roof-bird--cyan home-roof-bird--red-path-partner">
              <BirdSvg className="home-roof-bird__svg" />
            </div>
            <div className="home-roof-bird home-roof-bird--yellow home-roof-bird--green-path">
              <BirdSvg className="home-roof-bird__svg" />
            </div>
            <div className="home-roof-bird home-roof-bird--cyan home-roof-bird--green-path-partner">
              <BirdSvg className="home-roof-bird__svg" />
            </div>
          </div>
          <img
            src="/assets/ui/home-scene-top.png"
            alt=""
            className="home-scene-placeholder__img"
          />
        </div>

        {/* Empty room placeholder */}
        <RoomCard
          room={{ id: 0, nameCn: '这个房间里什么都没有哦～', nameEn: '', progress: '', stage: 0, status: 'empty', themeColor: 'transparent' }}
          emptyUnlocked={allRoomsCompleted}
        />

        {[...rooms].reverse().map((room) => (
          <RoomCard key={room.id} room={room} onClick={() => handleRoomCardClick(room)} />
        ))}

        {/* Gradient fade from sky to scene */}
        <div className="home-scene-fade" />

        {/* 4. Bottom scene */}
        <div className="home-scene-placeholder">
          <img
            src="/assets/ui/home-scene.png"
            alt=""
            className="home-scene-placeholder__img"
          />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* 5. Floating nav buttons — left side */}
      <MainTabBar />

      {/* 6. FAB — fixed bottom-right */}
      {/* 🖼️ ASSET | 快速开始按钮 | PNG @3x | /assets/ui/buttons/btn-quick-start.png */}
      <button
        className={`fab ${fabHasVisualAsset ? 'fab--image-only' : 'fab--fallback-shell'}`}
        onClick={handleFabClick}
      >
        {fabHasVisualAsset && (
          <img
            className="fab__img"
            src={fabImageSrc}
          alt="Start"
          onError={(e) => {
            if (fabImageSrc === PAPER_FAB_FALLBACK_IMAGE_URL) {
              setFabHasVisualAsset(false)
              return
            }
            setFabImageSrc(PAPER_FAB_FALLBACK_IMAGE_URL)
          }}
          />
        )}
      </button>

      {/* 7. Settings Modal */}
      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div
            className="home-settings-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 🖼️ ASSET | 设置弹窗背景 | PNG @3x | /assets/ui/settings-bg.png */}
            <img
              className="home-settings-popup__bg-img"
              src="/assets/ui/settings-bg.png"
              alt=""
              onLoad={() => {
                setSettingsBgLoaded(true)
              }}
              onError={(e) => {
                setSettingsBgLoaded(false)
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            {!settingsBgLoaded && <div className="home-settings-popup__fallback-bg" />}

            <div className="home-settings-popup__content">
              {/* 弹窗主体 */}
              <div className="home-settings-popup__body">
                {/* 声音 & 震动 */}
                <div className="home-settings-popup__section-label">声音 &amp; 震动</div>

                {/* 音乐 / 音效 / 朗读 三格 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  {([
                    { key: 'musicEnabled' as const, icon: 'lucide:music', label: '音乐' },
                    { key: 'soundEnabled' as const, icon: 'lucide:volume-2', label: '音效' },
                    { key: 'ttsEnabled' as const, icon: 'lucide:mic', label: '朗读' },
                  ]).map(({ key, icon, label }) => {
                    const on = gameState.settings[key]
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() =>
                            updateGameState((prev) => ({
                              ...prev,
                              settings: { ...prev.settings, [key]: !prev.settings[key] },
                            }))
                          }
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: on ? '#4ECDC4' : 'rgba(93,64,55,0.1)',
                            boxShadow: on ? '0 4px 0 0 #3BA89F' : '0 4px 0 0 rgba(93,64,55,0.06)',
                            transition: 'transform 80ms ease, box-shadow 80ms ease',
                          }}
                          onPointerDown={(e) => {
                            const el = e.currentTarget
                            el.style.transform = 'translateY(3px)'
                            el.style.boxShadow = on ? '0 1px 0 0 #3BA89F' : '0 1px 0 0 rgba(93,64,55,0.06)'
                          }}
                          onPointerUp={(e) => {
                            const el = e.currentTarget
                            el.style.transform = ''
                            el.style.boxShadow = ''
                          }}
                          onPointerLeave={(e) => {
                            const el = e.currentTarget
                            el.style.transform = ''
                            el.style.boxShadow = ''
                          }}
                        >
                          <Icon
                            icon={icon}
                            style={{ width: 26, height: 26, color: on ? '#FFFFFF' : 'rgba(93,64,55,0.3)' }}
                          />
                        </button>
                        <span style={{ fontSize: 11, color: 'rgba(93,64,55,0.45)', fontWeight: 600 }}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 分割线 */}
                <div className="home-settings-popup__divider" />

                <div className="home-settings-popup__team">
                  👩‍💻 猫卷装修队
                </div>
                <div className="home-settings-popup__version">
                  VERSION: 1.3.0
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
