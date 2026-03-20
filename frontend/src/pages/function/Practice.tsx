/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 错题 / 弱词复习中心 — 汇总所有正确率低于 70% 的单词，支持一键全局复习或按章节复习，直接在页面内完成答题练习。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 顶部复习摘要卡（待复习词数 + 平均正确率）
 * - "开始复习"主按钮 → 进入答题模式
 * - 按章节分组的弱词列表（可展开折叠）
 * - 每章有独立"复习本章"按钮
 * - 内嵌答题模式：与 Game 页相同的 5 种题型
 * - 复习完成后显示结果卡片 + 返回
 *
 * ## Page Layout
 * h-screen flex flex-col，顶部固定 Header，中间可滚动内容，底部 MainTabBar
 * </page-design>
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { MainTabBar } from '@/components/function/MainTabBar'
import { useGameStore } from '@/store/GameContext'
import { chapterWordsMap } from '@/data/words'
import type { WordConfig, DifficultyLevel } from '@/data/words/types'
import { getSentence, getDistractors } from '@/data/words/types'
import { getQuestionTypeDistribution } from '@/data/difficulty'
import type { QuestionType } from '@/data/difficulty'
import type { GeneratedQuestion } from '@/data/questionGenerator'

// ─── 章节中文名 ────────────────────────────────────────────────────────
const CHAPTER_NAMES: Record<number, { emoji: string; en: string; zh: string }> = {
  1: { emoji: '🏠', en: 'My Home', zh: '我的家' },
  2: { emoji: '🌳', en: 'Nature', zh: '大自然' },
  3: { emoji: '🍎', en: 'Food & Drink', zh: '食物饮料' },
  4: { emoji: '🐶', en: 'Animals', zh: '动物世界' },
  5: { emoji: '👕', en: 'Clothes', zh: '穿衣打扮' },
}

// ─── 样式常量 ────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 16,
  border: '2px solid rgba(93,64,55,0.1)',
  boxShadow: '0 4px 0 0 rgba(93,64,55,0.08)',
  padding: '14px 16px',
}

function rateColor(rate: number): string {
  if (rate >= 80) return '#66BB6A'
  if (rate >= 60) return '#FFB840'
  return '#EF5350'
}

function rateBg(rate: number): string {
  if (rate >= 80) return 'rgba(102,187,106,0.12)'
  if (rate >= 60) return 'rgba(255,184,64,0.12)'
  return 'rgba(239,83,80,0.12)'
}

// ─── 工具函数 ────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function scrambleLetters(word: string): string[] {
  const letters = word.split('')
  let scrambled = shuffle(letters)
  let attempts = 0
  while (scrambled.join('') === word && attempts < 10) {
    scrambled = shuffle(letters)
    attempts++
  }
  return scrambled
}

// ─── 弱词数据结构 ────────────────────────────────────────────────────

interface WeakWord {
  word: string
  meaning: string
  pos: string
  rate: number
  total: number
  chapterId: number
  config: WordConfig
}

interface ChapterWeakGroup {
  chapterId: number
  name: typeof CHAPTER_NAMES[number]
  words: WeakWord[]
  avgRate: number
}

// ─── 复习题目生成器（仅针对弱词） ────────────────────────────────────

function generateReviewQuestion(
  wordConfig: WordConfig,
  questionType: QuestionType,
  difficulty: DifficultyLevel,
  allWords: WordConfig[],
): GeneratedQuestion {
  const sentencePair = getSentence(wordConfig, difficulty)

  switch (questionType) {
    case 'multiple_choice': {
      const distractors = getDistractors(wordConfig, difficulty, allWords)
      return {
        type: 'multiple_choice',
        word: wordConfig.word,
        meaning: wordConfig.meaning,
        pos: wordConfig.pos,
        sentence: sentencePair.en,
        sentenceZh: sentencePair.zh,
        options: shuffle([wordConfig.word, ...distractors.slice(0, 3)]),
        correctAnswer: wordConfig.word,
        image: wordConfig.image,
      }
    }
    case 'fill_blank': {
      const distractors = getDistractors(wordConfig, difficulty, allWords)
      let sentence = sentencePair.en
      if (!sentence.includes('___')) {
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
        options: shuffle([wordConfig.word, ...distractors.slice(0, 3)]),
        correctAnswer: wordConfig.word,
        image: wordConfig.image,
      }
    }
    case 'letter_match':
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
    case 'word_spelling':
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
    case 'picture_matching': {
      const others = allWords.filter((w) => w.word !== wordConfig.word)
      const distractorWords = shuffle(others).slice(0, 3)
      return {
        type: 'picture_matching',
        word: wordConfig.word,
        meaning: wordConfig.meaning,
        pos: wordConfig.pos,
        sentence: sentencePair.en,
        sentenceZh: sentencePair.zh,
        options: shuffle([wordConfig.meaning, ...distractorWords.map((w) => w.meaning)]),
        correctAnswer: wordConfig.meaning,
        image: wordConfig.image,
        matchPairs: shuffle([wordConfig, ...distractorWords].map((w) => ({
          word: w.word,
          meaning: w.meaning,
          image: w.image,
        }))),
      }
    }
  }
}

function generateReviewQuestions(
  weakWords: WeakWord[],
  difficulty: DifficultyLevel,
): GeneratedQuestion[] {
  if (weakWords.length === 0) return []

  // 取最多 10 个弱词
  const selected = weakWords.slice(0, 10)
  const count = selected.length

  // 获取题型分配
  const typeDistribution = getQuestionTypeDistribution(difficulty).slice(0, count)

  // 收集所有可用词作为干扰项来源
  const allWordConfigs: WordConfig[] = []
  for (const words of Object.values(chapterWordsMap)) {
    allWordConfigs.push(...words)
  }

  return selected.map((ww, i) => {
    const qType = typeDistribution[i % typeDistribution.length]
    return generateReviewQuestion(ww.config, qType, difficulty, allWordConfigs)
  })
}

// ─── TTS ────────────────────────────────────────────────────────────

function speakWord(word: string, enabled: boolean) {
  if (!enabled || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(word)
  utter.lang = 'en-US'
  utter.rate = 0.85
  window.speechSynthesis.speak(utter)
}

// ─── 主页面 ────────────────────────────────────────────────────────

function Practice() {
  const navigate = useNavigate()
  const { gameState, dispatch } = useGameStore()

  // ── 收集弱词（正确率 < 70%） ──
  const { weakWords, chapterGroups, totalAvgRate } = useMemo(() => {
    const ww: WeakWord[] = []

    for (const [chapterId, words] of Object.entries(chapterWordsMap)) {
      const cid = Number(chapterId)
      for (const wc of words) {
        const record = gameState.wordHistory[wc.word]
        if (!record) continue
        const total = record.correct + record.wrong
        if (total === 0) continue
        const rate = Math.round((record.correct / total) * 100)
        if (rate < 70) {
          ww.push({ word: wc.word, meaning: wc.meaning, pos: wc.pos, rate, total, chapterId: cid, config: wc })
        }
      }
    }

    // 按正确率从低到高排
    ww.sort((a, b) => a.rate - b.rate)

    // 按章节分组
    const groups: ChapterWeakGroup[] = []
    const byChapter = new Map<number, WeakWord[]>()
    for (const w of ww) {
      if (!byChapter.has(w.chapterId)) byChapter.set(w.chapterId, [])
      byChapter.get(w.chapterId)!.push(w)
    }
    for (const [cid, words] of byChapter) {
      const avg = Math.round(words.reduce((s, w) => s + w.rate, 0) / words.length)
      groups.push({
        chapterId: cid,
        name: CHAPTER_NAMES[cid] || { emoji: '📖', en: `Chapter ${cid}`, zh: `第${cid}章` },
        words,
        avgRate: avg,
      })
    }
    groups.sort((a, b) => a.avgRate - b.avgRate)

    const avg = ww.length > 0 ? Math.round(ww.reduce((s, w) => s + w.rate, 0) / ww.length) : 0

    return { weakWords: ww, chapterGroups: groups, totalAvgRate: avg }
  }, [gameState.wordHistory])

  // ── 展开/折叠 ──
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const toggleChapter = (cid: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(cid)) next.delete(cid)
      else next.add(cid)
      return next
    })
  }

  // ── 答题模式 ──
  type ReviewPhase = 'browse' | 'quiz' | 'result'
  const [phase, setPhase] = useState<ReviewPhase>('browse')
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [letterSlots, setLetterSlots] = useState<(string | null)[]>([])
  const [availableLetters, setAvailableLetters] = useState<{ letter: string; idx: number; used: boolean }[]>([])
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)

  const currentQ = questions[currentIdx] || null

  // 开始复习
  const startReview = useCallback((wordsToReview: WeakWord[]) => {
    const qs = generateReviewQuestions(
      shuffle(wordsToReview),
      gameState.difficulty as DifficultyLevel,
    )
    if (qs.length === 0) return
    setQuestions(qs)
    setCurrentIdx(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setSessionCorrect(0)
    setSessionTotal(0)
    setPhase('quiz')

    // 初始化字母题
    const first = qs[0]
    if ((first.type === 'letter_match' || first.type === 'word_spelling') && first.letters) {
      setLetterSlots(new Array(first.word.length).fill(null))
      setAvailableLetters(first.letters.map((l, i) => ({ letter: l, idx: i, used: false })))
    }
  }, [gameState.difficulty])

  // 处理选择答案
  const handleSelectAnswer = useCallback((answer: string) => {
    if (isCorrect !== null || !currentQ) return
    const correct = answer === currentQ.correctAnswer
    setSelectedAnswer(answer)
    setIsCorrect(correct)
    setSessionTotal((p) => p + 1)
    if (correct) setSessionCorrect((p) => p + 1)

    // 更新 wordHistory
    dispatch({
      type: 'RECORD_WORD',
      payload: { word: currentQ.word, correct },
    })

    speakWord(currentQ.word, gameState.settings.soundEnabled)
  }, [isCorrect, currentQ, dispatch, gameState.settings.soundEnabled])

  // 处理字母点击（letter_match / word_spelling）
  const handleLetterClick = useCallback((letterIdx: number) => {
    if (isCorrect !== null || !currentQ) return

    setAvailableLetters((prev) => {
      const updated = [...prev]
      updated[letterIdx] = { ...updated[letterIdx], used: true }
      return updated
    })

    setLetterSlots((prev) => {
      const next = [...prev]
      const emptyIdx = next.findIndex((s) => s === null)
      if (emptyIdx !== -1) {
        const letter = availableLetters[letterIdx]?.letter
        if (letter) next[emptyIdx] = letter
      }

      // 检查是否全部填完
      if (next.every((s) => s !== null)) {
        const formed = next.join('')
        const correct = formed.toLowerCase() === currentQ.word.toLowerCase()
        setTimeout(() => {
          setIsCorrect(correct)
          setSelectedAnswer(formed)
          setSessionTotal((p) => p + 1)
          if (correct) setSessionCorrect((p) => p + 1)
          dispatch({
            type: 'RECORD_WORD',
            payload: { word: currentQ.word, correct },
          })
          speakWord(currentQ.word, gameState.settings.soundEnabled)
        }, 200)
      }

      return next
    })
  }, [isCorrect, currentQ, availableLetters, dispatch, gameState.settings.soundEnabled])

  // 撤销最后一个字母
  const handleUndoLetter = useCallback(() => {
    if (isCorrect !== null) return
    setLetterSlots((prev) => {
      const next = [...prev]
      let lastFilled = -1
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i] !== null) { lastFilled = i; break }
      }
      if (lastFilled === -1) return prev
      const removed = next[lastFilled]
      next[lastFilled] = null

      // 恢复字母
      setAvailableLetters((al) => {
        const updated = [...al]
        const idx = updated.findIndex((l) => l.used && l.letter === removed)
        if (idx !== -1) updated[idx] = { ...updated[idx], used: false }
        return updated
      })

      return next
    })
  }, [isCorrect])

  // 下一题
  const nextQuestion = useCallback(() => {
    const nextIdx = currentIdx + 1
    if (nextIdx >= questions.length) {
      setPhase('result')
      return
    }
    setCurrentIdx(nextIdx)
    setSelectedAnswer(null)
    setIsCorrect(null)

    const nextQ = questions[nextIdx]
    if ((nextQ.type === 'letter_match' || nextQ.type === 'word_spelling') && nextQ.letters) {
      setLetterSlots(new Array(nextQ.word.length).fill(null))
      setAvailableLetters(nextQ.letters.map((l, i) => ({ letter: l, idx: i, used: false })))
    } else {
      setLetterSlots([])
      setAvailableLetters([])
    }
  }, [currentIdx, questions])

  // ── 答题界面渲染 ──
  const renderQuiz = () => {
    if (!currentQ) return null

    const isLetterType = currentQ.type === 'letter_match' || currentQ.type === 'word_spelling'
    const isChoiceType = currentQ.type === 'multiple_choice' || currentQ.type === 'fill_blank' || currentQ.type === 'picture_matching'

    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#F5E6C8', fontFamily: "'Nunito', 'PingFang SC', sans-serif", color: '#5D4037' }}>
        {/* Quiz Header */}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,230,200,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => setPhase('browse')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '2px solid rgba(93,64,55,0.12)', backgroundColor: 'white', boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)', cursor: 'pointer', color: '#5D4037', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
            <Icon icon="lucide:x" style={{ width: 16, height: 16 }} />
            退出
          </button>
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            第 {currentIdx + 1} 题 · 共 {questions.length} 题
          </div>
          <div style={{ width: 68 }} />
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, backgroundColor: 'rgba(93,64,55,0.1)', margin: '0 16px' }}>
          <div style={{ height: '100%', borderRadius: 2, backgroundColor: '#FFB840', width: `${((currentIdx + (isCorrect !== null ? 1 : 0)) / questions.length) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Question content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 160 }}>
          {/* Word image */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: 16, overflow: 'hidden', margin: '0 auto', border: '3px solid white', boxShadow: '0 4px 0 0 rgba(93,64,55,0.1)', backgroundColor: 'white' }}>
              <img src={currentQ.image} alt={currentQ.word} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          </div>

          {/* Question card */}
          <div style={{ ...cardStyle, padding: '16px 18px' }}>
            {/* 题型标签 */}
            <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 8, backgroundColor: 'rgba(255,184,64,0.15)', color: '#A06800', fontSize: 11, fontWeight: 800, marginBottom: 10 }}>
              {currentQ.type === 'multiple_choice' && '看图选词'}
              {currentQ.type === 'fill_blank' && '填空题'}
              {currentQ.type === 'letter_match' && '字母消消乐'}
              {currentQ.type === 'word_spelling' && '单词拼写'}
              {currentQ.type === 'picture_matching' && '图片配对'}
            </div>

            {/* 含义/提示 */}
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>
              {currentQ.type === 'picture_matching' ? `选择 "${currentQ.word}" 的中文意思` : currentQ.meaning}
            </div>

            {currentQ.pos && (
              <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.5)', marginBottom: 10 }}>{currentQ.pos}</div>
            )}

            {/* 例句 */}
            {currentQ.sentence && (
              <div style={{ fontSize: 13, color: 'rgba(93,64,55,0.6)', lineHeight: 1.6, padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(93,64,55,0.04)', marginBottom: 12 }}>
                <div>{currentQ.sentence}</div>
                <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.4)', marginTop: 4 }}>{currentQ.sentenceZh}</div>
              </div>
            )}

            {/* 选择题 options */}
            {isChoiceType && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentQ.options.map((opt, i) => {
                  let bg = 'white'
                  let borderColor = 'rgba(93,64,55,0.12)'
                  let shadow = '0 2px 0 0 rgba(93,64,55,0.1)'

                  if (isCorrect !== null) {
                    if (opt === currentQ.correctAnswer) {
                      bg = 'rgba(102,187,106,0.15)'
                      borderColor = '#66BB6A'
                    } else if (opt === selectedAnswer && !isCorrect) {
                      bg = 'rgba(239,83,80,0.15)'
                      borderColor = '#EF5350'
                    }
                  }

                  return (
                    <button
                      key={`${opt}-${i}`}
                      onClick={() => handleSelectAnswer(opt)}
                      disabled={isCorrect !== null}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: `2px solid ${borderColor}`,
                        backgroundColor: bg,
                        boxShadow: shadow,
                        cursor: isCorrect !== null ? 'default' : 'pointer',
                        textAlign: 'left',
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#5D4037',
                        fontFamily: 'inherit',
                        opacity: isCorrect !== null && opt !== currentQ.correctAnswer && opt !== selectedAnswer ? 0.4 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}

            {/* 字母题 */}
            {isLetterType && (
              <div>
                {/* 已填字母槽 */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                  {letterSlots.map((letter, i) => (
                    <div
                      key={i}
                      style={{
                        width: 36,
                        height: 42,
                        borderRadius: 8,
                        border: `2px solid ${isCorrect === true ? '#66BB6A' : isCorrect === false ? '#EF5350' : letter ? '#FFB840' : 'rgba(93,64,55,0.15)'}`,
                        backgroundColor: isCorrect === true ? 'rgba(102,187,106,0.1)' : isCorrect === false ? 'rgba(239,83,80,0.1)' : letter ? 'rgba(255,184,64,0.1)' : 'rgba(93,64,55,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#5D4037',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {letter || ''}
                    </div>
                  ))}
                </div>

                {/* 可选字母 */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {availableLetters.map((item, i) => (
                    <button
                      key={`${item.letter}-${item.idx}-${i}`}
                      onClick={() => !item.used && handleLetterClick(i)}
                      disabled={item.used || isCorrect !== null}
                      style={{
                        width: 40,
                        height: 44,
                        borderRadius: 10,
                        border: '2px solid rgba(93,64,55,0.12)',
                        backgroundColor: item.used ? 'rgba(93,64,55,0.06)' : 'white',
                        boxShadow: item.used ? 'none' : '0 3px 0 0 rgba(93,64,55,0.1)',
                        cursor: item.used || isCorrect !== null ? 'default' : 'pointer',
                        fontSize: 17,
                        fontWeight: 800,
                        color: item.used ? 'rgba(93,64,55,0.2)' : '#5D4037',
                        fontFamily: 'inherit',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      {item.letter}
                    </button>
                  ))}
                </div>

                {/* 撤销按钮 */}
                {!isCorrect && letterSlots.some((s) => s !== null) && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button
                      onClick={handleUndoLetter}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 8,
                        border: '1.5px solid rgba(93,64,55,0.15)',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'rgba(93,64,55,0.5)',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Icon icon="lucide:undo-2" style={{ width: 12, height: 12, marginRight: 4, verticalAlign: -1 }} />
                      撤销
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部反馈条 */}
        {isCorrect !== null && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
              backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
              borderTop: `3px solid ${isCorrect ? '#66BB6A' : '#EF5350'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 100,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: isCorrect ? '#2E7D32' : '#C62828', marginBottom: 2 }}>
                {isCorrect ? '✅ 答对了！' : '❌ 再想想'}
              </div>
              {!isCorrect && (
                <div style={{ fontSize: 13, color: '#C62828' }}>
                  正确答案：<strong>{currentQ.correctAnswer}</strong>
                </div>
              )}
            </div>
            <button
              onClick={nextQuestion}
              style={{
                padding: '10px 24px',
                borderRadius: 12,
                border: 'none',
                backgroundColor: isCorrect ? '#66BB6A' : '#EF5350',
                boxShadow: `0 3px 0 0 ${isCorrect ? '#388E3C' : '#B71C1C'}`,
                color: 'white',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {currentIdx + 1 >= questions.length ? '查看结果' : '下一题'}
              <Icon icon="lucide:arrow-right" style={{ width: 14, height: 14, marginLeft: 6, verticalAlign: -2 }} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── 结果界面 ──
  const renderResult = () => {
    const rate = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
    const emoji = rate >= 80 ? '🎉' : rate >= 60 ? '💪' : '📚'
    const message = rate >= 80 ? '太棒了！进步很大！' : rate >= 60 ? '继续加油！快要掌握了' : '别灰心，多练几次就好！'

    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFF8E7', fontFamily: "'Nunito', 'PingFang SC', sans-serif", color: '#5D4037' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>{emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>复习完成！</div>
          <div style={{ fontSize: 14, color: 'rgba(93,64,55,0.55)' }}>{message}</div>

          {/* 成绩卡 */}
          <div style={{ ...cardStyle, width: '100%', maxWidth: 280, textAlign: 'center', padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#FFB840', lineHeight: 1 }}>{sessionCorrect}/{sessionTotal}</div>
                <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.5)', marginTop: 4 }}>答对</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: rateColor(rate), lineHeight: 1 }}>{rate}%</div>
                <div style={{ fontSize: 12, color: 'rgba(93,64,55,0.5)', marginTop: 4 }}>正确率</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={() => setPhase('browse')}
              style={{ padding: '12px 24px', borderRadius: 12, border: '2px solid rgba(93,64,55,0.12)', backgroundColor: 'white', boxShadow: '0 3px 0 0 rgba(93,64,55,0.1)', color: '#5D4037', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              返回
            </button>
            <button
              onClick={() => startReview(weakWords)}
              style={{ padding: '12px 24px', borderRadius: 12, border: 'none', backgroundColor: '#FFB840', boxShadow: '0 3px 0 0 #A06800', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              再来一轮
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 答题/结果模式 ──
  if (phase === 'quiz') return renderQuiz()
  if (phase === 'result') return renderResult()

  // ── 浏览模式（默认） ──
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFF8E7', fontFamily: "'Nunito', 'PingFang SC', sans-serif", color: '#5D4037' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,248,231,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(93,64,55,0.08)' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, border: '2px solid rgba(93,64,55,0.12)', backgroundColor: 'white', boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)', cursor: 'pointer', color: '#5D4037', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          <Icon icon="lucide:arrow-left" style={{ width: 16, height: 16 }} />
          返回
        </button>
        <div style={{ fontWeight: 900, fontSize: 18 }}>复习中心</div>
        <div style={{ width: 68 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 120 }}>

        {/* 摘要卡 */}
        <div style={{ ...cardStyle, background: weakWords.length > 0 ? 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)' : 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', border: `2px solid ${weakWords.length > 0 ? 'rgba(239,83,80,0.15)' : 'rgba(102,187,106,0.2)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {weakWords.length > 0 ? '📝' : '🏆'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 4 }}>
                {weakWords.length > 0 ? '待复习单词' : '全部掌握！'}
              </div>
              {weakWords.length > 0 ? (
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 13, color: 'rgba(93,64,55,0.6)' }}>
                    <span style={{ fontWeight: 900, fontSize: 20, color: '#EF5350' }}>{weakWords.length}</span>
                    <span style={{ marginLeft: 4 }}>个</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(93,64,55,0.6)' }}>
                    平均正确率
                    <span style={{ fontWeight: 900, fontSize: 16, color: rateColor(totalAvgRate), marginLeft: 4 }}>{totalAvgRate}%</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'rgba(93,64,55,0.55)' }}>
                  {Object.keys(gameState.wordHistory).length === 0 ? '还没有学习记录，快去冒险吧！' : '所有学过的单词正确率都 ≥ 70% ✨'}
                </div>
              )}
            </div>
          </div>

          {/* 开始复习主按钮 */}
          {weakWords.length > 0 && (
            <button
              onClick={() => startReview(weakWords)}
              style={{
                width: '100%',
                marginTop: 14,
                padding: '14px 0',
                borderRadius: 14,
                border: 'none',
                backgroundColor: '#EF5350',
                boxShadow: '0 4px 0 0 #B71C1C',
                color: 'white',
                fontSize: 16,
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'transform 80ms ease, box-shadow 80ms ease',
              }}
              onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(3px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 0 0 #B71C1C' }}
              onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 #B71C1C' }}
              onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 #B71C1C' }}
            >
              <Icon icon="lucide:swords" style={{ width: 18, height: 18 }} />
              开始复习（全部 {weakWords.length} 词）
            </button>
          )}

          {/* 无弱词时的冒险按钮 */}
          {weakWords.length === 0 && Object.keys(gameState.wordHistory).length === 0 && (
            <button
              onClick={() => navigate(`/chapter/${gameState.currentChapter}/level/${gameState.currentLevel}`)}
              style={{
                width: '100%',
                marginTop: 14,
                padding: '14px 0',
                borderRadius: 14,
                border: 'none',
                backgroundColor: '#FFB840',
                boxShadow: '0 4px 0 0 #A06800',
                color: 'white',
                fontSize: 16,
                fontWeight: 900,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Icon icon="lucide:play" style={{ width: 18, height: 18 }} />
              去冒险
            </button>
          )}
        </div>

        {/* 按章节分组的弱词列表 */}
        {chapterGroups.map((group) => (
          <div key={group.chapterId} style={cardStyle}>
            {/* 章节头 */}
            <button
              onClick={() => toggleChapter(group.chapterId)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: '#5D4037',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{group.name.emoji}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{group.name.zh}</div>
                  <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.45)' }}>{group.name.en}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: rateColor(group.avgRate), backgroundColor: rateBg(group.avgRate), padding: '2px 10px', borderRadius: 12 }}>
                  {group.words.length} 词
                </span>
                <Icon icon={expandedChapters.has(group.chapterId) ? 'lucide:chevron-up' : 'lucide:chevron-down'} style={{ width: 16, height: 16, color: 'rgba(93,64,55,0.3)' }} />
              </div>
            </button>

            {/* 展开内容 */}
            {expandedChapters.has(group.chapterId) && (
              <div style={{ marginTop: 12 }}>
                {/* 章节复习按钮 */}
                <button
                  onClick={() => startReview(group.words)}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 10,
                    border: '2px dashed rgba(239,83,80,0.25)',
                    backgroundColor: 'rgba(239,83,80,0.04)',
                    color: '#EF5350',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <Icon icon="lucide:repeat" style={{ width: 14, height: 14 }} />
                  复习本章 {group.words.length} 词
                </button>

                {/* 单词列表 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.words.map((w) => (
                    <div
                      key={w.word}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 10,
                        backgroundColor: 'rgba(93,64,55,0.03)',
                        border: '1.5px solid rgba(93,64,55,0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          onClick={() => speakWord(w.word, gameState.settings.soundEnabled)}
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', backgroundColor: 'rgba(93,64,55,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon icon="lucide:volume-2" style={{ width: 14, height: 14, color: 'rgba(93,64,55,0.4)' }} />
                        </button>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{w.word}</div>
                          <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.5)' }}>
                            <span style={{ marginRight: 6 }}>{w.pos}</span>{w.meaning}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: rateColor(w.rate), backgroundColor: rateBg(w.rate), padding: '2px 8px', borderRadius: 12 }}>
                          {w.rate}%
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(93,64,55,0.35)' }}>
                          {w.total}次
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 空状态提示 */}
        {weakWords.length === 0 && Object.keys(gameState.wordHistory).length > 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🌟</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>太厉害了！</div>
            <div style={{ fontSize: 13, color: 'rgba(93,64,55,0.5)', lineHeight: 1.6 }}>
              你学过的所有单词正确率都达到了 70% 以上<br />
              继续冒险，解锁更多单词吧！
            </div>
          </div>
        )}
      </div>

      <MainTabBar />
    </div>
  )
}

export default Practice
