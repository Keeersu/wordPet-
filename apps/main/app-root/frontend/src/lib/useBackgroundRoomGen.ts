import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/GameContext'
import {
  generateRoomCatImage,
  incrementDailyCount,
  getDailyGenerationCount,
  MAX_DAILY_GENERATIONS,
} from './catGeneration'

const TOTAL_CHAPTERS = 5

/**
 * Sequentially pre-generates room cat images for all chapters in the background.
 * Skips chapters that already have a room image. Respects daily generation limits.
 * Should be mounted once on a persistent page like Home.
 */
export function useBackgroundRoomGen() {
  const { gameState, updateGameState } = useGameStore()
  const running = useRef(false)

  useEffect(() => {
    if (running.current) return
    if (!gameState.onboardingDone) return
    const appearance = gameState.cat.generatedAppearance
    if (!appearance?.tags || !appearance.rawImageUrl) return

    const missingChapters: number[] = []
    for (let ch = 1; ch <= TOTAL_CHAPTERS; ch++) {
      if (!appearance.roomImages?.[ch]) missingChapters.push(ch)
    }
    if (missingChapters.length === 0) return

    running.current = true
    const { tags, rawImageUrl } = appearance
    const personality = gameState.cat.personality

    let cancelled = false

    ;(async () => {
      for (const ch of missingChapters) {
        if (cancelled) break
        if (getDailyGenerationCount() >= MAX_DAILY_GENERATIONS) {
          console.log('[bgRoomGen] daily limit reached, stopping')
          break
        }

        try {
          console.log(`[bgRoomGen] generating ch${ch}...`)
          const { rawImageUrl: roomRawImageUrl } = await generateRoomCatImage(tags, ch, rawImageUrl, personality)
          if (cancelled) break

          incrementDailyCount()
          updateGameState((prev) => {
            if (!prev.cat.generatedAppearance) return prev
            const existing = prev.cat.generatedAppearance.roomImages ?? {}
            if (existing[ch]) return prev
            return {
              ...prev,
              cat: {
                ...prev.cat,
                generatedAppearance: {
                  ...prev.cat.generatedAppearance,
                  roomImages: { ...existing, [ch]: roomRawImageUrl },
                },
              },
            }
          })
          console.log(`[bgRoomGen] ch${ch} done`)
        } catch (e) {
          console.error(`[bgRoomGen] ch${ch} failed:`, e)
        }
      }
      running.current = false
    })()

    return () => { cancelled = true }
  }, [gameState.onboardingDone, gameState.cat.generatedAppearance?.tags]) // eslint-disable-line react-hooks/exhaustive-deps
}
