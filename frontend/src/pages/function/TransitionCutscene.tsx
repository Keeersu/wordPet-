import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/GameContext'
import { useAudio } from '@/lib/audio/useAudio'
import {
  generateRoomCatImage,
  incrementDailyCount,
  getDailyGenerationCount,
  MAX_DAILY_GENERATIONS,
} from '@/lib/catGeneration'
import { useResolvedCatImage } from '@/lib/useResolvedCatImage'

interface Frame {
  icon: string
  text: string
  subtext: string
  showCat: boolean
}

const FRAME_DURATION = 2000
const FADE_OUT_MS = 500

function TransitionCutscene() {
  const navigate = useNavigate()
  const { gameState, updateGameState } = useGameStore()
  const { playBgm } = useAudio()
  const [currentFrame, setCurrentFrame] = useState(0)
  const [fading, setFading] = useState(false)
  const generationStarted = useRef(false)

  const catName = gameState.cat.name
  const catSrc = useResolvedCatImage(gameState.cat)

  const frames: Frame[] = [
    { icon: '🌧️', text: `${catName} 在街角瑟瑟发抖...`, subtext: '一个温暖的身影出现了', showCat: true },
    { icon: '🤝', text: `你伸出了手`, subtext: `"跟我回家吧，${catName}"`, showCat: true },
    { icon: '🏠', text: `${catName} 来到了新家`, subtext: '一段全新的冒险即将开始...', showCat: false },
  ]

  useEffect(() => {
    playBgm('entrance')
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i < frames.length; i++) {
      timers.push(setTimeout(() => setCurrentFrame(i), FRAME_DURATION * i))
    }
    const totalDuration = FRAME_DURATION * frames.length
    timers.push(setTimeout(() => setFading(true), totalDuration))
    timers.push(setTimeout(() => navigate('/', { replace: true }), totalDuration + FADE_OUT_MS))
    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (generationStarted.current) return
    const appearance = gameState.cat.generatedAppearance
    if (!appearance?.tags) return
    if (appearance.roomImages?.[1]) return
    if (getDailyGenerationCount() >= MAX_DAILY_GENERATIONS) return

    generationStarted.current = true

    generateRoomCatImage(appearance.tags, 1, appearance.rawImageUrl, gameState.cat.personality)
      .then(({ rawImageUrl }) => {
        incrementDailyCount()
        updateGameState((prev) => {
          if (!prev.cat.generatedAppearance) return prev
          const existing = prev.cat.generatedAppearance.roomImages ?? {}
          return {
            ...prev,
            cat: {
              ...prev.cat,
              generatedAppearance: {
                ...prev.cat.generatedAppearance,
                roomImages: { ...existing, 1: rawImageUrl },
              },
            },
          }
        })
      })
      .catch((e) => {
        console.error('[TransitionCutscene] generateRoomCatImage failed:', e)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`transition-page ${fading ? 'transition-page--fading' : ''}`}>
      {frames.map((frame, idx) => (
        <div
          key={idx}
          className="transition-frame"
          style={{
            animation: idx === currentFrame ? `transitionFrameIn ${FRAME_DURATION}ms ease forwards` : 'none',
            opacity: idx === currentFrame ? undefined : 0,
            pointerEvents: idx === currentFrame ? 'auto' : 'none',
          }}
        >
          {frame.showCat ? (
            <div className="transition-cat">
              <img
                src={catSrc}
                alt={catName}
                className="transition-cat__img"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ) : (
            <div className="transition-scene-icon">{frame.icon}</div>
          )}
          <div className="transition-text">{frame.text}</div>
          <div className="transition-subtext">{frame.subtext}</div>
        </div>
      ))}

      <div className="transition-dots">
        {frames.map((_, idx) => (
          <div
            key={idx}
            className={`transition-dot ${idx === currentFrame ? 'transition-dot--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default TransitionCutscene
