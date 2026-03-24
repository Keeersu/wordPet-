/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 英语单词答题页面，动态生成题目（根据难度等级调整题型比例、例句难度、干扰项策略），支持多种题型（看图选词、填空、字母消消乐、拼写、图片配对），含自适应难度、TTS 和反馈机制。
 * Style referenceFiles: styles/game.css, styles/components.css
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 根据用户难度等级动态生成 10 道混合题型
 * - 五种题型：看图选词、填空题、字母消消乐、单词拼写、图片配对
 * - 答对/答错视觉反馈（绿色/红色高亮）
 * - 底部反馈弹窗（鼓励文案、正确答案展示）
 * - 题内实时微调（每 3 题调整例句和干扰项难度）
 * - 关卡结束后 AI 自适应调整下一关难度
 * - 进度实时更新（第X题·共10题）
 * - 退出确认对话框
 *
 * ## Basic Layout
 * 纯色背景 + 白色底部渐变 + 顶部导航 + 单词插图 + 白色题目卡片 + 底部反馈弹窗
 *
 * ## Page Layout
 * 全屏纯色背景（#F5E6C8），底部白色渐变层覆盖40%高度。
 * </page-design>
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'
// GameState type no longer needed at module level
import {
  generateQuestions,
  adjustNextQuestion,
  type GeneratedQuestion,
  type AdaptiveSignal,
} from '@/data/questionGenerator'
import type { DifficultyLevel } from '@/data/words/types'
import { speakWord as _speakWord } from '@/lib/utils/tts'
import { getRandomEncourage } from '@/lib/utils/encouragements'
import { getChapterName } from '@/data/chapters'
import { useAudio } from '@/lib/audio/useAudio'

// ── TTS 工具函数已移入组件内部（speak），同时检查页面朗读开关 + 全局 ttsEnabled ──

// ============================================================================
// LLM Adaptive Difficulty (关卡结束后大调整)
// ============================================================================

const LLM_API_URL = 'https://ai-platform-test.zhenguanyu.com/litellm/v1/chat/completions'
const LLM_API_KEY = 'sk-ZDolX3RGKGtyyWiaP0zXOQ'

async function adjustDifficultyViaLLM(
  accuracy: number,
  currentDifficulty: number,
  stats: Record<string, { correct: number; wrong: number }>,
): Promise<1 | 2 | 3 | 4> {
  try {
    const wrongWords = Object.entries(stats)
      .filter(([, s]) => s.wrong > 0)
      .map(([w]) => w)

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-seed-1.8',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: `你是英语学习难度调整助手。当前难度${currentDifficulty}（1=最简单,4=最难），本关正确率${Math.round(accuracy * 100)}%，答错单词：${wrongWords.join(',') || '无'}。请只返回1到4之间的一个数字作为下一关难度，不要说其他任何内容。`,
          },
        ],
      }),
    })
    const data = await response.json()
    const result = parseInt(data.choices?.[0]?.message?.content?.trim())
    if (result >= 1 && result <= 4) return result as 1 | 2 | 3 | 4
    return currentDifficulty as 1 | 2 | 3 | 4
  } catch {
    return currentDifficulty as 1 | 2 | 3 | 4
  }
}

// ============================================================================
// Constants
// ============================================================================

// 鼓励文案 & 章节名称使用公共模块 ↑


// ============================================================================
// Types
// ============================================================================

type AnswerState = 'idle' | 'correct' | 'wrong_first' | 'wrong_second'

// ============================================================================
// Sub-components
// ============================================================================

function ConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="overlay">
      <div className="modal">
        <p className="modal__title">
          确认退出？
        </p>
        <p className="modal__message">
          退出后本关进度将丢失
        </p>
        <div className="modal__actions">
          <button
            onClick={onCancel}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            继续答题
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger"
            style={{ flex: 1 }}
          >
            退出
          </button>
        </div>
      </div>
    </div>
  )
}

function FeedbackSheet({
  answerState,
  question,
  encourageText,
  onNext,
  onSpeak,
}: {
  answerState: 'correct' | 'wrong_first' | 'wrong_second'
  question: GeneratedQuestion
  encourageText: string
  onNext: () => void
  onSpeak?: () => void
}) {
  const isCorrect = answerState === 'correct'
  const isWrongSecond = answerState === 'wrong_second'
  const headerText = isWrongSecond ? '正确答案是——' : encourageText

  return (
    <div className="feedback-sheet">
      <div className="game-feedback__header" style={{ marginBottom: isWrongSecond ? '16px' : '0' }}>
        <div className={`feedback-icon ${isCorrect ? 'feedback-icon--correct' : 'feedback-icon--wrong'}`}>
          <Icon
            icon={isCorrect ? 'lucide:check' : 'lucide:x'}
            style={{ width: '18px', height: '18px', color: 'white' }}
          />
        </div>
        <span className="game-feedback__header-text">
          {headerText}
        </span>
      </div>

      {isWrongSecond && (
        <div className="game-feedback__answer-card">
          <div className="game-feedback__header" style={{ marginBottom: '8px' }}>
            <span className="game-feedback__answer-label">
              正确答案：
            </span>
            <span className="game-feedback__answer-word">
              {question.correctAnswer}
            </span>
            {onSpeak && (
              <button
                onClick={onSpeak}
                className="speak-btn speak-btn--lg"
                style={{ marginLeft: 'auto' }}
              >
                <Icon icon="lucide:volume-2" style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
              </button>
            )}
          </div>
          <p className="game-feedback__meaning">
            {question.meaning}
          </p>
          <p className="game-feedback__sentence">
            &ldquo;{question.sentence}&rdquo;
          </p>
        </div>
      )}

      {isWrongSecond && (
        <button
          onClick={onNext}
          className="btn-primary"
          style={{ width: '100%', padding: '14px 16px', fontSize: '16px' }}
        >
          下一题
        </button>
      )}
    </div>
  )
}

// ============================================================================
// 字母拖拽/点选组件（用于 letter_match 和 word_spelling）
// ============================================================================

function LetterPuzzle({
  letters,
  correctWord,
  onComplete,
  onWrong,
  disabled,
  showMeaning,
  image,
}: {
  letters: string[]
  correctWord: string
  onComplete: () => void
  onWrong: () => void
  disabled: boolean
  showMeaning?: string
  image?: string
}) {
  const { playSfx } = useAudio()
  const [selected, setSelected] = useState<number[]>([])
  const [availableLetters, setAvailableLetters] = useState(letters)
  const [isWrong, setIsWrong] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    setSelected([])
    setAvailableLetters(letters)
    setIsWrong(false)
    setImgLoaded(false)
  }, [letters])

  const currentWord = selected.map((idx) => letters[idx]).join('')

  const handleLetterClick = (index: number) => {
    if (disabled || selected.includes(index)) return

    const newSelected = [...selected, index]
    const isLastLetter = newSelected.length === correctWord.length
    if (!isLastLetter) {
      playSfx('button-click')
    }

    setSelected(newSelected)

    const newWord = newSelected.map((idx) => letters[idx]).join('')

    if (isLastLetter) {
      if (newWord === correctWord) {
        onComplete()
      } else {
        setIsWrong(true)
        onWrong()
        // 1 秒后重置
        setTimeout(() => {
          setSelected([])
          setIsWrong(false)
        }, 800)
      }
    }
  }

  const handleUndo = () => {
    if (disabled || selected.length === 0) return
    setSelected(selected.slice(0, -1))
    setIsWrong(false)
  }

  return (
    <div className="game-letter-layout" data-no-click-sfx>
      {/* 配图 */}
      {image && (
        <div className={`game-letter-image ${imgLoaded ? 'game-letter-image--loaded' : ''}`}>
          <img
            src={image}
            alt=""
            className="game-letter-image__img"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          {!imgLoaded && (
            <span className="game-letter-image__letter">
              {correctWord.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {/* 含义提示 */}
      {showMeaning && (
        <p className="game-letter-meaning">
          {showMeaning}
        </p>
      )}

      {/* 已选区域（目标位） */}
      <div className="game-letter-slots">
        {correctWord.split('').map((_, idx) => {
          const letter = selected[idx] !== undefined ? letters[selected[idx]] : ''
          const slotClass = isWrong && currentWord.length === correctWord.length
            ? 'letter-slot letter-slot--wrong'
            : letter
              ? 'letter-slot letter-slot--filled'
              : 'letter-slot letter-slot--empty'
          return (
            <div
              key={idx}
              className={slotClass}
            >
              {letter}
            </div>
          )
        })}

        {/* 撤销按钮 */}
        {selected.length > 0 && !disabled && (
          <button
            onClick={handleUndo}
            className="game-undo-btn"
          >
            <Icon icon="lucide:undo-2" style={{ width: 18, height: 18, color: '#8D6E63' }} />
          </button>
        )}
      </div>

      {/* 可选字母区 */}
      <div className="game-letter-pool">
        {availableLetters.map((letter, idx) => {
          const isUsed = selected.includes(idx)
          return (
            <button
              key={`${letter}-${idx}`}
              onClick={() => handleLetterClick(idx)}
              disabled={disabled || isUsed}
              className={`letter-btn ${isUsed ? 'letter-btn--used' : 'letter-btn--available'}`}
            >
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

function Game() {
  const navigate = useNavigate()
  const { chapterId: chapterIdParam, levelId: levelIdParam } = useParams()
  const { gameState, updateGameState } = useGameStore()

  const { playSfx, stopBgm } = useAudio()
  const chapterId = Number(chapterIdParam ?? gameState.currentChapter)
  const levelId = Number(levelIdParam ?? gameState.currentLevel)
  const chapterName = getChapterName(chapterId)
  const currentDifficulty = gameState.adaptiveDifficulty.current

  // ── 动态生成题目（组件挂载时生成一次） ──
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])

  useEffect(() => {
    const generated = generateQuestions({
      chapterId,
      levelId,
      difficulty: currentDifficulty,
      wordHistory: gameState.wordHistory,
    })
    setQuestions(generated)
  }, [chapterId, levelId]) // 只在章节/关卡变化时重新生成

  const TOTAL_QUESTIONS = questions.length || 10

  // ── 答题状态 ──
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [encourageText, setEncourageText] = useState('')
  const [topImgLoaded, setTopImgLoaded] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wordStats, setWordStats] = useState<Record<string, { correct: number; wrong: number; firstCorrect: boolean }>>({})

  // ── 自动朗读开关（答题页内，默认开启） ──
  const [autoRead, setAutoRead] = useState(true)
  const autoReadRef = useRef(true) // ref 同步，供回调函数读取最新值

  /** 组件内 TTS：同时检查页面朗读开关和全局 ttsEnabled */
  const speak = useCallback((word: string, sentence?: string) => {
    if (!autoReadRef.current) return
    _speakWord(word, { enabled: gameState.settings.ttsEnabled, sentence })
  }, [gameState.settings.ttsEnabled])

  // ── 题内实时微调追踪 ──
  const recentResults = useRef<boolean[]>([]) // 最近 3 题结果
  const sentenceLevelOverride = useRef<'basic' | 'advanced' | null>(null)

  // ── LLM 难度变化提示（仅在难度确实发生变化且尚未展示时才弹出） ──
  const [difficultyToast, setDifficultyToast] = useState<{
    show: boolean
    direction: 'up' | 'down' | 'same'
    from: number
    to: number
  } | null>(null)

  useEffect(() => {
    const history = gameState.adaptiveDifficulty.levelHistory
    if (history.length < 2) return

    const prev = history[history.length - 2]
    const curr = history[history.length - 1]
    if (prev === curr) return // 难度没变，不提示

    // 用 localStorage 记录上次已展示 Toast 时对应的 levelHistory 长度，
    // 避免重复进入同一关时反复弹出同一条提示
    const toastKey = 'wordpet_difficulty_toast_shown_at'
    const lastShownAt = Number(localStorage.getItem(toastKey) || '0')
    if (lastShownAt >= history.length) return // 这次变化已经展示过了

    localStorage.setItem(toastKey, String(history.length))

    setDifficultyToast({
      show: true,
      direction: curr > prev ? 'up' : 'down',
      from: prev,
      to: curr,
    })
    const timer = setTimeout(() => setDifficultyToast(null), 4000)
    return () => clearTimeout(timer)
  }, []) // 仅挂载时检查一次

  const question = questions[currentIndex]

  // ── 同步 autoRead ref ──
  useEffect(() => {
    autoReadRef.current = autoRead
  }, [autoRead])

  // ── 自动朗读：每道新题出现时自动朗读单词 ──
  useEffect(() => {
    if (question && autoRead && answerState === 'idle' && gameState.settings.ttsEnabled) {
      const timer = setTimeout(() => {
        _speakWord(question.word, { enabled: true })
      }, 300) // 延迟 300ms 让卡片动画完成
      return () => clearTimeout(timer)
    }
  }, [currentIndex, question?.word, autoRead, gameState.settings.ttsEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 难度指示器文字 ──
  const DIFFICULTY_LABELS: Record<number, string> = { 1: '🐾 入门', 2: '🐾🐾 进阶', 3: '🐾🐾🐾 挑战', 4: '🐾🐾🐾🐾 大师' }

  // ── 选项样式 ──
  const getOptionClass = useCallback(
    (option: string) => {
      if (!question) return 'btn-option btn-option--idle'

      if (answerState === 'idle') return 'btn-option btn-option--idle'

      if (option === question.correctAnswer && (answerState === 'correct' || answerState === 'wrong_second'))
        return 'btn-option btn-option--correct'

      if (option === selectedOption && (answerState === 'wrong_first' || answerState === 'wrong_second'))
        return `btn-option ${answerState === 'wrong_second' ? 'btn-option--wrong-reveal' : 'btn-option--wrong'}`

      return `btn-option btn-option--idle ${answerState === 'wrong_second' ? 'btn-option--dimmed' : 'btn-option--semi-dimmed'}`
    },
    [answerState, selectedOption, question],
  )

  const optionsDisabled = useMemo(
    () => answerState !== 'idle',
    [answerState],
  )

  // ── 记录答题结果并触发微调 ──
  const recordAnswer = useCallback((word: string, isCorrect: boolean, attempts: number) => {
    // 更新 recentResults
    recentResults.current.push(isCorrect)
    if (recentResults.current.length > 3) {
      recentResults.current.shift()
    }

    // 每 3 题进行一次微调
    if (recentResults.current.length >= 3) {
      const recentAccuracy = recentResults.current.filter(Boolean).length / recentResults.current.length
      const signal: AdaptiveSignal = {
        recentAccuracy,
        attemptCount: attempts,
      }
      const adjustment = adjustNextQuestion(signal)
      sentenceLevelOverride.current = adjustment.sentenceLevel
    }

    // 更新 wordStats
    setWordStats((prev) => {
      const existing = prev[word] ?? { correct: 0, wrong: 0, firstCorrect: false }
      return {
        ...prev,
        [word]: {
          correct: existing.correct + (isCorrect ? 1 : 0),
          wrong: existing.wrong + (isCorrect ? 0 : 1),
          firstCorrect: isCorrect && attempts === 1,
        },
      }
    })
  }, [])

  // ── 选项点击 ──
  const handleOptionClick = useCallback(
    (option: string) => {
      if (optionsDisabled || !question) return

      setSelectedOption(option)
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)

      const isLastQuestion = currentIndex + 1 >= TOTAL_QUESTIONS

      if (option === question.correctAnswer) {
        setAnswerState('correct')
        setEncourageText(getRandomEncourage(true))
        setCorrectCount((c) => c + 1)
        recordAnswer(question.word, true, newAttemptCount)
        speak(question.word)
        playSfx('correct')
        if (isLastQuestion) stopBgm()
        setShowFeedback(true)
        return
      } else if (newAttemptCount === 1) {
        setAnswerState('wrong_first')
        setEncourageText(getRandomEncourage(false))
        recordAnswer(question.word, false, newAttemptCount)
        playSfx('wrong')
        setShowFeedback(true)
      } else {
        setAnswerState('wrong_second')
        setEncourageText('正确答案是——')
        recordAnswer(question.word, false, newAttemptCount)
        speak(question.correctAnswer, question.sentence)
        if (isLastQuestion) stopBgm()
        setShowFeedback(true)
      }
    },
    [optionsDisabled, attemptCount, question, speak, recordAnswer, playSfx, currentIndex, TOTAL_QUESTIONS, stopBgm],
  )

  // ── 字母拼写完成回调 ──
  const handleSpellingComplete = useCallback(() => {
    if (!question) return
    setAnswerState('correct')
    setEncourageText(getRandomEncourage(true))
    setCorrectCount((c) => c + 1)
    recordAnswer(question.word, true, 1)
    speak(question.word)
    playSfx('correct')
    if (currentIndex + 1 >= TOTAL_QUESTIONS) stopBgm()
    setShowFeedback(true)
  }, [question, speak, recordAnswer, playSfx, currentIndex, TOTAL_QUESTIONS, stopBgm])

  const handleSpellingWrong = useCallback(() => {
    if (!question) return
    const newAttemptCount = attemptCount + 1
    setAttemptCount(newAttemptCount)

    if (newAttemptCount >= 2) {
      setAnswerState('wrong_second')
      setEncourageText('正确答案是——')
      recordAnswer(question.word, false, newAttemptCount)
      speak(question.correctAnswer, question.sentence)
      if (currentIndex + 1 >= TOTAL_QUESTIONS) stopBgm()
      setShowFeedback(true)
    } else {
      recordAnswer(question.word, false, newAttemptCount)
    }
  }, [question, attemptCount, speak, recordAnswer, currentIndex, TOTAL_QUESTIONS, stopBgm])

  // ── 下一题 ──
  const handleNext = useCallback(() => {
    setShowFeedback(false)

    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      const accuracy = correctCount / TOTAL_QUESTIONS
      const completedAt = new Date().toISOString()

      updateGameState((prev) => {
        const completedKey = `${chapterId}-${levelId}`
        const furnitureId = `furniture_ch${chapterId}_lv${levelId}`
        const nextUnlockedFurniture = prev.unlockedFurniture.includes(furnitureId)
          ? prev.unlockedFurniture
          : [...prev.unlockedFurniture, furnitureId]
        const nextWordHistory = { ...prev.wordHistory }

        for (const [word, stats] of Object.entries(wordStats)) {
          const existing = nextWordHistory[word] ?? {
            correct: 0,
            wrong: 0,
            lastSeen: completedAt,
          }
          nextWordHistory[word] = {
            ...existing,
            correct: existing.correct + stats.correct,
            wrong: existing.wrong + stats.wrong,
            lastSeen: completedAt,
          }
        }

        const nextState = {
          ...prev,
          completedLevels: {
            ...prev.completedLevels,
            [completedKey]: {
              accuracy,
              completedAt,
            },
          },
          unlockedFurniture: nextUnlockedFurniture,
          wordHistory: nextWordHistory,
        }

        if (levelId === 4) {
          return {
            ...nextState,
            currentChapter: Math.min(chapterId + 1, 5),
            currentLevel: 1,
          }
        }

        return {
          ...nextState,
          currentChapter: chapterId,
          currentLevel: Math.min(levelId + 1, 4),
        }
      })

      // 构建本关单词详情
      const levelWordDetails = questions.map((q) => ({
        word: q.word,
        meaning: q.meaning,
        sentence: q.sentence,
        type: q.type,
        stats: wordStats[q.word] ?? { correct: 0, wrong: 0, firstCorrect: false },
      }))

      void navigate(`/chapter/${chapterId}/level/${levelId}/result`, {
        state: { levelWordDetails, furnitureJustUnlocked: true },
      })

      // 关卡结束后 AI 大调整
      adjustDifficultyViaLLM(accuracy, gameState.adaptiveDifficulty.current, wordStats).then(
        (newDifficulty) => {
          updateGameState((prev) => ({
            ...prev,
            difficulty: newDifficulty,
            adaptiveDifficulty: {
              ...prev.adaptiveDifficulty,
              current: newDifficulty,
              levelHistory: [...prev.adaptiveDifficulty.levelHistory, newDifficulty],
            },
          }))
        },
      )
      return
    }

    setCurrentIndex((i) => i + 1)
    setAnswerState('idle')
    setSelectedOption(null)
    setAttemptCount(0)
    setTopImgLoaded(false)
  }, [chapterId, correctCount, currentIndex, gameState.adaptiveDifficulty.current, levelId, navigate, questions, TOTAL_QUESTIONS, updateGameState, wordStats])

  // ── 自动推进 ──
  useEffect(() => {
    if (!showFeedback) return

    if (answerState === 'wrong_first') {
      const timer = setTimeout(() => {
        setShowFeedback(false)
        setAnswerState('idle')
        setSelectedOption(null)
      }, 1000)
      return () => clearTimeout(timer)
    }

    if (answerState === 'correct') {
      const timer = setTimeout(() => {
        handleNext()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [answerState, handleNext, showFeedback])

  const handleExitConfirm = useCallback(() => {
    void navigate(-1)
  }, [navigate])

  // ── Loading / 无题目时 ──
  if (!question || questions.length === 0) {
    return (
      <div className="game-loading">
        <p className="game-loading__text">正在准备题目...</p>
      </div>
    )
  }

  // ── 判断是否为选项类题型 ──
  const isChoiceType = question.type === 'multiple_choice' || question.type === 'fill_blank' || question.type === 'picture_matching'
  const isSpellingType = question.type === 'letter_match' || question.type === 'word_spelling'

  // ── 是否展示顶部配图 ──
  // multiple_choice（看图选词）：需要大图 — 用户看图猜词
  // letter_match（字母消消乐）：需要大图 — 给用户视觉提示
  // fill_blank（填空题）：不需要 — 用户看例句选词
  // picture_matching（图片配对）：不需要 — 用户看英文选中文
  // word_spelling（看图拼出单词）：不需要顶部大图 — LetterPuzzle 内已有小图
  const showImage = question.type === 'multiple_choice' || question.type === 'letter_match'

  return (
    <div className="game-page">
      {/* Bottom white gradient overlay */}
      <div className="game-gradient" />

      {/* Top navigation bar */}
      <div className="game-header">
        <div className="game-header__inner">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="game-header__exit-btn icon-btn--md"
          >
            <Icon icon="lucide:arrow-left" style={{ width: '20px', height: '20px', color: '#5D4037' }} />
          </button>

          <div className="game-header__info">
            <span className="game-header__title">
              第 {levelId} 关 · {chapterName}
            </span>
          </div>

          {/* 自动朗读开关：全局 ttsEnabled 关闭时，视觉上也显示为关 */}
          {(() => {
            const ttsOn = gameState.settings.ttsEnabled
            const active = autoRead && ttsOn
            return (
              <button
                onClick={() => {
                  if (!ttsOn) return
                  setAutoRead((prev) => {
                    const next = !prev
                    autoReadRef.current = next
                    if (!next && window.speechSynthesis) {
                      window.speechSynthesis.cancel()
                    }
                    return next
                  })
                }}
                className="game-header__tts-btn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? 'rgba(255,184,64,0.15)' : 'transparent',
                  border: active ? '1.5px solid rgba(255,184,64,0.4)' : '1.5px solid rgba(93,64,55,0.3)',
                  cursor: ttsOn ? 'pointer' : 'not-allowed',
                  opacity: ttsOn ? 1 : 0.5,
                }}
              >
                <Icon
                  icon="lucide:mic"
                  style={{ width: 18, height: 18, color: active ? '#FF7821' : 'rgba(93,64,55,0.3)' }}
                />
              </button>
            )
          })()}
        </div>
      </div>

      {/* Main content */}
      <div className="game-content">
        {/* 配图区 */}
        {showImage && (
          <div className={`game-word-image ${topImgLoaded ? 'game-word-image--loaded' : ''}`}>
            <img
              src={question.image}
              alt={question.word}
              className="game-word-image__img"
              onLoad={() => setTopImgLoaded(true)}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            {!topImgLoaded && (
              <span className="game-word-image__letter">
                {question.word.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* White question card */}
        <div
          className="game-question-card"
          style={{
            paddingTop: showImage ? '68px' : '32px',
            marginTop: showImage ? 0 : 16,
          }}
        >
          {/* Progress text */}
          <p className="game-progress-text">
            第 {currentIndex + 1} 题 · 共 {TOTAL_QUESTIONS} 题
          </p>

          {/* ── Type-dependent hint area ── */}
          {question.type === 'picture_matching' && (
            <p className="game-picture-word">
              {question.word}
            </p>
          )}

          {question.type === 'fill_blank' && (
            <p className="game-fill-sentence">
              {question.sentence.split('___').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="game-fill-blank-marker">___</span>
                  )}
                </span>
              ))}
            </p>
          )}

          {/* ── 中文含义占位（答对后可见，避免布局跳动） ── */}
          {(question.type === 'multiple_choice' || question.type === 'fill_blank') && (
            <p className={`game-meaning-reveal ${answerState === 'correct' ? 'game-meaning-reveal--visible' : ''}`}>
              {question.meaning}
            </p>
          )}

          {/* ── 选项类题型 ── */}
          {isChoiceType && (
            <div className="game-options" data-no-click-sfx>
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  disabled={optionsDisabled}
                  className={getOptionClass(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* ── 拼写类题型 ── */}
          {isSpellingType && question.letters && (
            <LetterPuzzle
              letters={question.letters}
              correctWord={question.word}
              onComplete={handleSpellingComplete}
              onWrong={handleSpellingWrong}
              disabled={answerState !== 'idle'}
              showMeaning={question.meaning}
              image={question.type === 'word_spelling' ? question.image : undefined}
            />
          )}
        </div>

        {/* Bottom spacer */}
        <div className="game-spacer" />
      </div>

      {/* Feedback sheet */}
      {showFeedback && answerState !== 'idle' && (
        <FeedbackSheet
          answerState={answerState}
          question={question}
          encourageText={encourageText}
          onNext={handleNext}
          onSpeak={
            answerState === 'wrong_second' && gameState.settings.ttsEnabled && autoRead
              ? () => _speakWord(question.correctAnswer, { enabled: true, sentence: question.sentence })
              : undefined
          }
        />
      )}

      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <ConfirmDialog
          onConfirm={handleExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}

      {/* LLM 难度调整提示 Toast */}
      {difficultyToast?.show && (
        <div
          className="game-difficulty-toast"
          style={{
            animation: 'diffToastIn 400ms ease-out, diffToastOut 400ms 3400ms ease-in forwards',
          }}
        >
          <div
            className="game-difficulty-toast__card"
            style={{
              backgroundColor: difficultyToast.direction === 'up' ? '#E8F5E9' : '#FFF1E8',
              border: `2px solid ${difficultyToast.direction === 'up' ? 'rgba(102,187,106,0.3)' : 'rgba(255,120,33,0.3)'}`,
            }}
          >
            <span className="game-difficulty-toast__emoji">
              {difficultyToast.direction === 'up' ? '🚀' : '🌱'}
            </span>
            <div>
              <div className="game-difficulty-toast__title">
                {difficultyToast.direction === 'up' ? '难度提升！' : '难度调整'}
              </div>
              <div className="game-difficulty-toast__subtitle">
                {difficultyToast.direction === 'up'
                  ? `表现很棒！进入 ${DIFFICULTY_LABELS[difficultyToast.to] ?? `Lv.${difficultyToast.to}`}`
                  : `放慢节奏 → ${DIFFICULTY_LABELS[difficultyToast.to] ?? `Lv.${difficultyToast.to}`}`}
              </div>
            </div>
            <button
              onClick={() => setDifficultyToast(null)}
              className="game-difficulty-toast__close"
            >
              <Icon icon="lucide:x" style={{ width: 12, height: 12, color: 'rgba(93,64,55,0.4)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
