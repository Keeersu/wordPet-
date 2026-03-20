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
 * 根据难度获取干扰项
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
      // 纯新手：从不同类别中随机取 3 个词
      return allWords
        .filter((w) => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word)
    case 2:
      // 略知一二：同类别干扰词
      return word.categoryDistractors.slice(0, 3)
    case 3:
      // 勉强应付：拼写相近
      return word.spellingDistractors.slice(0, 3)
    case 4:
      // 还不错哦：语义相近
      return word.semanticDistractors.slice(0, 3)
  }
}
