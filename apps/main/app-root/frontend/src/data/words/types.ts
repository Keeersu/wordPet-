/**
 * 单词配置结构 - 遵循 PRD v1.3 Section 12 WordConfig 规范
 * 每个单词配置两套例句（初级/高级），按当前难度级别选用
 */

export interface SentencePair {
  en: string  // 英文例句（填空题用 ___ 标记空白位置）
  zh: string  // 中文翻译
}

export interface WordConfig {
  word: string           // 单词
  meaning: string        // 中文释义
  pos: string            // 词性（n./v./adj./adv.）
  image: string          // 配图路径
  sentences: {
    basic: SentencePair    // 初级例句（纯新手 + 略知一二）
    advanced: SentencePair // 高级例句（勉强应付 + 还不错哦）
  }
  /** 同类别干扰词（用于"略知一二"难度） */
  categoryDistractors: string[]
  /** 拼写相近干扰词（用于"勉强应付"难度） */
  spellingDistractors: string[]
  /** 语义相近干扰词（用于"还不错哦"难度） */
  semanticDistractors: string[]
}

export type DifficultyLevel = 1 | 2 | 3 | 4

/**
 * 根据 gameState.difficulty 选择例句版本
 * PRD 规范：纯新手(1) + 略知一二(2) → basic，勉强应付(3) + 还不错哦(4) → advanced
 */
export function getSentence(word: WordConfig, difficulty: DifficultyLevel): SentencePair {
  return difficulty <= 2 ? word.sentences.basic : word.sentences.advanced
}

/**
 * 根据难度获取干扰项（通用 — 用于看图选词、图片配对等非填空题型）
 * PRD 规范：
 * - 纯新手：干扰项与正确答案差异大（如 sofa vs tree）
 * - 略知一二：干扰项与正确答案同类别（如 sofa vs chair vs desk）
 * - 勉强应付：干扰项拼写相近（如 sofa vs sofe vs sopa）
 * - 还不错哦：干扰项语义相近且拼写规范（如 sofa vs couch vs bench）
 */
export function getDistractors(
  word: WordConfig,
  difficulty: DifficultyLevel,
  allWords: WordConfig[],
): string[] {
  switch (difficulty) {
    case 1:
      return allWords
        .filter((w) => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word)
    case 2:
      return word.categoryDistractors.slice(0, 3)
    case 3:
      return word.spellingDistractors.slice(0, 3)
    case 4:
      return word.semanticDistractors.slice(0, 3)
  }
}

/**
 * 填空题专用干扰项策略
 *
 * 填空题用句子作为语境，语义相近的词（如 bread vs loaf/toast/bun）
 * 往往都能填入同一个句子，导致多选项合理。
 * 因此填空题避免使用语义干扰项，改用：
 * - 纯新手(1)：随机不同词（差异大，易排除）
 * - 略知一二(2)：同类别词（同主题但含义不同，需理解句意）
 * - 勉强应付(3)、还不错哦(4)：拼写相近词（外形相似但含义不同，需仔细辨认）
 */
export function getFillBlankDistractors(
  word: WordConfig,
  difficulty: DifficultyLevel,
  allWords: WordConfig[],
): string[] {
  switch (difficulty) {
    case 1:
      return allWords
        .filter((w) => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word)
    case 2:
      return word.categoryDistractors.slice(0, 3)
    case 3:
    case 4:
      return word.spellingDistractors.slice(0, 3)
  }
}
