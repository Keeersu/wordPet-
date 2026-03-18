/**
 * LandingLayout - Layout for landing / marketing pages
 *
 * Use cases:
 * - Brand websites, marketing landing pages
 * - Product showcase pages
 * - Pages requiring visual effects and smooth scrolling
 *
 * Features:
 * - Lenis smooth scrolling (silky scroll experience)
 * - Custom cursor (desktop visual enhancement)
 * - Suited for content-driven, showcase pages
 *
 * Comparison with AppLayout:
 * - AppLayout is for function pages: native scroll, no effects, lightweight
 * - LandingLayout is for landing pages: Lenis + custom cursor
 *
 * Note:
 * - Lenis hijacks page scroll, conflicts with h-screen + overflow-y-auto layouts
 * - Function pages (App pages) should use AppLayout
 */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ReactLenis, useLenis } from 'lenis/react'
import { CustomCursor, type CursorType, type BlendMode } from './components/landing/CustomCursor'

interface LandingLayoutProps {
  /** Cursor type */
  cursorType?: CursorType
  /** Color (dot/ring only) */
  cursorColor?: string
  /** Size (dot/ring only) */
  cursorSize?: number
  /** Glow effect (dot/ring only) */
  cursorGlow?: boolean
  /** Blend mode (dot/ring only) */
  cursorBlendMode?: BlendMode
  /** Image preset name (image only) */
  cursorImageName?: string
}

function ScrollReset() {
  const lenis = useLenis()
  const { pathname } = useLocation()

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true })
  }, [pathname, lenis])

  return null
}

export function LandingLayout({
  cursorType = 'default',
  cursorColor,
  cursorSize,
  cursorGlow,
  cursorBlendMode,
  cursorImageName,
}: LandingLayoutProps) {
  return (
    <ReactLenis root>
      <ScrollReset />
      <Outlet />
      <CustomCursor
        type={cursorType}
        color={cursorColor}
        size={cursorSize}
        glow={cursorGlow}
        blendMode={cursorBlendMode}
        name={cursorImageName}
      />
    </ReactLenis>
  )
}
