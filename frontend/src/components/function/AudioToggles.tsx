import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'

const ICON_ON = '#FFB840'
const ICON_OFF = 'rgba(93,64,55,0.3)'
const BG_ON = 'rgba(255,184,64,0.15)'
const BORDER_ON = '1.5px solid rgba(255,184,64,0.4)'
const BORDER_OFF = `1.5px solid ${ICON_OFF}`

function OffIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  return (
    <Icon icon={icon} style={{ width: size, height: size, color: ICON_OFF }} />
  )
}

export { OffIcon, ICON_ON, ICON_OFF, BG_ON, BORDER_ON, BORDER_OFF }

/**
 * Compact music + sound toggle buttons for page headers.
 */
export function AudioToggles({ className = '' }: { className?: string }) {
  const { gameState, updateGameState } = useGameStore()
  const { musicEnabled, soundEnabled } = gameState.settings

  const toggleMusic = () => {
    updateGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, musicEnabled: !prev.settings.musicEnabled },
    }))
  }

  const toggleSound = () => {
    updateGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, soundEnabled: !prev.settings.soundEnabled },
    }))
  }

  const btnBase =
    'flex h-9 w-9 items-center justify-center rounded-full transition-colors'

  return (
    <div className={`flex gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={toggleMusic}
        className={btnBase}
        style={{
          backgroundColor: musicEnabled ? BG_ON : 'transparent',
          border: musicEnabled ? BORDER_ON : BORDER_OFF,
        }}
        title={musicEnabled ? '音乐已开' : '音乐已关'}
      >
        {musicEnabled ? (
          <Icon icon="lucide:music" style={{ width: 18, height: 18, color: ICON_ON }} />
        ) : (
          <OffIcon icon="lucide:music" />
        )}
      </button>
      <button
        type="button"
        onClick={toggleSound}
        className={btnBase}
        style={{
          backgroundColor: soundEnabled ? BG_ON : 'transparent',
          border: soundEnabled ? BORDER_ON : BORDER_OFF,
        }}
        title={soundEnabled ? '音效已开' : '音效已关'}
      >
        {soundEnabled ? (
          <Icon icon="lucide:volume-2" style={{ width: 18, height: 18, color: ICON_ON }} />
        ) : (
          <OffIcon icon="lucide:volume-2" />
        )}
      </button>
    </div>
  )
}
