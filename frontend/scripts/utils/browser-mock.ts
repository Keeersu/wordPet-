import { JSDOM } from 'jsdom'

let initialized = false

export function setupBrowserMock() {
  if (initialized) return
  initialized = true

  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
  })

  const g = globalThis as Record<string, unknown>
  const w = dom.window as Record<string, unknown>

  // Helper to safely assign globals (some may be read-only in Node.js)
  function assignGlobal(name: string, value: unknown) {
    try {
      g[name] = value
    } catch {
      try {
        Object.defineProperty(g, name, { value, writable: true, configurable: true })
      } catch {
        // Already defined and not configurable, skip
      }
    }
  }

  // Copy JSDOM globals to globalThis
  assignGlobal('window', w)
  assignGlobal('document', w.document)
  assignGlobal('navigator', w.navigator)
  assignGlobal('location', w.location)
  assignGlobal('history', w.history)
  assignGlobal('localStorage', w.localStorage)
  assignGlobal('sessionStorage', w.sessionStorage)

  // React/DOM libs need these constructors on globalThis
  assignGlobal('HTMLElement', w.HTMLElement)
  assignGlobal('Element', w.Element)
  assignGlobal('Node', w.Node)
  assignGlobal('Text', w.Text)
  assignGlobal('DocumentFragment', w.DocumentFragment)
}
