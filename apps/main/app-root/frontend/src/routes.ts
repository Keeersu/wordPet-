
import { createElement } from 'react'
import type { RouteObject } from 'react-router-dom'
import type { createStore } from 'jotai'
import { AppContainer } from './AppContainer'
import { pageLinks } from './pageLinks'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import NotFoundPage from './pages/NotFoundPage'
import { LandingLayout } from './LandingLayout'
// == STYLE_PLAYGROUND_IMPORTS ==
import ChunkyToybox from './pages/style-playground/alternatives/ChunkyToybox'
// == PAGE_IMPORTS ==
import Home from './pages/function/Home'
import Collection from './pages/function/Collection'
import Practice from './pages/function/Practice'
import Profile from './pages/function/Profile'
import Settings from './pages/function/Settings'
import Game from './pages/function/Game'
import Result from './pages/function/Result'
import Room from './pages/function/Room'


type Store = ReturnType<typeof createStore>

// ============================================================================
// ⚠️  CRITICAL: pageLinks ↔ createBusinessRoutes Contract
// ============================================================================
// 1. Define ALL page paths in `pageLinks.ts`
// 2. Use `pageLinks.xxx()` in `createBusinessRoutes` below (NOT hardcoded strings)
//
// This ensures:
// - Type-safe navigation throughout the app via `import { pageLinks } from './pageLinks'`
// - Single source of truth for all routes
// - Compile-time errors if routes are missing or mistyped
// ============================================================================

function createBusinessRoutes(store: Store): RouteObject[] {
  return [
    // == BUSINESS_ROUTES ==
    { path: pageLinks.Home(), element: createElement(Home) },
    { path: pageLinks.Collection(), element: createElement(Collection) },
    { path: pageLinks.Practice(), element: createElement(Practice) },
    { path: pageLinks.Profile(), element: createElement(Profile) },
    { path: pageLinks.Settings(), element: createElement(Settings) },
    { path: pageLinks.Game(), element: createElement(Game) },
    { path: pageLinks.Result(), element: createElement(Result) },
    { path: pageLinks.Room(), element: createElement(Room) },
  ]
}

function createLandingRoutes(_store: Store): RouteObject[] {
  return [
    {
      element: createElement(LandingLayout),
      children: [
        // == LANDING_ROUTES ==
      ],
    },
  ]
}

function createPlaygroundRoutes(): RouteObject[] {
  return [
    // == STYLE_PLAYGROUND_ROUTES ==
    { path: '/style-playground/ChunkyToybox', element: createElement(ChunkyToybox) },


  ]
}

// Fallback routes (must be last in children array)
function createFallbackRoutes(): RouteObject[] {
  const fallbackRoutes: RouteObject[] = []
  // 404 catch-all
  fallbackRoutes.push({
    path: '*',
    element: createElement(NotFoundPage),
  })
  return fallbackRoutes
}

export function createRoutes(store: Store): RouteObject[] {
  return [
    {
      path: '/',
      element: createElement(AppContainer),
      errorElement: createElement(RouteErrorBoundary),


      children: [
        ...createLandingRoutes(store),
        ...createPlaygroundRoutes(),
        ...createBusinessRoutes(store),


        ...createFallbackRoutes(),
      ],
    },
  ]
}
