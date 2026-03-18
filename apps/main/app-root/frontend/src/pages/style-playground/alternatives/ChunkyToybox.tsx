/**
 * ============================================================
 * Style Playground — Auto-generated metadata
 * ============================================================
 * Device: mobile
 * Language: Chinese
 *
 * ## Style Direction (from analysis)
 * <style-name>ChunkyToybox</style-name>
 * 
 * ### Mode
 * Light Mode (Optimized for friendly, casual daytime learning and high legibility).
 * 
 * ### Style Recipe
 * - **Core Visual Style:** Gamified / Chunky (Playful Family). Emphasizes tactile, physical interactions reminiscent of building blocks or pop-up books.
 * - **Layout Structure:** Bento Box / Modular. Adventure rooms and word collections are encapsulated in distinct, playful cards that feel like collectible items.
 * - **Visual Complexity:** Balanced. Keeps cognitive load low for learning while maintaining high visual interest through colors and shapes.
 * 
 * ### Implementation Techniques
 * - **Material & Textures:** Flat, opaque surfaces with zero gradients or glassmorphism. The aesthetic relies entirely on crisp vector shapes and high-contrast color blocking.
 * - **Shadows & Lighting:** Strictly solid shadows with zero blur (`0 4px 0 0 #C07800` for primary elements). This creates a physical, tactile "push" effect when interactive elements are tapped (the shadow compresses to 0px and the element translates down 4px).
 * - **Borders & Radii:** Heavy use of white borders (2px-4px) around colorful shapes to give them a "die-cut sticker" or "plastic toy" feel. Strict adherence to defined radii: 8px (small badges/tags), 12px (standard word cards), and 20px (large adventure room panels).
 * - **Typography:** English text uses **Nunito**, perfectly matching the rounded, friendly visual language. Chinese text uses **PingFang SC** for crisp legibility. Text color is deep brown (#5D4037) rather than harsh black, maintaining the warm, organic feel of a pet-themed app.
 * 
 * ### Color Direction
 * A warm, highly saturated "candy and cream" palette. The background is a comforting cream white (`#FFF8E7`), preventing eye strain during study sessions. The primary interactive color is a vibrant warm yellow (`#FFB840`), used for major actions and the cat's thematic elements. A striking teal (`#4ECDC4`) serves as a secondary accent for progress bars, secondary buttons, or specific room themes, providing excellent contrast against the yellow. Feedback colors (Success: `#66BB6A`, Error: `#EF5350`) are equally vibrant to provide immediate, clear gamified feedback during vocabulary quizzes.
 * ============================================================
 */

import { useState } from 'react'
import { Icon } from '@iconify/react'

export default function HomePreview() {
  const [activeTab, setActiveTab] = useState('')
  
  const rooms = [
    {
      id: 1,
      name: "街角流浪",
      enName: "Street Corner",
      progress: "1/4",
      status: "进行中",
      bgColor: "#F5E6C8",
      isLocked: false,
    },
    {
      id: 2,
      name: "温暖新家",
      enName: "Warm Home",
      progress: "4/4",
      status: "已完成",
      bgColor: "#C8E8F5",
      isLocked: false,
    },
    {
      id: 3,
      name: "幼儿园",
      enName: "Kindergarten",
      progress: "0/4",
      status: "未解锁",
      bgColor: "#E0E0E0",
      isLocked: true,
    }
  ]

  return (
    <div className="w-[390px] min-h-[844px] h-screen mx-auto flex flex-col overflow-hidden scrollbar-hidden bg-[#FFF8E7] font-['PingFang_SC','Nunito',sans-serif] text-[#5D4037] relative">
      
      {/* Immersive Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB]/30 to-[#98FB98]/30 pointer-events-none" />

      {/* Header */}
      <div className="flex-none flex flex-col pt-[var(--safe-area-inset-top,44px)] relative z-10 bg-white/40 backdrop-blur-md border-b-2 border-white">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[12px] border-2 border-[#5D4037]/10 shadow-[0_2px_0_0_rgba(93,64,55,0.1)]">
            <Icon icon="lucide:home" className="text-[#FFB840] w-5 h-5" />
            <span className="font-bold text-lg">3</span>
          </div>
          <button className="bg-white p-2 rounded-[12px] border-2 border-[#5D4037]/10 shadow-[0_2px_0_0_rgba(93,64,55,0.1)] active:translate-y-[2px] active:shadow-none transition-all">
            <Icon icon="lucide:settings" className="text-[#5D4037] w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content — scrollable card list */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '80px',
          paddingBottom: '90px',
          overflowY: 'auto',
        }}
        className="scrollbar-hidden relative z-10"
      >
        {rooms.map((room) => (
          <div
            key={room.id}
            style={{
              position: 'relative',
              width: '311px',
              height: '210px',
              margin: '0 auto',
              flexShrink: 0,
              opacity: room.isLocked ? 0.7 : 1,
              filter: room.isLocked ? 'grayscale(0.8)' : room.status === '已完成' ? 'saturate(0.7)' : undefined,
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
                backgroundColor: room.bgColor,
                borderRadius: '12px',
              }}
            >
              {room.isLocked && (
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
              {room.name} · {room.enName}
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
                background: room.status === '已完成' ? '#4CAF50' : room.status === '进行中' ? '#FFB840' : '#9E9E9E',
                borderRadius: '8px',
                padding: '4px 12px',
                fontSize: '12px',
                color: 'white',
              }}
            >
              {room.status}
            </div>
          </div>
        ))}

        {/* Bottom Scene Placeholder */}
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
      </main>

      {/* Floating nav buttons — left side */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(24px + env(safe-area-inset-bottom, 34px))',
          left: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-end',
          zIndex: 40,
        }}
      >
        {[
          { id: 'collection', icon: 'lucide:book-open', label: '图鉴' },
          { id: 'practice', icon: 'lucide:gamepad-2', label: '练习' },
          { id: 'profile', icon: 'lucide:user', label: '我的' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon
              icon={tab.icon}
              style={{
                width: '18px',
                height: '18px',
                color: activeTab === tab.id ? '#FFB840' : 'rgba(93,64,55,0.4)',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                marginTop: '1px',
                color: activeTab === tab.id ? '#FFB840' : 'rgba(93,64,55,0.4)',
                fontWeight: activeTab === tab.id ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* FAB — absolute within container, right side */}
      <button
        className="active:translate-y-[4px] active:shadow-none transition-all"
        style={{
          position: 'absolute',
          bottom: 'calc(24px + env(safe-area-inset-bottom, 34px))',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#FFB840',
          border: '3px solid white',
          boxShadow: '0 4px 0 0 #A06800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          cursor: 'pointer',
        }}
      >
        <Icon icon="lucide:play" style={{ width: '28px', height: '28px', color: 'white', marginLeft: '2px' }} />
      </button>

    </div>
  )
}
