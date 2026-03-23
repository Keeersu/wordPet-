/**
 * 词汇数据索引
 * 按章节组织，每章 15 个单词（足够 4 关 × 10 题）
 */

export type { WordConfig, SentencePair, DifficultyLevel } from './types'
export { getSentence, getDistractors } from './types'

export { chapter1Words } from './chapter1'
export { chapter2Words } from './chapter2'
export { chapter3Words } from './chapter3'
export { chapter4Words } from './chapter4'
export { chapter5Words } from './chapter5'

import { chapter1Words } from './chapter1'
import { chapter2Words } from './chapter2'
import { chapter3Words } from './chapter3'
import { chapter4Words } from './chapter4'
import { chapter5Words } from './chapter5'
import type { WordConfig } from './types'

/** 按章节 ID 获取单词列表 */
export const chapterWordsMap: Record<number, WordConfig[]> = {
  1: chapter1Words,
  2: chapter2Words,
  3: chapter3Words,
  4: chapter4Words,
  5: chapter5Words,
}

/** 获取指定章节的单词列表 */
export function getChapterWords(chapterId: number): WordConfig[] {
  return chapterWordsMap[chapterId] ?? chapter1Words
}
