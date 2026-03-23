const DB_NAME = 'wordpet_images'
const DB_VERSION = 2
const STORE_NAME = 'images'

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME)
      }
      db.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function getCachedImage(key: string): Promise<string | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => {
        const val = req.result
        if (!val) { resolve(null); return }
        if (val instanceof Blob) {
          resolve(URL.createObjectURL(val))
        } else if (typeof val === 'string') {
          resolve(val)
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCachedImage(key: string, dataUrlOrBlob: string | Blob): Promise<void> {
  try {
    let blob: Blob
    if (typeof dataUrlOrBlob === 'string') {
      if (dataUrlOrBlob.startsWith('data:')) {
        const resp = await fetch(dataUrlOrBlob)
        blob = await resp.blob()
      } else {
        return
      }
    } else {
      blob = dataUrlOrBlob
    }
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(blob, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // silently fail
  }
}

const preloadedUrls = new Set<string>()

export function preloadImage(src: string): void {
  if (!src || preloadedUrls.has(src)) return
  preloadedUrls.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

export function preloadImages(srcs: string[]): void {
  for (const src of srcs) {
    preloadImage(src)
  }
}
