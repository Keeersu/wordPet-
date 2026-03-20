/*
 * FurnitureReveal - 家具解锁全屏动画组件
 *
 * 答题完成后的震撼家具揭晓动画：
 * - 深色遮罩背景 + 粒子/星光效果
 * - 家具图从 scale(0) 弹性放大到 scale(1)，配合光晕扩散
 * - 家具名称 + "新家具已解锁！" 文字动画
 * - 底部「太棒了！」按钮，点击后进入结算详情
 */

import { useState, useEffect, useCallback } from 'react'

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
}

export default function FurnitureReveal({
  furnitureName,
  furnitureEmoji,
  furnitureImage,
  onContinue,
}: FurnitureRevealProps) {
  const [phase, setPhase] = useState<'enter' | 'idle'>('enter')
  const [showButton, setShowButton] = useState(false)
  const [particles] = useState(() => generateParticles(24))
  const [stars] = useState(() => generateStars(30))
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('idle'), ANIM_TOTAL_MS)
    const t2 = setTimeout(() => setShowButton(true), ANIM_TOTAL_MS + 200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const handleContinue = useCallback(() => {
    onContinue()
  }, [onContinue])

  return (
    <div style={styles.overlay}>
      {/* ── 注入 @keyframes ── */}
      <style>{keyframes}</style>

      {/* ── 背景星光 ── */}
      {stars.map((s) => (
        <div
          key={`star-${s.id}`}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            backgroundColor: '#FFE082',
            opacity: 0,
            animation: `starTwinkle ${s.dur}ms ${s.delay}ms ease-in-out infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── 中央光晕 ── */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,184,64,0.35) 0%, rgba(255,184,64,0.08) 40%, transparent 70%)',
          animation: 'glowPulse 2.4s 300ms ease-out forwards, glowBreath 3s 2.7s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── 外环光圈 ── */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 240,
          height: 240,
          borderRadius: '50%',
          border: '2px solid rgba(255,215,0,0.3)',
          animation: 'ringExpand 1.2s 500ms cubic-bezier(.34,1.56,.64,1) forwards',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ── 散射粒子 ── */}
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.distance
        const ty = Math.sin(rad) * p.distance
        return (
          <div
            key={`p-${p.id}`}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              opacity: 0,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `particleBurst ${p.dur}ms ${p.delay}ms cubic-bezier(.22,1,.36,1) forwards`,
              // @ts-ignore CSS custom property for particle direction
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              pointerEvents: 'none',
            } as React.CSSProperties}
          />
        )
      })}

      {/* ── 家具展示区 ── */}
      <div style={styles.furnitureContainer}>
        {/* 家具图 / Emoji fallback */}
        <div
          style={{
            ...styles.furnitureImageWrapper,
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
              style={styles.furnitureImg}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span style={styles.furnitureEmojiLarge}>{furnitureEmoji}</span>
          )}
        </div>

        {/* "新家具已解锁！" 标签 */}
        <div
          style={{
            ...styles.unlockBadge,
            animation: 'badgeFadeIn 600ms 1100ms ease-out forwards',
            opacity: 0,
          }}
        >
          <span style={{ fontSize: 14, marginRight: 4 }}>✨</span>
          新家具已解锁！
          <span style={{ fontSize: 14, marginLeft: 4 }}>✨</span>
        </div>

        {/* 家具名称 */}
        <div
          style={{
            ...styles.furnitureNameText,
            animation: 'nameFadeUp 700ms 1500ms ease-out forwards',
            opacity: 0,
            transform: 'translateY(12px)',
          }}
        >
          {furnitureName}
        </div>

        {/* "恭喜获得" 副标题 */}
        <div
          style={{
            ...styles.congratsText,
            animation: 'nameFadeUp 600ms 1800ms ease-out forwards',
            opacity: 0,
            transform: 'translateY(8px)',
          }}
        >
          恭喜获得新家具，房间更温馨了~
        </div>
      </div>

      {/* ── 底部「太棒了！」按钮 ── */}
      <div
        style={{
          ...styles.buttonArea,
          opacity: showButton ? 1 : 0,
          transform: showButton ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 500ms ease, transform 500ms ease',
        }}
      >
        <button
          onClick={handleContinue}
          style={styles.continueButton}
          onPointerDown={(e) => {
            const btn = e.currentTarget
            btn.style.transform = 'translateY(3px)'
            btn.style.boxShadow = '0 1px 0 0 #A06800'
          }}
          onPointerUp={(e) => {
            const btn = e.currentTarget
            btn.style.transform = ''
            btn.style.boxShadow = '0 4px 0 0 #A06800'
          }}
          onPointerLeave={(e) => {
            const btn = e.currentTarget
            btn.style.transform = ''
            btn.style.boxShadow = '0 4px 0 0 #A06800'
          }}
        >
          太棒了！🎉
        </button>
      </div>
    </div>
  )
}

// ─── @keyframes ────────────────────────────────────────────────────────────────

const keyframes = `
@keyframes furniturePopIn {
  0%   { opacity: 0; transform: scale(0); }
  60%  { opacity: 1; transform: scale(1.15); }
  80%  { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes glowPulse {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  50%  { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
}

@keyframes glowBreath {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 0.9; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes ringExpand {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  50%  { opacity: 0.6; }
  100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.6); }
}

@keyframes particleBurst {
  0%   { opacity: 1; transform: translate(0, 0) scale(1); }
  60%  { opacity: 0.8; }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.2); }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50%      { opacity: var(--star-opacity, 0.7); transform: scale(1); }
}

@keyframes badgeFadeIn {
  0%   { opacity: 0; transform: translateY(8px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes nameFadeUp {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
`

// ─── 样式对象 ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'radial-gradient(ellipse at 50% 40%, #1a1040 0%, #0d0820 50%, #06040f 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    fontFamily: "'Nunito', 'PingFang SC', sans-serif",
  },
  furnitureContainer: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: -30,
  },
  furnitureImageWrapper: {
    width: 160,
    height: 160,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '2.5px solid rgba(255,215,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(255,184,64,0.25), 0 0 80px rgba(255,184,64,0.1)',
  },
  furnitureImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: 12,
  },
  furnitureEmojiLarge: {
    fontSize: 72,
    lineHeight: 1,
  },
  unlockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 16px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,184,64,0.15) 100%)',
    border: '1px solid rgba(255,215,0,0.3)',
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  furnitureNameText: {
    fontSize: 26,
    fontWeight: 900,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    textShadow: '0 2px 16px rgba(255,184,64,0.4)',
    letterSpacing: 1,
    marginTop: 4,
  },
  congratsText: {
    fontSize: 14,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center' as const,
    marginTop: 0,
  },
  buttonArea: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px 32px calc(24px + env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 20,
  },
  continueButton: {
    width: '100%',
    maxWidth: 320,
    padding: '16px 32px',
    borderRadius: 18,
    border: '2.5px solid rgba(255,255,255,0.9)',
    backgroundColor: '#FFB840',
    color: '#3D1F00',
    fontWeight: 900,
    fontSize: 17,
    fontFamily: "'Nunito', 'PingFang SC', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 4px 0 0 #A06800',
    transition: 'transform 80ms ease, box-shadow 80ms ease',
    letterSpacing: 0.5,
  },
}
