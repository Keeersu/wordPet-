import { buildCatPrompt, buildRoomCatPrompt } from './catPrompt'
import { PORTRAIT_REFERENCE_URLS, FULLBODY_REFERENCE_URLS } from './catStyleSpec'
import { getCachedImage, setCachedImage } from './imageCache'
import type { CatGenerationTags, CatPersonality } from '@/store/gameStore'

const MODAI_API_BASE = '/modai-api'
const MODAI_API_KEY = 'modai_wbl9ptulkfTU_cXaH8zOjiDI5qXV3nwtwZP-J16uffg'

type ImageModel = 'doubao-seedream-4.5' | 'doubao-seedream-5.0-lite'

export interface GenerateResult {
  imageUrl: string
  /** 原始 CDN URL（未去背景），可用作后续图生图的 image_urls 参考 */
  rawImageUrl: string
  model: ImageModel
}

function parseSSEImageUrl(text: string): string | null {
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue
    try {
      const payload = JSON.parse(line.slice(6))
      if (payload.type === 'image_generated' && payload.data?.imageUrl) {
        return payload.data.imageUrl
      }
    } catch { /* skip non-JSON lines */ }
  }
  return null
}

async function fetchImageBitmap(url: string): Promise<ImageBitmap> {
  if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('./')) {
    const resp = await fetch(url)
    const blob = await resp.blob()
    return createImageBitmap(blob)
  }

  try {
    const resp = await fetch(url, { mode: 'cors' })
    if (resp.ok) {
      const blob = await resp.blob()
      return createImageBitmap(blob)
    }
  } catch {
    console.log('[removeBackground] direct fetch blocked by CORS, trying proxy...')
  }

  const proxyUrl = `/_img_proxy?url=${encodeURIComponent(url)}`
  const resp = await fetch(proxyUrl)
  if (!resp.ok) throw new Error(`Image proxy failed: ${resp.status}`)
  const blob = await resp.blob()
  return createImageBitmap(blob)
}

const bgRemoveCache = new Map<string, string>()

function isChromaGreen(r: number, g: number, b: number): boolean {
  return g > 80 && g > r * 1.15 && g > b * 1.15
}

function chromaGreenness(r: number, g: number, b: number): number {
  if (g <= 0) return 0
  const ratioR = g / Math.max(r, 1)
  const ratioB = g / Math.max(b, 1)
  const minRatio = Math.min(ratioR, ratioB)
  if (minRatio <= 1.0) return 0
  return Math.min((minRatio - 1.0) / 0.8, 1.0)
}

/**
 * Removes green-screen background using edge-connected BFS flood-fill.
 * Only removes green pixels that are connected to the image border,
 * so green items ON the cat (e.g. a collar) are preserved.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  console.log('[removeBackground] called with:', imageUrl.substring(0, 80))
  if (imageUrl.startsWith('data:')) { console.log('[removeBackground] already data URL, skipping'); return imageUrl }
  if (bgRemoveCache.has(imageUrl)) { console.log('[removeBackground] memory cache hit'); return bgRemoveCache.get(imageUrl)! }

  const cacheKey = `bgremove_${imageUrl}`
  const persisted = await getCachedImage(cacheKey)
  if (persisted) {
    console.log('[removeBackground] IndexedDB cache hit')
    bgRemoveCache.set(imageUrl, persisted)
    return persisted
  }

  const bitmap = await fetchImageBitmap(imageUrl)
  console.log('[removeBackground] bitmap loaded:', bitmap.width, 'x', bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = imageData

  const corners = [[0,0],[width-1,0],[0,height-1],[width-1,height-1]]
  for (const [cx, cy] of corners) {
    const ci = (cy * width + cx) * 4
    console.log(`[removeBackground] corner(${cx},${cy}): rgb(${data[ci]},${data[ci+1]},${data[ci+2]}) isGreen=${isChromaGreen(data[ci],data[ci+1],data[ci+2])}`)
  }

  const visited = new Uint8Array(width * height)
  const toRemove = new Uint8Array(width * height)

  const queue: number[] = []

  for (let x = 0; x < width; x++) {
    queue.push(x, 0)
    queue.push(x, height - 1)
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(0, y)
    queue.push(width - 1, y)
  }

  let qi = 0
  let removedCount = 0
  while (qi < queue.length) {
    const x = queue[qi++]
    const y = queue[qi++]
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    const idx = y * width + x
    if (visited[idx]) continue
    visited[idx] = 1

    const pi = idx * 4
    const r = data[pi], g = data[pi + 1], b = data[pi + 2]
    if (!isChromaGreen(r, g, b)) continue

    toRemove[idx] = 1
    removedCount++
    queue.push(x - 1, y, x + 1, y, x, y - 1, x, y + 1)
  }

  console.log(`[removeBackground] BFS removed ${removedCount} / ${width * height} pixels`)

  const DILATE_RADIUS = 2
  const dilated = new Uint8Array(toRemove)
  for (let pass = 0; pass < DILATE_RADIUS; pass++) {
    const src = pass === 0 ? toRemove : dilated
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (src[idx]) continue
        const pi = idx * 4
        const r = data[pi], g = data[pi + 1], b = data[pi + 2]
        const greenish = chromaGreenness(r, g, b)
        if (greenish < 0.15) continue
        for (const [nx, ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && src[ny * width + nx]) {
            dilated[idx] = 1
            break
          }
        }
      }
    }
  }

  for (let idx = 0; idx < width * height; idx++) {
    const pi = idx * 4
    if (dilated[idx]) {
      data[pi + 3] = 0
      continue
    }

    const r = data[pi], g = data[pi + 1], b = data[pi + 2]
    const greenness = chromaGreenness(r, g, b)
    if (greenness <= 0) continue

    const x = idx % width, y = (idx - x) / width
    let nearRemoved = false
    const SPILL_RADIUS = 3
    outer: for (let dy = -SPILL_RADIUS; dy <= SPILL_RADIUS; dy++) {
      for (let dx = -SPILL_RADIUS; dx <= SPILL_RADIUS; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && dilated[ny * width + nx]) {
          nearRemoved = true
          break outer
        }
      }
    }
    if (nearRemoved) {
      const alpha = Math.round((1 - greenness * 0.8) * data[pi + 3])
      data[pi + 3] = alpha
      const spill = greenness * 0.85
      data[pi + 1] = Math.round(g * (1 - spill) + Math.max(r, b) * spill)
    }
  }

  const ALPHA_THRESHOLD = 128
  for (let idx = 0; idx < width * height; idx++) {
    const pi = idx * 4
    data[pi + 3] = data[pi + 3] >= ALPHA_THRESHOLD ? 255 : 0
  }

  ctx.putImageData(imageData, 0, 0)

  const result = await new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const objUrl = URL.createObjectURL(blob)
        setCachedImage(cacheKey, blob).catch(() => {})
        resolve(objUrl)
      } else {
        resolve(canvas.toDataURL('image/png'))
      }
    }, 'image/png')
  })

  bgRemoveCache.set(imageUrl, result)
  console.log('[removeBackground] done')
  return result
}

// ─── Doubao API 调用 ──────────────────────────────────────────────────────

interface CallDoubaoOptions {
  prompt: string
  negativePrompt?: string
  model: ImageModel
  /** 参考图 URL 列表（图生图模式） */
  imageUrls?: string[]
}

async function callDoubao({ prompt, negativePrompt, model, imageUrls }: CallDoubaoOptions): Promise<string> {
  const reqBody: Record<string, unknown> = {
    prompt,
    model,
    parameters: { width: 1024, height: 1024 },
  }
  if (negativePrompt) {
    reqBody.negative_prompt = negativePrompt
  }
  if (imageUrls?.length) {
    reqBody.inputFileUrls = imageUrls
  }

  console.log('[callDoubao] request body:', JSON.stringify(reqBody, null, 2))

  const endpoint = imageUrls?.length
    ? `${MODAI_API_BASE}/doubao/image-to-image`
    : `${MODAI_API_BASE}/doubao/text-to-image`

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MODAI_API_KEY}`,
    },
    body: JSON.stringify(reqBody),
  })

  console.log('[callDoubao] response status:', resp.status)

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    console.error(`[callDoubao] ${model} error ${resp.status}:`, errText.substring(0, 200))
    throw new Error(`AI 图片生成服务暂时不可用 (${resp.status})，请稍后再试`)
  }

  const respText = await resp.text()
  const url = parseSSEImageUrl(respText)
  if (!url) throw new Error('No image URL in response')
  return url
}

/** 从数组中随机挑选 n 个不重复元素 */
function sampleRefs(urls: string[], count: number): string[] {
  const uniqueUrls = [...new Set(urls)]
  if (uniqueUrls.length <= count) return uniqueUrls

  const copy = [...uniqueUrls]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

// ─── 生成入口 ──────────────────────────────────────────────────────────────

/**
 * 生成猫咪基本形象照（文生图，onboarding 使用）。
 * 返回 imageUrl（去背景后）和 rawImageUrl（原始 CDN URL，供后续图生图参考）。
 */
export async function generateCatImage(
  tags: CatGenerationTags,
  personality?: CatPersonality,
): Promise<GenerateResult> {
  const refUrls = sampleRefs(PORTRAIT_REFERENCE_URLS, 3)
  const prompt = buildCatPrompt(tags, personality)
  console.log(`[generateCatImage] refs: ${refUrls.join(', ')}\n  prompt: ${prompt}`)

  let rawUrl: string
  let model: ImageModel

  try {
    rawUrl = await callDoubao({ prompt, model: 'doubao-seedream-4.5', imageUrls: refUrls })
    model = 'doubao-seedream-4.5'
    console.log('[generateCatImage] doubao 4.5 image-to-image succeeded')
  } catch (e) {
    console.error('[generateCatImage] doubao 4.5 image-to-image failed, falling back to 5.0-lite:', e)
    rawUrl = await callDoubao({ prompt, model: 'doubao-seedream-5.0-lite', imageUrls: refUrls })
    model = 'doubao-seedream-5.0-lite'
  }

  let imageUrl: string
  try {
    imageUrl = await removeBackground(rawUrl)
    console.log('[generateCatImage] background removal succeeded')
  } catch (e) {
    console.error('[generateCatImage] background removal failed, using raw image:', e)
    imageUrl = rawUrl
  }

  return { imageUrl, rawImageUrl: rawUrl, model }
}

/**
 * 生成指定房间的猫咪动作图（图生图模式）。
 * 以形象照的 CDN URL 作为参考图，确保角色外观和画风一致。
 */
export async function generateRoomCatImage(
  tags: CatGenerationTags,
  chapterId: number,
  portraitRawUrl?: string,
  personality?: CatPersonality,
): Promise<GenerateResult> {
  const refUrls = portraitRawUrl
    ? [portraitRawUrl, ...sampleRefs(FULLBODY_REFERENCE_URLS, 2)]
    : sampleRefs(FULLBODY_REFERENCE_URLS, 3)
  const prompt = buildRoomCatPrompt(tags, chapterId, personality)
  console.log(`[generateRoomCatImage] refs: ${refUrls.join(', ')}, ch=${chapterId}\n  prompt: ${prompt}`)

  let rawUrl: string
  let model: ImageModel

  try {
    rawUrl = await callDoubao({ prompt, model: 'doubao-seedream-4.5', imageUrls: refUrls })
    model = 'doubao-seedream-4.5'
  } catch (e) {
    console.error('[generateRoomCatImage] doubao 4.5 image-to-image failed, falling back to 5.0-lite:', e)
    rawUrl = await callDoubao({ prompt, model: 'doubao-seedream-5.0-lite', imageUrls: refUrls })
    model = 'doubao-seedream-5.0-lite'
  }

  let imageUrl: string
  try {
    imageUrl = await removeBackground(rawUrl)
    console.log('[generateRoomCatImage] background removal succeeded, ch=', chapterId)
  } catch (e) {
    console.error('[generateRoomCatImage] background removal failed:', e)
    imageUrl = rawUrl
  }

  return { imageUrl, rawImageUrl: rawUrl, model }
}

// ─── 每日限额 ──────────────────────────────────────────────────────────────

const DAILY_LIMIT_KEY = 'wordpet_cat_gen_count'

export function getDailyGenerationCount(): number {
  const raw = localStorage.getItem(DAILY_LIMIT_KEY)
  if (!raw) return 0
  try {
    const { date, count } = JSON.parse(raw)
    if (date !== new Date().toDateString()) return 0
    return count
  } catch { return 0 }
}

export function incrementDailyCount(): void {
  const today = new Date().toDateString()
  const current = getDailyGenerationCount()
  localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify({ date: today, count: current + 1 }))
}

export const MAX_DAILY_GENERATIONS = 10
