
// Page navigation registry - centralized link management to prevent broken links
//
// Usage in components:
//   import { pageLinks } from '../pageLinks'
//   navigate(pageLinks.Home())
//
// Key naming convention: Keys MUST match the page TSX file name (without .tsx extension)
// e.g., Home.tsx -> pageLinks.Home(), Profile.tsx -> pageLinks.Profile()

// global_shortcut_xxx are not Pages
// one of the pageLink must be /, otherwise global_shortcut_home will be a broken link
export const pageLinks = {
  // == PAGE_LINKS ==
  Collection: () => '/collection',
  Practice: () => '/practice',
  Profile: () => '/profile',
  Settings: () => '/settings',
  Onboarding: () => '/onboarding',
  OnboardingLevel: () => '/onboarding/level',
  Splash: () => '/splash',
  Home: () => '/',
  Room: (chapterId: number | string = ':chapterId') => `/rooms/${chapterId}`,
  Game: (
    chapterId: number | string = ':chapterId',
    levelId: number | string = ':levelId',
  ) => `/chapter/${chapterId}/level/${levelId}`,
  Result: (
    chapterId: number | string = ':chapterId',
    levelId: number | string = ':levelId',
  ) => `/chapter/${chapterId}/level/${levelId}/result`,


  global_shortcut_home: () => '/', // MUST BE '/', do not change
}


export function getPageLinkFullUrl<K extends keyof typeof pageLinks>(
  pageName: K,
  ...args: Parameters<(typeof pageLinks)[K]>
): string {
  const linkFn = pageLinks[pageName] as (...args: unknown[]) => string
  const path = linkFn(...args)
  return `${window.location.origin}${path}`
}
