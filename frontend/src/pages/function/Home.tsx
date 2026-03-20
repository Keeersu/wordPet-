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

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { MainTabBar } from '@/components/function/MainTabBar'
import { pageLinks } from '../../pageLinks'
import { useGameStore } from '@/store/GameContext'
import type { GameState } from '@/store/gameStore'
import { CHAPTERS } from '@/data/chapters'

type RoomStatus = 'in_progress' | 'completed' | 'locked'

interface Room {
  id: number
  nameCn: string
  nameEn: string
  progress: string
  status: RoomStatus
  themeColor: string
}

/** 使用公共章节元数据 */
const chapterMeta = CHAPTERS

const statusLabel: Record<RoomStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  locked: '未解锁',
}

const statusBgColor: Record<RoomStatus, string> = {
  in_progress: '#FFB840',
  completed: '#4CAF50',
  locked: '#9E9E9E',
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

function RoomCard({ room, onClick }: { room: Room; onClick?: () => void }) {
  const isLocked = room.status === 'locked'
  const isCompleted = room.status === 'completed'

  return (
    <div
      className={`home-room-card${isLocked ? ' home-room-card--locked' : ''}`}
      onClick={onClick}
      style={{
        filter: isCompleted ? 'saturate(0.7)' : isLocked ? 'grayscale(0.8)' : undefined,
        opacity: isLocked ? 0.7 : 1,
      }}
    >
      {/* 层1：房间背景色块，底部对齐 */}
      <div
        className="home-room-card__bg"
        style={{ backgroundColor: room.themeColor }}
      >
        {isLocked && (
          <div className="home-room-card__lock">
            <span>🔒</span>
          </div>
        )}
      </div>

      {/* 层2：边框占位，整体覆盖 */}
      <div className="home-room-card__border" />

      {/* 章节名称，在顶部区域内 */}
      <div className="home-room-card__name">
        {room.nameCn} · {room.nameEn}
      </div>

      {/* 进度标签 */}
      <div className="home-room-card__progress">
        {room.progress}
      </div>

      {/* 状态标签 */}
      <div
        className="home-room-card__status"
        style={{ background: statusBgColor[room.status] }}
      >
        {statusLabel[room.status]}
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { gameState, updateGameState } = useGameStore()
  const [showSettings, setShowSettings] = useState(false)

  const rooms = useMemo<Room[]>(() => {
    return chapterMeta.map((chapter) => {
      const completedCount = getCompletedLevelCount(chapter.id, gameState.completedLevels)
      const status: RoomStatus =
        chapter.id > gameState.currentChapter
          ? 'locked'
          : completedCount >= 4
            ? 'completed'
            : 'in_progress'

      return {
        id: chapter.id,
        nameCn: chapter.nameCn,
        nameEn: chapter.nameEn,
        progress: `${Math.min(completedCount, 4)}/4`,
        status,
        themeColor: chapter.themeColor,
      }
    })
  }, [gameState.completedLevels, gameState.currentChapter])

  const unlockedRoomCount = rooms.filter((room) => room.status !== 'locked').length
  const activeChapterId = gameState.currentChapter
  const activeLevelId = gameState.currentLevel

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
          {/* Left: house icon + unlocked room count */}
          <div className="home-header__room-count">
            <Icon icon="lucide:home" className="home-header__room-count-icon" />
            <span className="home-header__room-count-text">{unlockedRoomCount}</span>
          </div>

          {/* Right: settings gear */}
          <button
            className="home-header__settings-btn"
            onClick={() => setShowSettings(true)}
          >
            <Icon icon="lucide:settings" className="home-header__settings-icon" />
          </button>
        </div>
      </div>

      {/* 3. Scrollable room card list */}
      <div className="home-scroll">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onClick={() => handleRoomCardClick(room)} />
        ))}

        {/* 4. Bottom scene placeholder */}
        <div className="home-scene-placeholder">
          🌿 底部场景图占位
        </div>
      </div>

      {/* 5. Floating nav buttons — left side */}
      <MainTabBar />

      {/* 6. FAB — fixed bottom-right */}
      {/* 🖼️ ASSET | 快速开始按钮 | PNG @3x | /assets/ui/buttons/btn-quick-start.png */}
      <button className="fab" onClick={handleFabClick}>
        <img
          className="fab__img"
          src="/assets/ui/buttons/btn-quick-start.png"
          alt="Start"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
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
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="home-settings-popup__fallback-bg" />

            <div className="home-settings-popup__content">
              {/* 橙色横幅标题 */}
              <div className="home-settings-popup__banner">
                ⚙️ 设置
              </div>

              {/* 弹窗主体 */}
              <div className="home-settings-popup__body">
                {/* 音乐 / 音效 / 朗读 三列 */}
                <div className="home-settings-popup__grid">
                  {/* 音乐 */}
                  <div>
                    <div className="home-settings-popup__grid-label">音乐</div>
                    <button
                      className={`settings-toggle-btn ${gameState.settings.musicEnabled ? 'settings-toggle-btn--on' : 'settings-toggle-btn--off'}`}
                      onClick={() =>
                        updateGameState((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, musicEnabled: !prev.settings.musicEnabled },
                        }))
                      }
                    >
                      🎵 {gameState.settings.musicEnabled ? '开' : '关'}
                    </button>
                  </div>

                  {/* 音效 */}
                  <div>
                    <div className="home-settings-popup__grid-label">音效</div>
                    <button
                      className={`settings-toggle-btn ${gameState.settings.soundEnabled ? 'settings-toggle-btn--on' : 'settings-toggle-btn--off'}`}
                      onClick={() =>
                        updateGameState((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
                        }))
                      }
                    >
                      🔊 {gameState.settings.soundEnabled ? '开' : '关'}
                    </button>
                  </div>

                  {/* 朗读 */}
                  <div>
                    <div className="home-settings-popup__grid-label">朗读</div>
                    <button
                      className={`settings-toggle-btn ${gameState.settings.ttsEnabled ? 'settings-toggle-btn--on' : 'settings-toggle-btn--off'}`}
                      onClick={() =>
                        updateGameState((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, ttsEnabled: !prev.settings.ttsEnabled },
                        }))
                      }
                    >
                      🗣️ {gameState.settings.ttsEnabled ? '开' : '关'}
                    </button>
                  </div>
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
