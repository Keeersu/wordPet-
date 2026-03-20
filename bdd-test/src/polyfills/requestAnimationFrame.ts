// jsdom's requestAnimationFrame can cause issues with GSAP and fake timers
// Provide a no-op polyfill to prevent infinite loops in test environment

let rafId = 0
const rafCallbacks = new Map<number, FrameRequestCallback>()

export function requestAnimationFramePolyfill(callback: FrameRequestCallback): number {
  rafId++
  const id = rafId
  rafCallbacks.set(id, callback)
  // Don't actually schedule the callback in tests to avoid infinite loops
  // GSAP will still work for layout but won't animate
  return id
}

export function cancelAnimationFramePolyfill(id: number): void {
  rafCallbacks.delete(id)
}
