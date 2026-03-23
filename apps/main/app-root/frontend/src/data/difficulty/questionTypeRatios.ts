/**
 * 题型比例配置表 - PRD v1.3 Section 12 规范
 *
 * 每关固定 10 道题，按难度级别分配各题型数量：
 * - 图片配对和字母消消乐视觉辅助强，适合新手
 * - 填空和填字对词义理解和拼写记忆要求更高，适合高级别用户
 */

import type { DifficultyLevel } from '../words/types'

/** 五种题型 ID */
export type QuestionType =
  | 'picture_matching'   // 图片配对：4 张图片与 4 个英文单词连线
  | 'letter_match'       // 字母消消乐：拖拽排序字母块与目标单词对齐
  | 'word_spelling'      // 单词拼写：拖动散乱字母块排列成正确顺序
  | 'fill_blank'         // 填空题：点选正确答案填入句子空白处
  | 'multiple_choice'    // 看图选词：看图片选出正确的单词（简化版图片配对）

/**
 * 每关 10 道题，按难度级别分配各题型数量
 * PRD 原始设计含 crossword（填字游戏），MVP 简化为 multiple_choice（看图选词）
 *
 * | 题型             | 纯新手 | 略知一二 | 勉强应付 | 还不错哦 |
 * |------------------|--------|----------|----------|----------|
 * | picture_matching | 3      | 2        | 1        | 1        |
 * | letter_match     | 3      | 2        | 2        | 1        |
 * | word_spelling    | 2      | 2        | 2        | 2        |
 * | fill_blank       | 1      | 2        | 3        | 3        |
 * | multiple_choice  | 1      | 2        | 2        | 3        |
 */
export const QUESTION_TYPE_RATIOS: Record<DifficultyLevel, Record<QuestionType, number>> = {
  1: {
    picture_matching: 3,
    letter_match: 3,
    word_spelling: 2,
    fill_blank: 1,
    multiple_choice: 1,
  },
  2: {
    picture_matching: 2,
    letter_match: 2,
    word_spelling: 2,
    fill_blank: 2,
    multiple_choice: 2,
  },
  3: {
    picture_matching: 1,
    letter_match: 2,
    word_spelling: 2,
    fill_blank: 3,
    multiple_choice: 2,
  },
  4: {
    picture_matching: 1,
    letter_match: 1,
    word_spelling: 2,
    fill_blank: 3,
    multiple_choice: 3,
  },
}

/** 获取指定难度的题型分配数组（按顺序展开，然后打乱） */
export function getQuestionTypeDistribution(difficulty: DifficultyLevel): QuestionType[] {
  const ratios = QUESTION_TYPE_RATIOS[difficulty]
  const distribution: QuestionType[] = []

  for (const [type, count] of Object.entries(ratios)) {
    for (let i = 0; i < count; i++) {
      distribution.push(type as QuestionType)
    }
  }

  // Fisher-Yates 洗牌算法打乱顺序
  for (let i = distribution.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[distribution[i], distribution[j]] = [distribution[j], distribution[i]]
  }

  return distribution
}

/**
 * 题型友好名称映射
 */
export const QUESTION_TYPE_NAMES: Record<QuestionType, string> = {
  picture_matching: '图片配对',
  letter_match: '字母消消乐',
  word_spelling: '单词拼写',
  fill_blank: '填空题',
  multiple_choice: '看图选词',
}
