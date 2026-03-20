/**
 * 公共 TTS（Text-to-Speech）工具函数
 * 统一管理语音播放逻辑，消除 Game / Practice / Result 中的重复实现
 */

export interface SpeakOptions {
  /** 是否启用语音（若为 false 则跳过） */
  enabled?: boolean
  /** 附加朗读的例句 */
  sentence?: string
  /** 语速（默认 0.85） */
  rate?: number
  /** 音调（默认 1） */
  pitch?: number
}

/**
 * 朗读英语单词（可附带例句）
 * @param word - 要朗读的单词
 * @param options - 朗读选项
 */
export function speakWord(word: string, options: SpeakOptions = {}): void {
  const { enabled = true, sentence, rate = 0.85, pitch = 1 } = options
  if (!enabled) return
  if (!window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const text = sentence ? `${word}. ${sentence}` : word
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = rate
  utter.pitch = pitch
  window.speechSynthesis.speak(utter)
}
