/**
 * 公共工具函数 barrel export
 */
export { speakWord } from './tts'
export type { SpeakOptions } from './tts'
export { rateColor, rateBgColor } from './colors'
export { CARD_STYLE, FONT_FAMILY } from './styles'
export { getRandomEncourage, ENCOURAGE_CORRECT, ENCOURAGE_WRONG } from './encouragements'

/** cn — className 合并工具（兼容 shadcn/ui 风格） */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}
