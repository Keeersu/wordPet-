/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 启动页，显示 Logo + 产品名 + 加载动画，2 秒后自动跳转。
 * Style referenceFiles: styles/splash.css
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
import { useAudio } from '@/lib/audio/useAudio'

function Splash() {
  const navigate = useNavigate()
  const { gameState } = useGameStore()
  const { playBgm } = useAudio()
  const [fading, setFading] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)

  useEffect(() => {
    playBgm('entrance')
    const fadeTimer = setTimeout(() => setFading(true), 1700)
    const navTimer = setTimeout(() => {
      navigate(gameState.onboardingDone ? '/' : '/onboarding/level', { replace: true })
    }, 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [gameState.onboardingDone, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`splash-page ${fading ? 'splash-page--fading' : ''}`}>
      {/* Logo */}
      <div className="splash-logo">
        {/* 🖼️ ASSET | App Logo | PNG @3x | /assets/ui/logo.png */}
        <img
          src="/assets/ui/logo.png"
          alt="WordPet"
          className="splash-logo__img"
          onLoad={() => {
            setLogoLoaded(true)
          }}
          onError={(e) => {
            setLogoLoaded(false)
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        {!logoLoaded && <span className="splash-logo__emoji">🐱</span>}
      </div>

      <div className="splash-title">WordPet</div>
      <div className="splash-slogan">Learn, play, purr.</div>

      {/* Loading dots */}
      <div className="splash-dots">
        <div className="splash-dot" />
        <div className="splash-dot" />
        <div className="splash-dot" />
      </div>
    </div>
  )
}

export default Splash
