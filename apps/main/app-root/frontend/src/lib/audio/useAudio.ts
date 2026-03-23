import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { audioManager, type BgmTrack, type SfxTrack } from './audioManager'
import { useGameStore } from '@/store/GameContext'

/**
 * Resolves which BGM track should play for a given pathname.
 * Returns null for pages that manage their own BGM (splash, transitions, result w/ reveal).
 */
function getBgmForRoute(pathname: string): BgmTrack | null {
  if (pathname === '/splash') return null
  if (pathname === '/onboarding/transition') return null

  // Game page: /chapter/:id/level/:id  (but NOT /result)
  if (/^\/chapter\/\d+\/level\/\d+$/.test(pathname)) return 'game'

  // Result page manages its own BGM transitions (reveal → home)
  if (/\/result$/.test(pathname)) return null

  // Everything else: home BGM
  return 'home'
}

/**
 * Core audio hook — call once at the app root level.
 * Syncs settings, handles route-based BGM switching, and unlocks audio on first interaction.
 */
export function useAudioSystem() {
  const { gameState } = useGameStore()
  const location = useLocation()
  const initialized = useRef(false)

  // Preload on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      audioManager.preload()
    }
  }, [])

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => {
      audioManager.unlock()
      window.removeEventListener('click', unlock, true)
      window.removeEventListener('touchstart', unlock, true)
    }
    window.addEventListener('click', unlock, true)
    window.addEventListener('touchstart', unlock, true)
    return () => {
      window.removeEventListener('click', unlock, true)
      window.removeEventListener('touchstart', unlock, true)
    }
  }, [])

  // Sync settings
  useEffect(() => {
    audioManager.setMusicEnabled(gameState.settings.musicEnabled)
  }, [gameState.settings.musicEnabled])

  useEffect(() => {
    audioManager.setSoundEnabled(gameState.settings.soundEnabled)
  }, [gameState.settings.soundEnabled])

  // Route-based BGM switching
  useEffect(() => {
    const track = getBgmForRoute(location.pathname)
    if (track) {
      audioManager.playBgm(track)
    }
  }, [location.pathname])

  // Global button click SFX (opt-out via data-no-click-sfx attribute)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const btn = target.closest('button')
      if (!btn) return
      if (btn.closest('[data-no-click-sfx]') || btn.hasAttribute('data-no-click-sfx')) return
      audioManager.playSfx('button-click')
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])
}

/**
 * Lightweight hook for components that need to play SFX or control BGM manually.
 */
export function useAudio() {
  const playSfx = useCallback((track: SfxTrack) => {
    audioManager.playSfx(track)
  }, [])

  const playBgm = useCallback((track: BgmTrack) => {
    audioManager.playBgm(track)
  }, [])

  const stopBgm = useCallback(() => {
    audioManager.stopBgm()
  }, [])

  return { playSfx, playBgm, stopBgm, audioManager }
}
