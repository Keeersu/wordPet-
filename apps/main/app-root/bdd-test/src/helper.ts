/**
 * Test Helper - Utilities for BDD-style Jotai store tests
 *
 * IMPORTANT: This project tests Jotai STORES, not React components.
 * If a feature's logic is in a component (useState/useEffect), refactor it
 * to a store first, then write tests here. Do not use @testing-library/react.
 *
 * See: frontend/src/stores/ for store examples
 * See: bdd-test/tests/store/ for test examples
 */
import { vi, expect } from 'vitest'
import { createStore, Provider, type Atom } from 'jotai'
import { matchRoutes, createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { RouteObject, LoaderFunctionArgs } from 'react-router-dom'
import { createRoot, type Root } from 'react-dom/client'
import { act, createElement, StrictMode } from 'react'
import { createRoutes } from '@frontend/routes'
import { onCaughtError } from '@frontend/App'
import { resetQueryClient } from '@frontend/queryClient'

// Track subscriptions for cleanup
let activeSubscriptions: Array<() => void> = []
// Track subscribed atoms to avoid duplicate subscriptions (reset on store.reset())
let subscribedAtoms = new WeakSet<Atom<unknown>>()

// Fixed test time - January 15, 2025 at 12:00:00 UTC
export const TEST_BASE_TIME = new Date('2025-01-15T12:00:00Z')

// Test deadline helpers - relative to TEST_BASE_TIME
export const TEST_DEADLINES = {
  // Future deadlines (poll is open)
  IN_1_DAY: '2025-01-16T12:00',      // +1 day
  IN_7_DAYS: '2025-01-22T12:00',     // +7 days
  IN_30_DAYS: '2025-02-14T12:00',    // +30 days
  // Past deadlines (poll is closed)
  PAST_1_HOUR: '2025-01-15T11:00',   // -1 hour
} as const

// ============================================================================
// TEST FILE ID
// ============================================================================

/**
 * Get a stable test file ID for database sharing.
 * All tests in the same file share one database instance.
 *
 * Optimization: reduces DB instances from 36 (per test) to 6 (per file)
 * This saves ~83% of database initialization time.
 */
export const getTestFileId = (): string => {
  const testPath = expect.getState().testPath
  if (!testPath) {
    // Fallback to test name if path not available
    return expect.getState().currentTestName || 'unknown'
  }
  // Use file path as stable ID (e.g., "tests/store/pollster/poll.test.ts")
  return testPath.replace(/^.*\/tests\//, 'tests/')
}

// ============================================================================
// GLOBAL STORE HOLDER
// ============================================================================

/**
 * Global store holder - provides a single store interface that can be reset.
 *
 * When switching users (signIn), the internal store is replaced with a fresh
 * instance, clearing all state automatically. This prevents state leakage
 * between different users in tests.
 *
 * IMPORTANT: store.get() automatically subscribes to atoms (required for query
 * atoms to receive updates). This mirrors React's useAtomValue behavior.
 *
 * Usage:
 * ```typescript
 * import { store, signInWithRegularUserA } from '../helper'
 *
 * await signInWithRegularUserA()  // Resets store and signs in
 * store.set(createPollAtom, ...)  // Use the global store
 * store.get(stateAtom)            // Auto-subscribes for query atom support
 * ```
 */
let _store = createStore()

type JotaiStore = ReturnType<typeof createStore>

export const store: JotaiStore & {
  reset: () => void
  _internal: JotaiStore
} = {
  /**
   * Get atom value with automatic subscription.
   * Auto-subscribes to ensure query atoms receive updates (like useAtomValue in React).
   */
  get get() {
    return <T>(atom: Atom<T>): T => {
      // Subscribe if not already subscribed (idempotent)
      if (!subscribedAtoms.has(atom as Atom<unknown>)) {
        const unsub = _store.sub(atom, () => {})
        activeSubscriptions.push(unsub)
        subscribedAtoms.add(atom as Atom<unknown>)
      }
      return _store.get(atom)
    }
  },
  /**
   * Set atom value with automatic timer flush for async operations.
   * When the write atom returns a Promise (e.g. involves refetch()), automatically
   * flushes TanStack Query's batched notifications (scheduled via setTimeout(0))
   * so that atomWithQuery results propagate to Jotai atoms before the next assertion.
   * Sync set operations are unaffected to avoid triggering unrelated side effects.
   */
  get set() {
    return ((...args: Parameters<JotaiStore['set']>) => {
      const result = _store.set(...args)
      if (result instanceof Promise) {
        return result.then(async (val) => {
          await vi.advanceTimersByTimeAsync(0)
          return val
        })
      }
      return result
    }) as JotaiStore['set']
  },
  get sub() { return _store.sub.bind(_store) },

  /** Reset the store to a fresh instance (clears all state) */
  reset: () => {
    // Cleanup subscriptions first
    activeSubscriptions.forEach(unsub => unsub())
    activeSubscriptions = []
    subscribedAtoms = new WeakSet()
    // Reset store and queryClient
    _store = createStore()
    _store.set(resetQueryClient)
  },

  /** Get the underlying Jotai store (for renderApp compatibility) */
  get _internal() { return _store },
}

export type Store = typeof store

// ============================================================================
// RENDER CLEANUP
// ============================================================================

// Track the current React root for proper cleanup
let currentReactRoot: Root | null = null

export function setCurrentReactRoot(root: Root | null): void {
  currentReactRoot = root
}

/**
 * Clean up the React render.
 *
 * Called in afterEach (via setupTeardown) to ensure React is properly unmounted
 * before the jsdom environment tears down.
 */
export function cleanupRender(): void {
  if (currentReactRoot) {
    const r = currentReactRoot
    act(() => {
      r.unmount()
    })
    currentReactRoot = null
  }
  const existingRoot = document.getElementById('bundler-root')
  if (existingRoot) {
    existingRoot.remove()
  }
}

// ============================================================================
// NAVIGATE TO (PAGE NAVIGATION)
// ============================================================================

/**
 * Simulate user navigating to a page - automatically calls the route's loader.
 *
 * This is the preferred way to initialize page state in tests, as it:
 * - Mirrors actual user behavior (visiting a URL)
 * - Validates that pageLinks → route → loader binding is correct
 * - Supports nested route loaders (parent loaders execute first)
 *
 * @param url - The page URL (use pageLinks.xxx() to generate)
 *
 * @example
 * // Instead of:
 * await PollVotingFormStore.pollVotingFormLoader(store, { id: pollId })
 *
 * // Use:
 * await navigateTo(pageLinks.pollVotingForm(pollId))
 */
export async function navigateTo(url: string): Promise<void> {
  const routes = createRoutes(store._internal)
  const matches = matchRoutes(routes, url)

  if (!matches) {
    throw new Error(`navigateTo: No route matches "${url}"`)
  }

  // Execute loaders in order (parent routes first, then children)
  for (const match of matches) {
    const loader = match.route.loader
    if (typeof loader === 'function') {
      await loader({
        params: match.params,
        request: new Request(`http://localhost${url}`),
      } as LoaderFunctionArgs)
    }
  }
}

/**
 * Wait until a loading atom becomes false, or a refresh atom completes.
 * Use after navigateTo() when the loader is non-blocking.
 *
 * @example
 * // With refreshAtom (recommended):
 * await helper.navigateTo(pageLinks.PollVotingForm(pollId))
 * await helper.waitUntilLoaded(PollVotingFormStore.refreshAtom)
 * // Now safe to interact with store
 *
 * // With custom isLoading atom:
 * await helper.waitUntilLoaded(MyStore.isLoadingAtom)
 */
export function waitUntilLoaded(loadingAtom: Atom<unknown>, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const checkLoading = () => {
      // Use _store.get directly to avoid double subscription
      const value = _store.get(loadingAtom)
      // Support both boolean atoms and query atoms with isPending
      if (typeof value === 'boolean') {
        return value
      }
      if (value && typeof value === 'object' && 'isPending' in value) {
        return (value as { isPending: boolean }).isPending
      }
      return false
    }

    // Check current value first
    if (!checkLoading()) {
      resolve()
      return
    }

    let settled = false
    const timeoutId = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`waitUntilLoaded: timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    // Subscribe and resolve when value changes to false.
    // Keep subscription active (don't unsub on resolve) to prevent atomWithQuery's
    // QueryObserver from being unmounted. The subscription is cleaned up on store.reset().
    const unsub = _store.sub(loadingAtom, () => {
      if (settled) return
      if (!checkLoading()) {
        settled = true
        clearTimeout(timeoutId)
        resolve()
      }
    })

    // Track subscription for cleanup on store.reset()
    activeSubscriptions.push(unsub)
    subscribedAtoms.add(loadingAtom as Atom<unknown>)
  })
}

// ============================================================================
// RENDER STORE (skip loaders, render current store state to jsdom)
// ============================================================================

function stripLoaders(routes: RouteObject[]): RouteObject[] {
  return routes.map(route => {
    const stripped = { ...route, loader: undefined, action: undefined }
    if ('children' in stripped && stripped.children) {
      stripped.children = stripLoaders(stripped.children)
    }
    return stripped
  })
}

/**
 * Render the current store state into jsdom, run assertions in the callback,
 * then automatically unmount. Skips all route loaders.
 *
 * The callback pattern ensures the React tree is unmounted after assertions,
 * preventing act() warnings from subsequent store.set() calls.
 *
 * @param url - The page URL to render (determines which page component to use)
 * @param callback - Assertions to run while the rendered DOM is available
 * @param options.saveHtml - Optional file path to save the rendered HTML
 *
 * @example
 * await helper.renderStore(pageLinks.PollVotingForm(pollId), () => {
 *   expect(document.body.textContent).toContain('Your vote has been recorded')
 * })
 */
export async function renderStore(url: string, callback: () => void | Promise<void>, options?: { saveHtml?: string }): Promise<void> {
  cleanupRender()

  const rootEl = document.createElement('div')
  rootEl.id = 'bundler-root'
  document.body.appendChild(rootEl)

  const routes = stripLoaders(createRoutes(_store))
  const router = createMemoryRouter(routes, { initialEntries: [url] })

  const r = createRoot(rootEl, { onCaughtError })

  await act(async () => {
    r.render(
      createElement(StrictMode, null,
        createElement(Provider, { store: _store },
          createElement(RouterProvider, { router })
        )
      )
    )
  })

  try {
    await callback()

    if (options?.saveHtml) {
      const fs = await import('fs')
      const path = await import('path')
      const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML
      fs.mkdirSync(path.dirname(options.saveHtml), { recursive: true })
      fs.writeFileSync(options.saveHtml, html)
    }
  } finally {
    act(() => { r.unmount() })
    rootEl.remove()
  }
}
