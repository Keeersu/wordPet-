/**
 * 题目生成引擎
 *
 * 根据难度等级动态生成每关 10 道题目
 * 实现 PRD v1.3 的三维差异化：
 * 1. 题型比例 - 按难度动态分配
 * 2. 例句难度 - basic/advanced 双套例句
 * 3. 干扰项策略 - 4 种难度策略
 */

import type { WordConfig, DifficultyLevel, SentencePair } from './words/types'
import { getSentence, getDistractors } from './words/types'
import { getChapterWords } from './words'
import { getQuestionTypeDistribution } from './difficulty'
import type { QuestionType } from './difficulty'

// ============================================================================
// Types
// ============================================================================

export interface GeneratedQuestion {
  /** 题型 */
  type: QuestionType
  /** 目标单词 */
  word: string
  /** 中文释义 */
  meaning: string
  /** 词性 */
  pos: string
  /** 当前难度对应的例句 */
  sentence: string
  /** 例句中文翻译 */
  sentenceZh: string
  /** 选项（不同题型含义不同） */
  options: string[]
  /** 正确答案 */
  correctAnswer: string
  /** 配图路径 */
  image: string
  /** 字母数组（用于 letter_match 和 word_spelling） */
  letters?: string[]
  /** 图片配对专用：4 组单词-含义配对 */
  matchPairs?: Array<{ word: string; meaning: string; image: string }>
}

// ============================================================================
// 工具函数
// ============================================================================

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** 从数组中随机取 n 个元素 */
function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/** 将单词拆分为字母数组并打乱 */
function scrambleLetters(word: string): string[] {
  const letters = word.split('')
  // 确保打乱后不等于原单词
  let scrambled = shuffle(letters)
  let attempts = 0
  while (scrambled.join('') === word && attempts < 10) {
    scrambled = shuffle(letters)
    attempts++
  }
  return scrambled
}

// ============================================================================
// 题目生成器（按题型）
// ============================================================================

/**
 * 生成看图选词题（multiple_choice）
 * 展示单词配图，选择正确的单词
 */
function generateMultipleChoice(
  wordConfig: WordConfig,
  difficulty: DifficultyLevel,
  allWords: WordConfig[],
): GeneratedQuestion {
  const sentencePair = getSentence(wordConfig, difficulty)
  const distractors = getDistractors(wordConfig, difficulty, allWords)
  const options = shuffle([wordConfig.word, ...distractors.slice(0, 3)])

  return {
    type: 'multiple_choice',
    word: wordConfig.word,
    meaning: wordConfig.meaning,
    pos: wordConfig.pos,
    sentence: sentencePair.en,
    sentenceZh: sentencePair.zh,
    options,
    correctAnswer: wordConfig.word,
    image: wordConfig.image,
  }
}

/**
 * 生成填空题（fill_blank）
 * 展示含空格的例句，选择正确的单词填入
 */
function generateFillBlank(
  wordConfig: WordConfig,
  difficulty: DifficultyLevel,
  allWords: WordConfig[],
): GeneratedQuestion {
  const sentencePair = getSentence(wordConfig, difficulty)
  const distractors = getDistractors(wordConfig, difficulty, allWords)
  const options = shuffle([wordConfig.word, ...distractors.slice(0, 3)])

  // 确保例句中包含 ___
  let sentence = sentencePair.en
  if (!sentence.includes('___')) {
    // 将单词替换为 ___
    const regex = new RegExp(`\\b${wordConfig.word}\\b`, 'i')
    sentence = sentence.replace(regex, '___')
  }

  return {
    type: 'fill_blank',
    word: wordConfig.word,
    meaning: wordConfig.meaning,
    pos: wordConfig.pos,
    sentence,
    sentenceZh: sentencePair.zh,
    options,
    correctAnswer: wordConfig.word,
    image: wordConfig.image,
  }
}

/**
 * 生成字母消消乐题（letter_match）
 * 展示目标单词和打乱的字母，用户排列成正确顺序
 */
function generateLetterMatch(
  wordConfig: WordConfig,
  difficulty: DifficultyLevel,
  _allWords: WordConfig[],
): GeneratedQuestion {
  const sentencePair = getSentence(wordConfig, difficulty)

  return {
    type: 'letter_match',
    word: wordConfig.word,
    meaning: wordConfig.meaning,
    pos: wordConfig.pos,
    sentence: sentencePair.en,
    sentenceZh: sentencePair.zh,
    options: [],
    correctAnswer: wordConfig.word,
    image: wordConfig.image,
    letters: scrambleLetters(wordConfig.word),
  }
}

/**
 * 生成单词拼写题（word_spelling）
 * 看图片和释义，拖动散乱字母拼写单词
 */
function generateWordSpelling(
  wordConfig: WordConfig,
  difficulty: DifficultyLevel,
  _allWords: WordConfig[],
): GeneratedQuestion {
  const sentencePair = getSentence(wordConfig, difficulty)

  return {
    type: 'word_spelling',
    word: wordConfig.word,
    meaning: wordConfig.meaning,
    pos: wordConfig.pos,
    sentence: sentencePair.en,
    sentenceZh: sentencePair.zh,
    options: [],
    correctAnswer: wordConfig.word,
    image: wordConfig.image,
    letters: scrambleLetters(wordConfig.word),
  }
}

/**
 * 生成图片配对题（picture_matching）
 * 4 张图片与 4 个英文单词匹配（简化为选择题形式）
 */
function generatePictureMatching(
  wordConfig: WordConfig,
  difficulty: DifficultyLevel,
  allWords: WordConfig[],
): GeneratedQuestion {
  const sentencePair = getSentence(wordConfig, difficulty)
  // 选择 3 个其他单词作为干扰项
  const others = allWords.filter((w) => w.word !== wordConfig.word)
  const distractorWords = pickRandom(others, 3)

  const options = shuffle([wordConfig.meaning, ...distractorWords.map((w) => w.meaning)])

  return {
    type: 'picture_matching',
    word: wordConfig.word,
    meaning: wordConfig.meaning,
    pos: wordConfig.pos,
    sentence: sentencePair.en,
    sentenceZh: sentencePair.zh,
    options,
    correctAnswer: wordConfig.meaning,
    image: wordConfig.image,
    matchPairs: shuffle([
      wordConfig,
      ...distractorWords,
    ].map((w) => ({
      word: w.word,
      meaning: w.meaning,
      image: w.image,
    }))),
  }
}

// ============================================================================
// 题目生成器映射
// ============================================================================

const GENERATORS: Record<
  QuestionType,
  (word: WordConfig, difficulty: DifficultyLevel, allWords: WordConfig[]) => GeneratedQuestion
> = {
  multiple_choice: generateMultipleChoice,
  fill_blank: generateFillBlank,
  letter_match: generateLetterMatch,
  word_spelling: generateWordSpelling,
  picture_matching: generatePictureMatching,
}

// ============================================================================
// 主入口：生成一关 10 道题
// ============================================================================

export interface GenerateQuestionsOptions {
  chapterId: number
  levelId: number
  difficulty: DifficultyLevel
  /** 已答过的单词（用于优先出未见过的词） */
  wordHistory?: Record<string, { correct: number; wrong: number }>
}

/**
 * 生成一关的题目（10 道）
 *
 * 逻辑：
 * 1. 按难度获取题型分配（如纯新手：图片配对 3 + 字母消消乐 3 + 拼写 2 + 填空 1 + 选词 1）
 * 2. 从章节词库中选取 10 个单词（优先未掌握的）
 * 3. 为每个题型分配一个单词，生成对应题目
 */
export function generateQuestions(options: GenerateQuestionsOptions): GeneratedQuestion[] {
  const { chapterId, difficulty, wordHistory } = options
  const allWords = getChapterWords(chapterId)

  if (allWords.length === 0) {
    console.warn(`No words found for chapter ${chapterId}`)
    return []
  }

  // 1. 获取题型分配
  const typeDistribution = getQuestionTypeDistribution(difficulty)
  const questionsCount = typeDistribution.length // 10

  // 2. 选取单词
  // 优先选择未掌握/答错多的单词
  const sortedWords = [...allWords].sort((a, b) => {
    const aHistory = wordHistory?.[a.word]
    const bHistory = wordHistory?.[b.word]

    // 未见过的优先
    if (!aHistory && bHistory) return -1
    if (aHistory && !bHistory) return 1
    if (!aHistory && !bHistory) return Math.random() - 0.5

    // 答错多的优先
    const aWrongRate = aHistory!.wrong / (aHistory!.correct + aHistory!.wrong || 1)
    const bWrongRate = bHistory!.wrong / (bHistory!.correct + bHistory!.wrong || 1)
    if (aWrongRate !== bWrongRate) return bWrongRate - aWrongRate

    return Math.random() - 0.5
  })

  // 选取需要的单词数量（可能复用）
  const selectedWords: WordConfig[] = []
  for (let i = 0; i < questionsCount; i++) {
    selectedWords.push(sortedWords[i % sortedWords.length])
  }

  // 打乱所选单词顺序
  const shuffledWords = shuffle(selectedWords)

  // 3. 为每个题型-单词对生成题目
  const questions: GeneratedQuestion[] = typeDistribution.map((questionType, index) => {
    const wordConfig = shuffledWords[index]
    const generator = GENERATORS[questionType]
    return generator(wordConfig, difficulty, allWords)
  })

  return questions
}

// ============================================================================
// 题内实时微调
// ============================================================================

export interface AdaptiveSignal {
  /** 最近 3 题正确率 */
  recentAccuracy: number
  /** 本题用了几次机会（1=轻松，2=勉强） */
  attemptCount: number
}

export interface QuestionAdjustment {
  /** 例句级别 */
  sentenceLevel: 'basic' | 'advanced'
  /** 干扰项难度偏移（-1=降低, 0=保持, +1=提升） */
  distractorShift: number
}

/**
 * 题内实时微调逻辑
 * PRD 规范：每道题答完后，AI 根据本题表现调整下一题的出题策略
 * - 正确率 ≥ 80% 且首次作答正确 → 例句切换 advanced，干扰项更难
 * - 正确率 ≤ 40% 或需要 2 次机会 → 例句切换 basic，干扰项更简单
 * - 不在关内改变整体难度等级，只调整例句和干扰项
 */
export function adjustNextQuestion(signal: AdaptiveSignal): QuestionAdjustment {
  if (signal.recentAccuracy >= 0.8 && signal.attemptCount === 1) {
    return { sentenceLevel: 'advanced', distractorShift: 1 }
  }
  if (signal.recentAccuracy <= 0.4 || signal.attemptCount === 2) {
    return { sentenceLevel: 'basic', distractorShift: -1 }
  }
  return { sentenceLevel: 'basic', distractorShift: 0 }
}

/**
 * 根据微调信号更新一道题目的例句和干扰项
 */
export function applyAdjustment(
  question: GeneratedQuestion,
  wordConfig: WordConfig,
  currentDifficulty: DifficultyLevel,
  adjustment: QuestionAdjustment,
  allWords: WordConfig[],
): GeneratedQuestion {
  // 调整例句
  const sentencePair: SentencePair = adjustment.sentenceLevel === 'advanced'
    ? wordConfig.sentences.advanced
    : wordConfig.sentences.basic

  // 调整干扰项难度
  const rawDifficulty = currentDifficulty + adjustment.distractorShift
  const effectiveDifficulty = Math.max(1, Math.min(4, rawDifficulty)) as DifficultyLevel

  // 根据题型更新
  if (question.type === 'fill_blank' || question.type === 'multiple_choice') {
    const distractors = getDistractors(wordConfig, effectiveDifficulty, allWords)
    let sentence = sentencePair.en
    if (question.type === 'fill_blank' && !sentence.includes('___')) {
      const regex = new RegExp(`\\b${wordConfig.word}\\b`, 'i')
      sentence = sentence.replace(regex, '___')
    }

    return {
      ...question,
      sentence,
      sentenceZh: sentencePair.zh,
      options: shuffle([
        question.type === 'multiple_choice' ? wordConfig.word : wordConfig.word,
        ...distractors.slice(0, 3),
      ]),
    }
  }

  // 其他题型只更新例句
  return {
    ...question,
    sentence: sentencePair.en,
    sentenceZh: sentencePair.zh,
  }
}
