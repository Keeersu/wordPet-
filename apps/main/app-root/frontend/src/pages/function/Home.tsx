/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 展示所有关卡房间的主页，用户可在此选择房间开始冒险学习。
 * Style referenceFiles:
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

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { MainTabBar } from '@/components/function/MainTabBar'
import { pageLinks } from '../../pageLinks'
import { useGameStore } from '@/store/GameContext'
import type { GameState } from '@/store/gameStore'

type RoomStatus = 'in_progress' | 'completed' | 'locked'

interface Room {
  id: number
  nameCn: string
  nameEn: string
  progress: string
  status: RoomStatus
  themeColor: string
}

const chapterMeta = [
  {
    id: 1,
    nameCn: '街角流浪',
    nameEn: 'Street Corner',
    themeColor: '#F5E6C8',
  },
  {
    id: 2,
    nameCn: '温暖新家',
    nameEn: 'Warm Home',
    themeColor: '#C8E8F5',
  },
  {
    id: 3,
    nameCn: '幼儿园',
    nameEn: 'Kindergarten',
    themeColor: '#D8F0FF',
  },
  {
    id: 4,
    nameCn: '公园探险',
    nameEn: 'Park Adventure',
    themeColor: '#E5F4D8',
  },
  {
    id: 5,
    nameCn: '厨房美食',
    nameEn: 'Kitchen Feast',
    themeColor: '#FFF0D9',
  },
] as const

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
      onClick={onClick}
      style={{
        position: 'relative',
        width: '311px',
        height: '210px',
        margin: '0 auto',
        flexShrink: 0,
        filter: isCompleted ? 'saturate(0.7)' : isLocked ? 'grayscale(0.8)' : undefined,
        opacity: isLocked ? 0.7 : 1,
        cursor: isLocked ? 'default' : 'pointer',
      }}
    >
      {/* 层1：房间背景色块，底部对齐 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '311px',
          height: '169px',
          backgroundColor: room.themeColor,
          borderRadius: '12px',
        }}
      >
        {isLocked && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '48px' }}>🔒</span>
          </div>
        )}
      </div>

      {/* 层2：边框占位，整体覆盖 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '311px',
          height: '210px',
          border: '2px solid rgba(255,255,255,0.9)',
          borderRadius: '16px',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* 章节名称，在顶部区域内 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '41px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3,
          fontSize: '12px',
          color: '#5D4037',
        }}
      >
        {room.nameCn} · {room.nameEn}
      </div>

      {/* 进度标签 */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 3,
          background: 'white',
          borderRadius: '8px',
          padding: '4px 8px',
          fontSize: '12px',
          color: '#5D4037',
        }}
      >
        {room.progress}
      </div>

      {/* 状态标签 */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 3,
          background: statusBgColor[room.status],
          borderRadius: '8px',
          padding: '4px 12px',
          fontSize: '12px',
          color: 'white',
        }}
      >
        {statusLabel[room.status]}
      </div>
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { gameState } = useGameStore()

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
    <div
      className="relative h-screen w-full flex flex-col overflow-hidden"
      style={{ fontFamily: "'Nunito', 'PingFang SC', sans-serif", color: '#5D4037' }}
    >
      {/* 1. Full-screen fixed gradient background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, #87CEEB, #D4EEC0)',
        }}
      />

      {/* 2. Sticky top navigation bar */}
      <div
        className="sticky top-0 z-30"
        style={{
          paddingTop: 52,
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: house icon + unlocked room count */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-[12px]"
            style={{
              backgroundColor: 'white',
              border: '2px solid rgba(93,64,55,0.1)',
              boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
            }}
          >
            <Icon icon="lucide:home" className="w-5 h-5" style={{ color: '#FFB840' }} />
            <span className="font-bold text-[16px]">{unlockedRoomCount}</span>
          </div>

          {/* Right: settings gear */}
          <button
            onClick={() => navigate(pageLinks.Settings())}
            className="p-2 rounded-[12px] active:translate-y-[2px] active:shadow-none transition-all"
            style={{
              backgroundColor: 'white',
              border: '2px solid rgba(93,64,55,0.1)',
              boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
            }}
          >
            <Icon icon="lucide:settings" className="w-6 h-6" style={{ color: '#5D4037' }} />
          </button>
        </div>
      </div>

      {/* 3. Scrollable room card list */}
      <div
        className="relative z-10 scrollbar-hidden"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '16px',
          paddingBottom: '90px',
          overflowY: 'auto',
        }}
      >
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onClick={() => handleRoomCardClick(room)} />
        ))}

        {/* 4. Bottom scene placeholder */}
        <div
          style={{
            width: '100%',
            height: '350px',
            flexShrink: 0,
            backgroundColor: '#C8E8C0',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(93,64,55,0.5)',
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          🌿 底部场景图占位
        </div>
      </div>

      {/* 5. Floating nav buttons — left side */}
      <MainTabBar />

      {/* 6. FAB — fixed bottom-right */}
      <button
        onClick={handleFabClick}
        className="fixed z-40 flex items-center justify-center rounded-full active:translate-y-[4px] active:shadow-none transition-all"
        style={{
          width: '56px',
          height: '56px',
          bottom: 'calc(24px + env(safe-area-inset-bottom, 34px))',
          right: '24px',
          backgroundColor: '#FFB840',
          border: '3px solid white',
          boxShadow: '0 4px 0 0 #A06800',
        }}
      >
        <Icon icon="lucide:play" style={{ width: '28px', height: '28px', color: 'white', marginLeft: '2px' }} />
      </button>
    </div>
  )
}

export default Home
