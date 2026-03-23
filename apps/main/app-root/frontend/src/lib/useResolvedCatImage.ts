import { useEffect, useState } from 'react'
import { getCatImageSrc, getCatRoomImageSrc, type CatProfile } from '@/store/gameStore'
import { removeBackground } from './catGeneration'

function needsRestore(src: string, isGenerated: boolean): boolean {
  if (!src || !isGenerated) return false
  if (src.startsWith('blob:') || src.startsWith('data:')) return false
  if (src.startsWith('/assets/')) return false
  return true
}

export function useResolvedCatImage(cat: CatProfile, chapterId?: number): string {
  const source = chapterId === undefined ? getCatImageSrc(cat) : getCatRoomImageSrc(cat, chapterId)
  const isGenerated = !!cat.generatedAppearance
  const [resolvedSrc, setResolvedSrc] = useState(source)

  useEffect(() => {
    setResolvedSrc(source)

    if (!needsRestore(source, isGenerated)) return

    let cancelled = false
    removeBackground(source)
      .then((nextSrc) => {
        if (!cancelled) setResolvedSrc(nextSrc)
      })
      .catch(() => {
        if (!cancelled) setResolvedSrc(source)
      })

    return () => {
      cancelled = true
    }
  }, [source, isGenerated])

  return resolvedSrc
}
