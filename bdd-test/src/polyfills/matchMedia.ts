// jsdom doesn't implement window.matchMedia
// Provide polyfill for testing environment

export class MediaQueryListPolyfill implements MediaQueryList {
  readonly media: string
  readonly matches: boolean = false

  // Event listener management
  private listeners: Set<EventListenerOrEventListenerObject> = new Set()

  // Deprecated event handler properties
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null

  constructor(query: string) {
    this.media = query
    // Default to false for all queries in test environment
    // Can be extended to parse queries if needed
    this.matches = false
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (type === 'change' && listener) {
      this.listeners.add(listener)
    }
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    if (type === 'change' && listener) {
      this.listeners.delete(listener)
    }
  }

  dispatchEvent(event: Event): boolean {
    if (event.type === 'change') {
      this.listeners.forEach(listener => {
        if (typeof listener === 'function') {
          listener(event as MediaQueryListEvent)
        } else {
          listener.handleEvent(event as MediaQueryListEvent)
        }
      })
      if (this.onchange) {
        this.onchange.call(this as MediaQueryList, event as MediaQueryListEvent)
      }
    }
    return true
  }

  // Deprecated method (kept for compatibility)
  addListener(callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null): void {
    if (callback) {
      this.addEventListener('change', callback as EventListener)
    }
  }

  // Deprecated method (kept for compatibility)
  removeListener(callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null): void {
    if (callback) {
      this.removeEventListener('change', callback as EventListener)
    }
  }
}

export function matchMediaPolyfill(query: string): MediaQueryList {
  return new MediaQueryListPolyfill(query) as MediaQueryList
}
