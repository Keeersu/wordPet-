// Setup all polyfills for the test environment

import { ResizeObserverPolyfill } from './ResizeObserver'
import { IntersectionObserverPolyfill } from './IntersectionObserver'
import { matchMediaPolyfill } from './matchMedia'
import { requestAnimationFramePolyfill, cancelAnimationFramePolyfill } from './requestAnimationFrame'

function setupPolyfills(): void {
  // Apply polyfills to globalThis
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = ResizeObserverPolyfill
  }

  if (typeof globalThis.IntersectionObserver === 'undefined') {
    globalThis.IntersectionObserver = IntersectionObserverPolyfill
  }

  if (typeof globalThis.matchMedia === 'undefined') {
    globalThis.matchMedia = matchMediaPolyfill
  }

  // Override requestAnimationFrame to prevent infinite loops with GSAP + fake timers
  globalThis.requestAnimationFrame = requestAnimationFramePolyfill
  globalThis.cancelAnimationFrame = cancelAnimationFramePolyfill
}

// Auto-invoke when loaded via setupFiles
setupPolyfills()
