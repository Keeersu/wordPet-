/*
 * FurnitureReveal - 家具解锁全屏动画组件
 *
 * 答题完成后的震撼家具揭晓动画：
 * - 深色遮罩背景 + 粒子/星光效果
 * - 家具图从 scale(0) 弹性放大到 scale(1)，配合光晕扩散
 * - 家具名称 + "新家具已解锁！" 文字动画
 * - 底部「太棒了！」按钮，点击后进入结算详情
 *
 * Style referenceFiles: src/styles/result.css
 */

import { useState, useEffect, useCallback } from 'react'
import { useAudio } from '@/lib/audio/useAudio'

// ─── 样式常量 ─────────────────────────────────────────────────────────────────

const ANIM_TOTAL_MS = 2800 // 整个入场动画总时长

// ─── 粒子 / 星光配置 ──────────────────────────────────────────────────────────

interface Particle {
  id: number
  x: number // % 偏移
  y: number
  size: number
  delay: number
  dur: number
  color: string
  angle: number // 散射角度 deg
  distance: number // 散射距离 px
}

function generateParticles(count: number): Particle[] {
  const colors = [
    '#FFD700', // 金色
    '#FFA500', // 橙金
    '#FFE066', // 浅金
    '#FFFFFF', // 白色
    '#FFB840', // 主题色
    '#FF9800', // 深橙
    '#FFF59D', // 淡黄
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 10, // 集中在中央附近
    y: 50 + (Math.random() - 0.5) * 10,
    size: 3 + Math.random() * 6,
    delay: 400 + Math.random() * 600, // 在家具出现后散射
    dur: 800 + Math.random() * 800,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: (360 / count) * i + (Math.random() - 0.5) * 30,
    distance: 80 + Math.random() * 140,
  }))
}

// ─── 星星配置 ──────────────────────────────────────────────────────────────────

interface Star {
  id: number
  x: number
  y: number
  size: number
  delay: number
  dur: number
  opacity: number
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 2000,
    dur: 1200 + Math.random() * 1500,
    opacity: 0.3 + Math.random() * 0.7,
  }))
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

interface FurnitureRevealProps {
  furnitureName: string
  furnitureEmoji: string
  furnitureImage: string // /assets/rooms/ch{id}/furniture/lv{levelId}/full.png
  chapterId: number
  levelId: number
  onContinue: () => void
  onGoToRoom?: () => void
}

export default function FurnitureReveal({
  furnitureName,
  furnitureEmoji,
  furnitureImage,
  onContinue,
  onGoToRoom,
}: FurnitureRevealProps) {
  const { playSfx, playBgm } = useAudio()
  const [phase, setPhase] = useState<'enter' | 'idle'>('enter')
  const [showButton, setShowButton] = useState(false)
  const [particles] = useState(() => generateParticles(24))
  const [stars] = useState(() => generateStars(30))
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    playBgm('entrance')
    const sfxTimer = setTimeout(() => playSfx('furniture-unlock'), 200)
    const t1 = setTimeout(() => setPhase('idle'), ANIM_TOTAL_MS)
    const t2 = setTimeout(() => setShowButton(true), ANIM_TOTAL_MS + 200)
    return () => {
      clearTimeout(sfxTimer)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = useCallback(() => {
    onContinue()
  }, [onContinue])

  return (
    <div className="furniture-reveal">
      {/* ── 背景星光 ── */}
      {stars.map((s) => (
        <div
          key={`star-${s.id}`}
          className="furniture-reveal__star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `starTwinkle ${s.dur}ms ${s.delay}ms ease-in-out infinite`,
          }}
        />
      ))}

      {/* ── 中央光晕 ── */}
      <div className="furniture-reveal__glow" />

      {/* ── 外环光圈 ── */}
      <div className="furniture-reveal__ring" />

      {/* ── 散射粒子 ── */}
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.distance
        const ty = Math.sin(rad) * p.distance
        return (
          <div
            key={`p-${p.id}`}
            className="furniture-reveal__particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `particleBurst ${p.dur}ms ${p.delay}ms cubic-bezier(.22,1,.36,1) forwards`,
              // @ts-ignore CSS custom property for particle direction
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            } as React.CSSProperties}
          />
        )
      })}

      {/* ── 家具展示区 ── */}
      <div className="furniture-reveal__container">
        {/* 家具图 / Emoji fallback */}
        <div
          className="furniture-reveal__img-wrapper"
          style={{
            animation: phase === 'enter'
              ? 'furniturePopIn 900ms 200ms cubic-bezier(.34,1.56,.64,1) forwards'
              : undefined,
            opacity: phase === 'idle' ? 1 : 0,
            transform: phase === 'idle' ? 'scale(1)' : 'scale(0)',
          }}
        >
          {!imgFailed ? (
            <img
              src={furnitureImage}
              alt={furnitureName}
              className="furniture-reveal__img"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="furniture-reveal__emoji-large">{furnitureEmoji}</span>
          )}
        </div>

        {/* "新家具已解锁！" 标签 */}
        <div className="furniture-reveal__badge">
          <span className="furniture-reveal__badge-emoji furniture-reveal__badge-emoji--left">✨</span>
          新家具已解锁！
          <span className="furniture-reveal__badge-emoji furniture-reveal__badge-emoji--right">✨</span>
        </div>

        {/* 家具名称 */}
        <div className="furniture-reveal__name">
          {furnitureName}
        </div>

        {/* "恭喜获得" 副标题 */}
        <div className="furniture-reveal__congrats">
          恭喜获得新家具，房间更温馨了~
        </div>
      </div>

      {/* ── 底部按钮区 ── */}
      <div
        className="furniture-reveal__btn-area"
        style={{
          opacity: showButton ? 1 : 0,
          transform: showButton ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 500ms ease, transform 500ms ease',
        }}
      >
        {onGoToRoom && (
          <button
            onClick={onGoToRoom}
            className="furniture-reveal__room-btn"
          >
            回房间
          </button>
        )}
        <button
          onClick={handleContinue}
          className="btn-primary furniture-reveal__continue-btn"
        >
          太棒了！🎉
        </button>
      </div>
    </div>
  )
}
