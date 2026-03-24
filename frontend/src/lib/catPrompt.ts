import type {
  CatFurColor,
  CatAccessory,
  CatPersonality,
  CatGenerationTags,
} from '@/store/gameStore'
import { ROOM_CAT_POSES } from './catStyleSpec'

const FUR_COLOR_PROMPTS: Record<CatFurColor, string> = {
  orange: '橘色',
  white: '纯白色',
  black: '纯黑色',
  gray: '灰色',
  calico: '三花（白橘黑色块）',
  tuxedo: '奶牛（黑白色块）',
  cream: '奶油色',
  siamese: '暹罗色（奶油色身体，深色面部耳朵四肢）',
}

const ACCESSORY_PROMPTS: Record<CatAccessory, string> = {
  none: '',
  ribbon: '戴蝴蝶结头饰',
  scarf: '戴红色围巾',
  beret: '戴贝雷帽',
  glasses: '戴圆框眼镜',
  collar: '戴铃铛项圈',
}

const PERSONALITY_PROMPTS: Partial<Record<CatPersonality, string>> = {
  lively: '超级活泼的表情',
  mysterious: '超级讨厌高冷的表情',
  sleepy: '晕头转向智商低的表情',
  homebody: '贱贱的邪恶的表情',
}

function buildCharacterDesc(tags: CatGenerationTags, personality?: CatPersonality): string {
  const parts: string[] = []
  const accessory = ACCESSORY_PROMPTS[tags.accessory]
  const personalityPart = personality ? PERSONALITY_PROMPTS[personality] : ''
  if (accessory) parts.push(accessory)
  if (personalityPart) parts.push(personalityPart)
  parts.push(FUR_COLOR_PROMPTS[tags.furColor])
  return parts.join('的')
}

const GREEN_BG = '标准绿幕背景(chroma key green #00FF00)，背景纯色无阴影无渐变'

export function buildPortraitPrompt(tags: CatGenerationTags, personality?: CatPersonality): string {
  return `根据图片插画风格，延展一只${buildCharacterDesc(tags, personality)}的猫头部插画，正面平视视角，扁平微质感，${GREEN_BG}`
}

export function buildRoomCatPrompt(tags: CatGenerationTags, chapterId: number, personality?: CatPersonality): string {
  const pose = ROOM_CAT_POSES[chapterId]
  if (!pose) return buildPortraitPrompt(tags, personality)
  const posePart = pose.actionPrompt.join('，')
  return `根据图片插画风格，延展一只${buildCharacterDesc(tags, personality)}的猫，${posePart}，扁平微质感，${GREEN_BG}`
}

export function buildCatPrompt(tags: CatGenerationTags, personality?: CatPersonality): string {
  return buildPortraitPrompt(tags, personality)
}

// ─── Tag 选项（UI 选择器用）──────────────────────────────────────────────

export interface TagOption<T extends string> {
  id: T
  label: string
  swatch?: string
}

export const FUR_COLOR_OPTIONS: TagOption<CatFurColor>[] = [
  { id: 'orange', label: '橘色', swatch: '#E8943A' },
  { id: 'white', label: '白色', swatch: '#F5F5F5' },
  { id: 'black', label: '黑色', swatch: '#333333' },
  { id: 'gray', label: '灰色', swatch: '#9E9E9E' },
  { id: 'calico', label: '三花', swatch: '#D4956A' },
  { id: 'tuxedo', label: '奶牛', swatch: '#1A1A1A' },
  { id: 'cream', label: '奶油', swatch: '#F5DEB3' },
  { id: 'siamese', label: '暹罗', swatch: '#C8B89A' },
]

export const ACCESSORY_OPTIONS: TagOption<CatAccessory>[] = [
  { id: 'none', label: '无' },
  { id: 'ribbon', label: '蝴蝶结' },
  { id: 'scarf', label: '围巾' },
  { id: 'beret', label: '贝雷帽' },
  { id: 'glasses', label: '圆眼镜' },
  { id: 'collar', label: '铃铛' },
]

export function randomizeTags(locked?: Partial<CatGenerationTags>): CatGenerationTags {
  const pick = <T extends string>(arr: readonly TagOption<T>[]) => arr[Math.floor(Math.random() * arr.length)].id
  return {
    furColor: locked?.furColor ?? pick(FUR_COLOR_OPTIONS),
    accessory: locked?.accessory ?? pick(ACCESSORY_OPTIONS),
  }
}
