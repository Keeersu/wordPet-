import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/GameContext'
import {
  generateRoomCatImage,
  incrementDailyCount,
  getDailyGenerationCount,
  MAX_DAILY_GENERATIONS,
  markRoomGenStart,
  markRoomGenEnd,
} from './catGeneration'

const TOTAL_CHAPTERS = 5
const MAX_FAILURES_PER_CHAPTER = 2

/**
 * Sequentially pre-generates room cat images for all TOTAL_CHAPTERS rooms
 * as soon as the user finishes onboarding and has a generated appearance.
 * Runs exactly once per session; does NOT restart on state changes.
 */
export function useBackgroundRoomGen() {
  const { gameState, updateGameState } = useGameStore()
  const hasRun = useRef(false)

  const onboardingDone = gameState.onboardingDone
  const appearance = gameState.cat.generatedAppearance
  const hasTags = !!appearance?.tags && !!appearance?.rawImageUrl

  useEffect(() => {
    if (hasRun.current) return
    if (!onboardingDone || !hasTags) return

    const { tags, rawImageUrl } = appearance!
    const personality = gameState.cat.personality

    const missingChapters: number[] = []
    for (let ch = 1; ch <= TOTAL_CHAPTERS; ch++) {
      if (!appearance!.roomImages?.[ch]) missingChapters.push(ch)
    }
    if (missingChapters.length === 0) return

    hasRun.current = true

    ;(async () => {
      const failures: Record<number, number> = {}

      for (const ch of missingChapters) {
        if (getDailyGenerationCount() >= MAX_DAILY_GENERATIONS) {
          console.log('[bgRoomGen] daily limit reached, stopping')
          break
        }

        if (!markRoomGenStart(ch)) {
          console.log(`[bgRoomGen] ch${ch} already in flight, skipping`)
          continue
        }

        try {
          console.log(`[bgRoomGen] generating ch${ch}...`)
          const { rawImageUrl: roomRawImageUrl } = await generateRoomCatImage(tags, ch, rawImageUrl, personality)

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
          failures[ch] = (failures[ch] ?? 0) + 1
          console.error(`[bgRoomGen] ch${ch} failed (${failures[ch]}/${MAX_FAILURES_PER_CHAPTER}):`, e)
          if (failures[ch] >= MAX_FAILURES_PER_CHAPTER) {
            console.warn(`[bgRoomGen] ch${ch} exceeded retry limit, skipping`)
          }
        } finally {
          markRoomGenEnd(ch)
        }
      }
    })()
  }, [onboardingDone, hasTags]) // eslint-disable-line react-hooks/exhaustive-deps
}
