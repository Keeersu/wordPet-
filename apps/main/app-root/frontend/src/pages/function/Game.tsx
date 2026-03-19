/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 英语单词答题页面，展示单词配图和四个选项供用户选择，支持答题交互、反馈弹窗和进度管理。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 查看当前题目的单词配图
 * - 从四个选项中选出正确答案（最多2次机会）
 * - 答对/答错视觉反馈（绿色/红色高亮）
 * - 底部反馈弹窗（鼓励文案、正确答案展示）
 * - 进度实时更新（第X题·共10题）
 * - 退出确认对话框
 * - 返回上一页
 *
 * ## Basic Layout
 * 纯色背景 + 白色底部渐变 + 顶部导航 + 单词插图 + 白色题目卡片 + 底部反馈弹窗
 *
 * ## Page Layout
 * 全屏纯色背景（CSS变量 --game-bg-color），底部白色渐变层覆盖40%高度。
 *
 * **Header**: 透明背景导航栏
 * - 左侧：← 返回按钮（白底圆角方形），点击弹出退出确认
 * - 中间：「第 X 关 · WordPet」
 * - 右侧：空
 *
 * **Main**:
 * 1. 单词插图区：圆形色块占位（160px，#FFB840 30%透明度），下半部分压入卡片
 * 2. 白色题目卡片：圆角20px，paddingTop 80px，包含进度文字、题目文案、4个选项按钮
 * 3. 底部留白100px（反馈弹窗弹出区）
 *
 * **FeedbackSheet**: 底部滑入弹窗
 * - 答对：鼓励文案 + 下一题按钮
 * - 答错第1次：鼓励文案 + 再试一次按钮
 * - 答错第2次：正确答案 + 词义 + 例句 + 下一题按钮
 *
 * ## Mock Data
 * 10道四选一题目，涵盖家居/生活场景单词
 * </page-design>
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'

// ============================================================================
// Mock Data
// ============================================================================

interface Question {
  word: string
  meaning: string
  sentence: string
  options: string[]
  correctAnswer: string
}

const QUESTIONS: Question[] = [
  {
    word: 'sofa',
    meaning: 'n. 沙发；长沙发',
    sentence: 'Come sit on the sofa.',
    options: ['sofa', 'lamp', 'desk', 'book'],
    correctAnswer: 'sofa',
  },
  {
    word: 'lamp',
    meaning: 'n. 灯；台灯',
    sentence: 'Turn on the lamp, please.',
    options: ['chair', 'lamp', 'table', 'door'],
    correctAnswer: 'lamp',
  },
  {
    word: 'chair',
    meaning: 'n. 椅子',
    sentence: 'Please sit in the chair.',
    options: ['sofa', 'bed', 'chair', 'shelf'],
    correctAnswer: 'chair',
  },
  {
    word: 'table',
    meaning: 'n. 桌子',
    sentence: 'Put it on the table.',
    options: ['desk', 'table', 'floor', 'wall'],
    correctAnswer: 'table',
  },
  {
    word: 'clock',
    meaning: 'n. 时钟',
    sentence: 'The clock shows three.',
    options: ['watch', 'phone', 'clock', 'bell'],
    correctAnswer: 'clock',
  },
  {
    word: 'window',
    meaning: 'n. 窗户',
    sentence: 'Open the window for fresh air.',
    options: ['window', 'mirror', 'door', 'wall'],
    correctAnswer: 'window',
  },
  {
    word: 'pillow',
    meaning: 'n. 枕头',
    sentence: 'Rest your head on the pillow.',
    options: ['blanket', 'sheet', 'pillow', 'towel'],
    correctAnswer: 'pillow',
  },
  {
    word: 'carpet',
    meaning: 'n. 地毯',
    sentence: 'The cat sleeps on the carpet.',
    options: ['carpet', 'curtain', 'couch', 'closet'],
    correctAnswer: 'carpet',
  },
  {
    word: 'shelf',
    meaning: 'n. 架子；搁板',
    sentence: 'Put the books on the shelf.',
    options: ['drawer', 'shelf', 'basket', 'box'],
    correctAnswer: 'shelf',
  },
  {
    word: 'mirror',
    meaning: 'n. 镜子',
    sentence: 'Look at yourself in the mirror.',
    options: ['glass', 'screen', 'frame', 'mirror'],
    correctAnswer: 'mirror',
  },
]

const TOTAL_QUESTIONS = QUESTIONS.length

const ENCOURAGE_CORRECT = [
  '完美！',
  '太棒了！',
  '就是这样！',
  '答对啦！',
  '真厉害！',
]

const ENCOURAGE_WRONG = [
  '没关系，继续加油！',
  '差一点～再来！',
  '记住了，下次一定会！',
  '别灰心，你可以的！',
]

function getRandomEncourage(isCorrect: boolean): string {
  const list = isCorrect ? ENCOURAGE_CORRECT : ENCOURAGE_WRONG
  return list[Math.floor(Math.random() * list.length)]
}

// ============================================================================
// Types
// ============================================================================

type AnswerState = 'idle' | 'correct' | 'wrong_first' | 'wrong_second'

const CHAPTER_NAME_MAP: Record<number, string> = {
  1: '街角流浪',
  2: '温暖新家',
  3: '幼儿园',
  4: '公园探险',
  5: '厨房美食',
}

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
}: {
  answerState: 'correct' | 'wrong_first' | 'wrong_second'
  question: Question
  encourageText: string
  onNext: () => void
}) {
  const isCorrect = answerState === 'correct'
  const isWrongSecond = answerState === 'wrong_second'
  const headerText = isWrongSecond ? '正确答案是——' : encourageText

  return (
    <>
      {/* Sheet — no overlay, options stay visible */}
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
        {/* Status icon + encourage text */}
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

        {/* Show correct answer on second wrong attempt */}
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

        {/* Action button */}
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

      {/* Keyframe animation */}
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
// Main Component
// ============================================================================

function Game() {
  const navigate = useNavigate()
  const { chapterId: chapterIdParam, levelId: levelIdParam } = useParams()
  const { gameState, updateGameState } = useGameStore()

  const chapterId = Number(chapterIdParam ?? gameState.currentChapter)
  const levelId = Number(levelIdParam ?? gameState.currentLevel)
  const chapterName = CHAPTER_NAME_MAP[chapterId] ?? `第${chapterId}章`

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [encourageText, setEncourageText] = useState('')
  // Track correct count for completion screen
  const [correctCount, setCorrectCount] = useState(0)
  const [wordStats, setWordStats] = useState<Record<string, { correct: number; wrong: number }>>({})

  const question = QUESTIONS[currentIndex]

  // Get option style based on answer state
  const getOptionStyle = useCallback(
    (option: string) => {
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

      // Correct answer highlight (on correct, or on second wrong attempt)
      if (option === question.correctAnswer && (answerState === 'correct' || answerState === 'wrong_second')) {
        return {
          ...baseStyle,
          backgroundColor: '#66BB6A',
          color: 'white',
          boxShadow: '0 3px 0 0 #4CAF50',
        }
      }

      // Wrong selected option
      if (option === selectedOption && (answerState === 'wrong_first' || answerState === 'wrong_second')) {
        return {
          ...baseStyle,
          backgroundColor: answerState === 'wrong_second' ? '#FFEBEE' : '#EF5350',
          color: answerState === 'wrong_second' ? '#C62828' : 'white',
          boxShadow: answerState === 'wrong_second' ? '0 3px 0 0 #F8BBD0' : '0 3px 0 0 #D32F2F',
        }
      }

      // Other options — dimmed
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

  // Determine if options are disabled
  const optionsDisabled = useMemo(
    () => answerState !== 'idle',
    [answerState],
  )

  // Handle option click
  const handleOptionClick = useCallback(
    (option: string) => {
      if (optionsDisabled) return

      setSelectedOption(option)
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)

      if (option === question.correctAnswer) {
        setAnswerState('correct')
        setEncourageText(getRandomEncourage(true))
        setCorrectCount((c) => c + 1)
        setWordStats((prev) => {
          const existing = prev[question.word] ?? { correct: 0, wrong: 0 }
          return {
            ...prev,
            [question.word]: {
              correct: existing.correct + 1,
              wrong: existing.wrong,
            },
          }
        })
        setShowFeedback(true)
        return
      } else if (newAttemptCount === 1) {
        setAnswerState('wrong_first')
        setEncourageText(getRandomEncourage(false))
        setWordStats((prev) => {
          const existing = prev[question.word] ?? { correct: 0, wrong: 0 }
          return {
            ...prev,
            [question.word]: {
              correct: existing.correct,
              wrong: existing.wrong + 1,
            },
          }
        })
        setShowFeedback(true)
      } else {
        setAnswerState('wrong_second')
        setEncourageText('正确答案是——')
        setWordStats((prev) => {
          const existing = prev[question.word] ?? { correct: 0, wrong: 0 }
          return {
            ...prev,
            [question.word]: {
              correct: existing.correct,
              wrong: existing.wrong + 1,
            },
          }
        })
        setShowFeedback(true)
      }
    },
    [optionsDisabled, attemptCount, question],
  )

  // Handle next question
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

      void navigate(`/chapter/${chapterId}/level/${levelId}/result`)
      return
    }

    setCurrentIndex((i) => i + 1)
    setAnswerState('idle')
    setSelectedOption(null)
    setAttemptCount(0)
  }, [chapterId, correctCount, currentIndex, levelId, navigate, updateGameState, wordStats])

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

  // Handle exit
  const handleExitConfirm = useCallback(() => {
    void navigate(-1)
  }, [navigate])

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
          {/* Back button */}
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

          {/* Title */}
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#5D4037',
            }}
          >
            第 {levelId} 关 · {chapterName}
          </span>

          {/* Right spacer */}
          <div style={{ width: '40px', height: '40px' }} />
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
          paddingTop: '52px',
        }}
      >
        {/* Word illustration placeholder */}
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,184,64,0.3)',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'rgba(93,64,55,0.4)',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '-80px',
            zIndex: 2,
          }}
        >
          {question.word.charAt(0).toUpperCase()}
        </div>

        {/* White question card */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: 'calc(100% - 32px)',
            backgroundColor: 'white',
            borderRadius: '20px',
            paddingTop: '80px',
            paddingBottom: '24px',
            paddingLeft: '20px',
            paddingRight: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
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

          {/* Question text */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '17px',
              fontWeight: 700,
              color: '#5D4037',
              margin: '16px 0',
            }}
          >
            选出正确的单词
          </p>

          {/* Option buttons */}
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
        />
      )}

      {/* Exit confirmation dialog */}
      {showExitConfirm && (
        <ConfirmDialog
          onConfirm={handleExitConfirm}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  )
}

export default Game
