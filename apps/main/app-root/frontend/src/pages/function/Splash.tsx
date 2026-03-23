/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 启动页，显示 Logo + 产品名 + 加载动画，2 秒后自动跳转。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Page Layout
 * 全屏橙色背景，垂直居中：Logo → 产品名 → slogan → 三圆点加载动画
 * 2 秒后淡出并跳转（onboardingDone ? / : /onboarding/level）
 * </page-design>
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/GameContext'

function Splash() {
  const navigate = useNavigate()
  const { gameState } = useGameStore()
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1700)
    const navTimer = setTimeout(() => {
      navigate(gameState.onboardingDone ? '/' : '/onboarding/level', { replace: true })
    }, 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [gameState.onboardingDone, navigate])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#FFB840',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        opacity: fading ? 0 : 1,
        transition: 'opacity 300ms ease',
        zIndex: 200,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* 🖼️ ASSET | App Logo | PNG @3x | /assets/ui/logo.png */}
        <img
          src="/assets/ui/logo.png"
          alt="WordPet"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <span style={{ position: 'absolute', fontSize: 80, lineHeight: 1 }}>🐱</span>
      </div>

      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: 'white',
          letterSpacing: 2,
          marginTop: 16,
        }}
      >
        WordPet
      </div>

      <div
        style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.8)',
          marginTop: 8,
          fontStyle: 'italic',
        }}
      >
        Learn, play, purr.
      </div>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'white',
              opacity: 0.6,
              animation: `splashBounce 600ms ${i * 150}ms ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

export default Splash
