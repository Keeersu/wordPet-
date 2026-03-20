/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 英语单词答题页面，动态生成题目（根据难度等级调整题型比例、例句难度、干扰项策略），支持多种题型（看图选词、填空、字母消消乐、拼写、图片配对），含自适应难度、TTS 和反馈机制。
 * Style referenceFiles:
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
import type { GameState } from '@/store/gameStore'
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

// ── TTS 封装：使用 ttsEnabled 控制朗读 ──
function speakWord(word: string, gameState: GameState, sentence?: string) {
  _speakWord(word, { enabled: gameState.settings.ttsEnabled, sentence })
}

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

const QUESTION_TYPE_HINT: Record<string, string> = {
  multiple_choice: '这张图对应哪个单词？',
  fill_blank: '选出空格处的单词',
  picture_matching: '选出对应的中文含义',
  letter_match: '把字母排列成正确的单词',
  word_spelling: '看图片拼出单词',
}

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          width: '280px',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '28px 24px 20px',
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        }}
      >
        <p
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#5D4037',
            margin: '0 0 8px',
          }}
        >
          确认退出？
        </p>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(93,64,55,0.6)',
            margin: '0 0 24px',
            lineHeight: 1.5,
          }}
        >
          退出后本关进度将丢失
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid rgba(93,64,55,0.15)',
              backgroundColor: 'white',
              fontSize: '15px',
              fontWeight: 700,
              color: '#5D4037',
              cursor: 'pointer',
              fontFamily: "'Nunito', 'PingFang SC', sans-serif",
            }}
          >
            继续答题
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#EF5350',
              fontSize: '15px',
              fontWeight: 700,
              color: 'white',
              cursor: 'pointer',
              fontFamily: "'Nunito', 'PingFang SC', sans-serif",
            }}
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
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 51,
          backgroundColor: 'white',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '24px 20px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 34px))',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
          fontFamily: "'Nunito', 'PingFang SC', sans-serif",
          animation: 'slideUp 300ms ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isWrongSecond ? '16px' : '0' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isCorrect ? '#66BB6A' : '#EF5350',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon
              icon={isCorrect ? 'lucide:check' : 'lucide:x'}
              style={{ width: '18px', height: '18px', color: 'white' }}
            />
          </div>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#5D4037' }}>
            {headerText}
          </span>
        </div>

        {isWrongSecond && (
          <div
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(93,64,55,0.6)' }}>
                正确答案：
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#66BB6A',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {question.correctAnswer}
              </span>
              {onSpeak && (
                <button
                  onClick={onSpeak}
                  style={{
                    marginLeft: 'auto',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,184,64,0.15)',
                    border: '1.5px solid #FFB840',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  🔊
                </button>
              )}
            </div>
            <p style={{ fontSize: '14px', color: '#5D4037', margin: '0 0 4px', fontWeight: 600 }}>
              {question.meaning}
            </p>
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(93,64,55,0.6)',
                margin: 0,
                fontStyle: 'italic',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              &ldquo;{question.sentence}&rdquo;
            </p>
          </div>
        )}

        {isWrongSecond && (
          <button
            onClick={onNext}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#FFB840',
              fontSize: '16px',
              fontWeight: 700,
              color: '#3D1F00',
              cursor: 'pointer',
              fontFamily: "'Nunito', 'PingFang SC', sans-serif",
              boxShadow: '0 3px 0 0 #D99A20',
            }}
          >
            下一题 →
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
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
  const [selected, setSelected] = useState<number[]>([])
  const [availableLetters, setAvailableLetters] = useState(letters)
  const [isWrong, setIsWrong] = useState(false)

  useEffect(() => {
    setSelected([])
    setAvailableLetters(letters)
    setIsWrong(false)
  }, [letters])

  const currentWord = selected.map((idx) => letters[idx]).join('')

  const handleLetterClick = (index: number) => {
    if (disabled || selected.includes(index)) return

    const newSelected = [...selected, index]
    setSelected(newSelected)

    const newWord = newSelected.map((idx) => letters[idx]).join('')

    // 检查是否完成
    if (newWord.length === correctWord.length) {
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* 配图 */}
      {image && (
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 12,
            backgroundColor: 'rgba(255,184,64,0.15)',
            border: '2px solid rgba(255,184,64,0.3)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <img
            src={image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span style={{ position: 'relative', zIndex: 1, fontSize: 36, color: 'rgba(93,64,55,0.25)' }}>
            {correctWord.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* 含义提示 */}
      {showMeaning && (
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFB840' }}>
          {showMeaning}
        </p>
      )}

      {/* 已选区域（目标位） */}
      <div style={{ display: 'flex', gap: 6, minHeight: 48 }}>
        {correctWord.split('').map((_, idx) => {
          const letter = selected[idx] !== undefined ? letters[selected[idx]] : ''
          return (
            <div
              key={idx}
              style={{
                width: 40,
                height: 48,
                borderRadius: 10,
                border: isWrong && currentWord.length === correctWord.length
                  ? '2px solid #EF5350'
                  : letter
                    ? '2px solid #FFB840'
                    : '2px dashed rgba(93,64,55,0.2)',
                backgroundColor: isWrong && currentWord.length === correctWord.length
                  ? '#FFEBEE'
                  : letter ? '#FFF8E7' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#5D4037',
                fontFamily: "'Nunito', sans-serif",
                transition: 'all 150ms ease',
              }}
            >
              {letter}
            </div>
          )
        })}

        {/* 撤销按钮 */}
        {selected.length > 0 && !disabled && (
          <button
            onClick={handleUndo}
            style={{
              width: 40,
              height: 48,
              borderRadius: 10,
              border: '2px solid rgba(93,64,55,0.15)',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            <Icon icon="lucide:undo-2" style={{ width: 18, height: 18, color: '#8D6E63' }} />
          </button>
        )}
      </div>

      {/* 可选字母区 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {availableLetters.map((letter, idx) => {
          const isUsed = selected.includes(idx)
          return (
            <button
              key={`${letter}-${idx}`}
              onClick={() => handleLetterClick(idx)}
              disabled={disabled || isUsed}
              style={{
                width: 44,
                height: 52,
                borderRadius: 12,
                border: 'none',
                backgroundColor: isUsed ? 'rgba(93,64,55,0.08)' : '#FFF8E7',
                color: isUsed ? 'transparent' : '#5D4037',
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                cursor: isUsed ? 'default' : 'pointer',
                boxShadow: isUsed ? 'none' : '0 3px 0 0 #E8D5B0',
                transition: 'all 150ms ease',
              }}
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
  const [correctCount, setCorrectCount] = useState(0)
  const [wordStats, setWordStats] = useState<Record<string, { correct: number; wrong: number; firstCorrect: boolean }>>({})

  // ── 自动朗读开关（答题页内，默认开启） ──
  const [autoRead, setAutoRead] = useState(true)

  // ── 题内实时微调追踪 ──
  const recentResults = useRef<boolean[]>([]) // 最近 3 题结果
  const sentenceLevelOverride = useRef<'basic' | 'advanced' | null>(null)

  // ── LLM 难度变化提示（关卡开始时展示） ──
  const [difficultyToast, setDifficultyToast] = useState<{
    show: boolean
    direction: 'up' | 'down' | 'same'
    from: number
    to: number
  } | null>(null)

  useEffect(() => {
    const history = gameState.adaptiveDifficulty.levelHistory
    if (history.length >= 2) {
      const prev = history[history.length - 2]
      const curr = history[history.length - 1]
      if (prev !== curr) {
        setDifficultyToast({
          show: true,
          direction: curr > prev ? 'up' : 'down',
          from: prev,
          to: curr,
        })
        const timer = setTimeout(() => setDifficultyToast(null), 4000)
        return () => clearTimeout(timer)
      }
    }
  }, []) // 仅挂载时检查一次

  const question = questions[currentIndex]

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
  const difficultyLabel = useMemo(() => {
    const labels: Record<number, string> = { 1: '🐾', 2: '🐾🐾', 3: '🐾🐾🐾', 4: '🐾🐾🐾🐾' }
    return labels[currentDifficulty] ?? '🐾'
  }, [currentDifficulty])

  // ── 选项样式 ──
  const getOptionStyle = useCallback(
    (option: string) => {
      if (!question) return {}

      const baseStyle = {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '14px',
        border: 'none',
        fontSize: '16px',
        fontWeight: 700 as const,
        textAlign: 'center' as const,
        cursor: 'pointer',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        transition: 'background-color 100ms ease, color 100ms ease, box-shadow 100ms ease',
      }

      if (answerState === 'idle') {
        return {
          ...baseStyle,
          backgroundColor: '#FFF8E7',
          color: '#5D4037',
          boxShadow: '0 3px 0 0 #E8D5B0',
        }
      }

      if (option === question.correctAnswer && (answerState === 'correct' || answerState === 'wrong_second')) {
        return {
          ...baseStyle,
          backgroundColor: '#66BB6A',
          color: 'white',
          boxShadow: '0 3px 0 0 #4CAF50',
        }
      }

      if (option === selectedOption && (answerState === 'wrong_first' || answerState === 'wrong_second')) {
        return {
          ...baseStyle,
          backgroundColor: answerState === 'wrong_second' ? '#FFEBEE' : '#EF5350',
          color: answerState === 'wrong_second' ? '#C62828' : 'white',
          boxShadow: answerState === 'wrong_second' ? '0 3px 0 0 #F8BBD0' : '0 3px 0 0 #D32F2F',
        }
      }

      return {
        ...baseStyle,
        backgroundColor: '#FFF8E7',
        color: '#5D4037',
        boxShadow: '0 3px 0 0 #E8D5B0',
        opacity: answerState === 'wrong_second' ? 0.4 : 0.5,
      }
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

      if (option === question.correctAnswer) {
        setAnswerState('correct')
        setEncourageText(getRandomEncourage(true))
        setCorrectCount((c) => c + 1)
        recordAnswer(question.word, true, newAttemptCount)
        speakWord(question.word, gameState)
        setShowFeedback(true)
        return
      } else if (newAttemptCount === 1) {
        setAnswerState('wrong_first')
        setEncourageText(getRandomEncourage(false))
        recordAnswer(question.word, false, newAttemptCount)
        setShowFeedback(true)
      } else {
        setAnswerState('wrong_second')
        setEncourageText('正确答案是——')
        recordAnswer(question.word, false, newAttemptCount)
        speakWord(question.correctAnswer, gameState, question.sentence)
        setShowFeedback(true)
      }
    },
    [optionsDisabled, attemptCount, question, gameState, recordAnswer],
  )

  // ── 字母拼写完成回调 ──
  const handleSpellingComplete = useCallback(() => {
    if (!question) return
    setAnswerState('correct')
    setEncourageText(getRandomEncourage(true))
    setCorrectCount((c) => c + 1)
    recordAnswer(question.word, true, 1)
    speakWord(question.word, gameState)
    setShowFeedback(true)
  }, [question, gameState, recordAnswer])

  const handleSpellingWrong = useCallback(() => {
    if (!question) return
    const newAttemptCount = attemptCount + 1
    setAttemptCount(newAttemptCount)

    if (newAttemptCount >= 2) {
      setAnswerState('wrong_second')
      setEncourageText('正确答案是——')
      recordAnswer(question.word, false, newAttemptCount)
      speakWord(question.correctAnswer, gameState, question.sentence)
      setShowFeedback(true)
    } else {
      recordAnswer(question.word, false, newAttemptCount)
    }
  }, [question, attemptCount, gameState, recordAnswer])

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
        state: { levelWordDetails },
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
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F5E6C8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        }}
      >
        <p style={{ color: '#5D4037', fontSize: 16, fontWeight: 700 }}>正在准备题目...</p>
      </div>
    )
  }

  // ── 判断是否为选项类题型 ──
  const isChoiceType = question.type === 'multiple_choice' || question.type === 'fill_blank' || question.type === 'picture_matching'
  const isSpellingType = question.type === 'letter_match' || question.type === 'word_spelling'

  // ── 是否展示配图 ──
  const showImage = question.type !== 'picture_matching'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#F5E6C8',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        color: '#5D4037',
      }}
    >
      {/* Bottom white gradient overlay */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40vh',
          background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top navigation bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingTop: '16px',
          background: '#F5E6C8',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
          }}
        >
          <button
            onClick={() => setShowExitConfirm(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'white',
              border: '2px solid rgba(93,64,55,0.1)',
              boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon icon="lucide:arrow-left" style={{ width: '20px', height: '20px', color: '#5D4037' }} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#5D4037',
              }}
            >
              第 {levelId} 关 · {chapterName}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(93,64,55,0.45)', marginTop: 2 }}>
              {difficultyLabel}
            </span>
          </div>

          {/* 自动朗读开关：全局 ttsEnabled 关闭时，视觉上也显示为关 */}
          {(() => {
            const ttsOn = gameState.settings.ttsEnabled
            const active = autoRead && ttsOn
            return (
              <button
                onClick={() => {
                  if (!ttsOn) return // 全局朗读已关闭，按钮不可操作
                  setAutoRead((prev) => !prev)
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: active ? 'rgba(255,184,64,0.15)' : 'white',
                  border: active ? '2px solid rgba(255,184,64,0.4)' : '2px solid rgba(93,64,55,0.1)',
                  boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: ttsOn ? 'pointer' : 'not-allowed',
                  position: 'relative',
                  transition: 'all 200ms ease',
                  opacity: ttsOn ? 1 : 0.5,
                }}
              >
                <Icon
                  icon={active ? 'lucide:volume-2' : 'lucide:volume-x'}
                  style={{
                    width: '20px',
                    height: '20px',
                    color: active ? '#FFB840' : 'rgba(93,64,55,0.35)',
                  }}
                />
              </button>
            )
          })()}
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '80px',
        }}
      >
        {/* 配图区 */}
        {showImage && (
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 16,
              backgroundColor: 'rgba(255,184,64,0.2)',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: -80,
              zIndex: 2,
            }}
          >
            <img
              src={question.image}
              alt={question.word}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <span style={{ position: 'relative', zIndex: 1, fontSize: 48, color: 'rgba(93,64,55,0.3)' }}>
              {question.word.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* White question card */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: 'calc(100% - 32px)',
            backgroundColor: 'white',
            borderRadius: '20px',
            paddingTop: showImage ? '80px' : '24px',
            paddingBottom: '24px',
            paddingLeft: '20px',
            paddingRight: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            marginTop: showImage ? 0 : 24,
          }}
        >
          {/* Progress text */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '13px',
              color: 'rgba(93,64,55,0.5)',
              margin: 0,
            }}
          >
            第 {currentIndex + 1} 题 · 共 {TOTAL_QUESTIONS} 题
          </p>

          {/* ── Type-dependent hint area ── */}
          {question.type === 'picture_matching' && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 28,
                fontWeight: 900,
                color: '#FFB840',
                margin: '12px 0 0',
                lineHeight: 1.3,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {question.word}
            </p>
          )}

          {question.type === 'fill_blank' && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 16,
                color: '#5D4037',
                margin: '12px 0 0',
                lineHeight: 1.6,
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {question.sentence.split('___').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ color: '#FFB840', fontWeight: 900 }}>___</span>
                  )}
                </span>
              ))}
            </p>
          )}

          {/* Question hint */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '17px',
              fontWeight: 700,
              color: '#5D4037',
              margin: '12px 0 16px',
            }}
          >
            {QUESTION_TYPE_HINT[question.type] ?? '选出正确答案'}
          </p>

          {/* ── 选项类题型 ── */}
          {isChoiceType && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  disabled={optionsDisabled}
                  style={getOptionStyle(option)}
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
        <div style={{ height: '100px', flexShrink: 0 }} />
      </div>

      {/* Feedback sheet */}
      {showFeedback && answerState !== 'idle' && (
        <FeedbackSheet
          answerState={answerState}
          question={question}
          encourageText={encourageText}
          onNext={handleNext}
          onSpeak={
            answerState === 'wrong_second' && gameState.settings.ttsEnabled
              ? () => speakWord(question.correctAnswer, gameState, question.sentence)
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
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            animation: 'diffToastIn 400ms ease-out, diffToastOut 400ms 3400ms ease-in forwards',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 20px',
              borderRadius: 16,
              backgroundColor: difficultyToast.direction === 'up' ? '#E8F5E9' : '#FFF3E0',
              border: `2px solid ${difficultyToast.direction === 'up' ? 'rgba(102,187,106,0.3)' : 'rgba(255,184,64,0.3)'}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              fontFamily: "'Nunito', 'PingFang SC', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 22 }}>
              {difficultyToast.direction === 'up' ? '🚀' : '🌱'}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#5D4037', marginBottom: 2 }}>
                {difficultyToast.direction === 'up' ? '难度提升！' : '难度调整'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.6)' }}>
                {difficultyToast.direction === 'up'
                  ? `表现很棒！进入 ${DIFFICULTY_LABELS[difficultyToast.to] ?? `Lv.${difficultyToast.to}`}`
                  : `放慢节奏 → ${DIFFICULTY_LABELS[difficultyToast.to] ?? `Lv.${difficultyToast.to}`}`}
              </div>
            </div>
            <button
              onClick={() => setDifficultyToast(null)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(93,64,55,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 4,
                flexShrink: 0,
              }}
            >
              <Icon icon="lucide:x" style={{ width: 12, height: 12, color: 'rgba(93,64,55,0.4)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Toast 动画 */}
      <style>{`
        @keyframes diffToastIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes diffToastOut {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
      `}</style>
    </div>
  )
}

export default Game
