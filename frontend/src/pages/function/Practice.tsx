/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 错题 / 弱词复习中心 — 汇总所有正确率低于 70% 的单词，支持一键全局复习或按章节复习，直接在页面内完成答题练习。
 * Style referenceFiles: styles/practice.css, styles/components.css
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
import { generateReviewQuestions, type ReviewWordInput } from '@/data/questionGenerator'
import type { GeneratedQuestion } from '@/data/questionGenerator'
import { speakWord as _speakWord } from '@/lib/utils/tts'
import { rateColor, rateBgColor as rateBg } from '@/lib/utils/colors'
import { CHAPTERS, CHAPTER_MAP } from '@/data/chapters'

// ─── 工具函数（shuffle 仅用于 startReview 的 weakWords 乱序） ────────
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
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
  name: { emoji: string; en: string; zh: string }
  words: WeakWord[]
  avgRate: number
}

// ─── 复习题目生成：使用集中式 questionGenerator.generateReviewQuestions ──

// ─── TTS：使用公共 speakWord ────────────────────────────────────────
function speakWord(word: string, enabled: boolean) {
  _speakWord(word, { enabled })
}

// ─── 主页面 ────────────────────────────────────────────────────────

function Practice() {
  const navigate = useNavigate()
  const { gameState, updateGameState } = useGameStore()

  // 记录单词答题结果（替代原 dispatch RECORD_WORD）
  const recordWordResult = useCallback((word: string, correct: boolean) => {
    updateGameState((prev) => {
      const existing = prev.wordHistory[word] ?? { correct: 0, wrong: 0, lastSeen: '' }
      return {
        ...prev,
        wordHistory: {
          ...prev.wordHistory,
          [word]: {
            ...existing,
            correct: existing.correct + (correct ? 1 : 0),
            wrong: existing.wrong + (correct ? 0 : 1),
            lastSeen: new Date().toISOString(),
          },
        },
      }
    })
  }, [updateGameState])

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
      const chMeta = CHAPTER_MAP[cid]
      groups.push({
        chapterId: cid,
        name: chMeta
          ? { emoji: chMeta.emoji, en: chMeta.nameEn, zh: chMeta.nameCn }
          : { emoji: '\u{1F4D6}', en: `Chapter ${cid}`, zh: `\u7B2C${cid}\u7AE0` },
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

  // 开始复习（使用集中式 generateReviewQuestions）
  const startReview = useCallback((wordsToReview: WeakWord[]) => {
    const reviewInputs: ReviewWordInput[] = shuffle(wordsToReview).map((w) => ({
      word: w.word,
      meaning: w.meaning,
      pos: w.pos,
      rate: w.rate,
      total: w.total,
      chapterId: w.chapterId,
      config: w.config,
    }))
    const qs = generateReviewQuestions(
      reviewInputs,
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
    recordWordResult(currentQ.word, correct)

    speakWord(currentQ.word, gameState.settings.ttsEnabled)
  }, [isCorrect, currentQ, recordWordResult, gameState.settings.ttsEnabled])

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
          recordWordResult(currentQ.word, correct)
          speakWord(currentQ.word, gameState.settings.ttsEnabled)
        }, 200)
      }

      return next
    })
  }, [isCorrect, currentQ, availableLetters, recordWordResult, gameState.settings.ttsEnabled])

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
      <div className="practice-page">
        {/* Quiz Header */}
        <div className="practice-quiz-header">
          <button onClick={() => setPhase('browse')} className="practice-quiz-header__back back-btn">
            <Icon icon="lucide:x" width={16} height={16} />
            退出
          </button>
          <div className="practice-quiz-header__count">
            第 {currentIdx + 1} 题 · 共 {questions.length} 题
          </div>
          <div className="page-header__spacer" />
        </div>

        {/* Progress bar */}
        <div className="progress-bar progress-bar--sm" style={{ margin: '0 16px' }}>
          <div
            className="progress-bar__fill progress-bar__fill--primary"
            style={{ width: `${((currentIdx + (isCorrect !== null ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question content */}
        <div className="practice-quiz-body">
          {/* Word image */}
          <div className="practice-quiz-prompt">
            <div className="practice-quiz-image__frame">
              <img
                src={currentQ.image}
                alt={currentQ.word}
                className="practice-quiz-image__img"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          </div>

          {/* Question card */}
          <div className="card card--padded">
            {/* 题型标签 */}
            <div className="practice-quiz-tag">
              {currentQ.type === 'multiple_choice' && '看图选词'}
              {currentQ.type === 'fill_blank' && '填空题'}
              {currentQ.type === 'letter_match' && '字母消消乐'}
              {currentQ.type === 'word_spelling' && '单词拼写'}
              {currentQ.type === 'picture_matching' && '图片配对'}
            </div>

            {/* 含义/提示 */}
            <div className="practice-quiz-prompt__word">
              {currentQ.type === 'picture_matching' ? `选择 "${currentQ.word}" 的中文意思` : currentQ.meaning}
            </div>

            {currentQ.pos && (
              <div className="practice-quiz-prompt__phonetic">{currentQ.pos}</div>
            )}

            {/* 例句 */}
            {currentQ.sentence && (
              <div className="practice-quiz-sentence">
                <div className="practice-quiz-sentence__en">{currentQ.sentence}</div>
                <div className="practice-quiz-sentence__zh">{currentQ.sentenceZh}</div>
              </div>
            )}

            {/* 选择题 options */}
            {isChoiceType && (
              <div className="practice-quiz-options">
                {currentQ.options.map((opt, i) => {
                  let bg = 'white'
                  let borderColor = 'rgba(93,64,55,0.12)'

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
                      className="practice-quiz-option"
                      style={{
                        border: `2px solid ${borderColor}`,
                        backgroundColor: bg,
                        opacity: isCorrect !== null && opt !== currentQ.correctAnswer && opt !== selectedAnswer ? 0.4 : 1,
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
                <div className="practice-quiz-letter-slots">
                  {letterSlots.map((letter, i) => (
                    <div
                      key={i}
                      className="practice-quiz-letter-slot"
                      style={{
                        borderColor: isCorrect === true ? '#66BB6A' : isCorrect === false ? '#EF5350' : letter ? '#FFB840' : 'rgba(93,64,55,0.15)',
                        backgroundColor: isCorrect === true ? 'rgba(102,187,106,0.1)' : isCorrect === false ? 'rgba(239,83,80,0.1)' : letter ? 'rgba(255,184,64,0.1)' : 'rgba(93,64,55,0.03)',
                      }}
                    >
                      {letter || ''}
                    </div>
                  ))}
                </div>

                {/* 可选字母 */}
                <div className="practice-quiz-letter-pool">
                  {availableLetters.map((item, i) => (
                    <button
                      key={`${item.letter}-${item.idx}-${i}`}
                      onClick={() => !item.used && handleLetterClick(i)}
                      disabled={item.used || isCorrect !== null}
                      className={`practice-quiz-letter-btn ${item.used ? 'practice-quiz-letter-btn--used' : ''}`}
                      style={{
                        backgroundColor: item.used ? 'rgba(93,64,55,0.06)' : 'white',
                        color: item.used ? 'rgba(93,64,55,0.2)' : '#5D4037',
                        boxShadow: item.used ? 'none' : '0 3px 0 0 rgba(93,64,55,0.1)',
                        cursor: item.used || isCorrect !== null ? 'default' : 'pointer',
                      }}
                    >
                      {item.letter}
                    </button>
                  ))}
                </div>

                {/* 撤销按钮 */}
                {!isCorrect && letterSlots.some((s) => s !== null) && (
                  <div className="practice-quiz-undo">
                    <button
                      onClick={handleUndoLetter}
                      className="practice-quiz-undo-btn"
                    >
                      <Icon icon="lucide:undo-2" width={12} height={12} style={{ marginRight: 4, verticalAlign: -1 }} />
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
            className={`practice-quiz-feedback ${isCorrect ? 'practice-quiz-feedback--correct' : 'practice-quiz-feedback--wrong'}`}
          >
            <div className="practice-quiz-feedback__header">
              <div className={`practice-quiz-feedback__icon ${isCorrect ? 'practice-quiz-feedback__icon--correct' : 'practice-quiz-feedback__icon--wrong'}`}>
                <Icon icon={isCorrect ? 'lucide:check' : 'lucide:x'} width={18} height={18} />
              </div>
              <div className={`practice-quiz-feedback__title ${isCorrect ? 'practice-quiz-feedback__title--correct' : 'practice-quiz-feedback__title--wrong'}`}>
                {isCorrect ? '答对了！' : '再想想'}
              </div>
            </div>
            {!isCorrect && (
              <div className="practice-quiz-feedback__detail">
                正确答案：<strong>{currentQ.correctAnswer}</strong>
              </div>
            )}
            <button
              onClick={nextQuestion}
              className={`practice-quiz-feedback__btn ${isCorrect ? 'practice-quiz-feedback__btn--correct' : 'practice-quiz-feedback__btn--wrong'}`}
            >
              {currentIdx + 1 >= questions.length ? '查看结果' : '下一题'}
              <Icon icon="lucide:arrow-right" width={14} height={14} style={{ marginLeft: 6, verticalAlign: -2 }} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── 结果界面 ──
  const renderResult = () => {
    const rate = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
    const emoji = rate >= 80 ? '\u{1F389}' : rate >= 60 ? '\u{1F4AA}' : '\u{1F4DA}'
    const message = rate >= 80 ? '太棒了！进步很大！' : rate >= 60 ? '继续加油！快要掌握了' : '别灰心，多练几次就好！'

    return (
      <div className="practice-page">
        <div className="practice-result">
          <div className="practice-result__emoji">{emoji}</div>
          <div className="practice-result__title">复习完成！</div>
          <div className="practice-result__subtitle">{message}</div>

          {/* 成绩卡 */}
          <div className="card card--padded practice-result__score-card">
            <div className="practice-result__score-grid">
              <div className="practice-result__score-item">
                <div className="practice-result__score-value" style={{ color: '#FFB840' }}>{sessionCorrect}/{sessionTotal}</div>
                <div className="practice-result__score-label">答对</div>
              </div>
              <div className="practice-result__score-item">
                <div className="practice-result__score-value" style={{ color: rateColor(rate) }}>{rate}%</div>
                <div className="practice-result__score-label">正确率</div>
              </div>
            </div>
          </div>

          <div className="practice-result__actions">
            <button
              onClick={() => setPhase('browse')}
              className="practice-result__btn practice-result__btn--return"
            >
              返回
            </button>
            <button
              onClick={() => startReview(weakWords)}
              className="practice-result__btn practice-result__btn--retry"
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
    <div className="practice-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <Icon icon="lucide:arrow-left" width={16} height={16} />
          返回
        </button>
        <div className="page-header__title">复习中心</div>
        <div className="page-header__spacer" />
      </div>

      {/* Content */}
      <div className="practice-browse-scroll">

        {/* 摘要卡 */}
        <div className={`practice-summary ${weakWords.length > 0 ? 'practice-summary--has-weak' : 'practice-summary--all-good'}`}>
          <div className="practice-summary__icon">
            {weakWords.length > 0 ? '\u{1F4DD}' : '\u{1F3C6}'}
          </div>
          <div className="practice-summary__count">
            {weakWords.length > 0 ? weakWords.length : '\u2728'}
          </div>
          <div className="practice-summary__label">
            {weakWords.length > 0 ? '待复习单词' : '全部掌握！'}
          </div>
          {weakWords.length > 0 ? (
            <div className="practice-summary__rate">
              平均正确率
              <span style={{ color: rateColor(totalAvgRate), fontWeight: 900 }}>{totalAvgRate}%</span>
            </div>
          ) : (
            <div className="practice-summary__label">
              {Object.keys(gameState.wordHistory).length === 0 ? '\u8FD8\u6CA1\u6709\u5B66\u4E60\u8BB0\u5F55\uFF0C\u5FEB\u53BB\u5192\u9669\u5427\uFF01' : '\u6240\u6709\u5B66\u8FC7\u7684\u5355\u8BCD\u6B63\u786E\u7387\u90FD \u2265 70% \u2728'}
            </div>
          )}

          {/* 开始复习主按钮 */}
          {weakWords.length > 0 && (
            <button
              onClick={() => startReview(weakWords)}
              className="practice-start-btn btn-danger"
            >
              <Icon icon="lucide:swords" width={18} height={18} style={{ marginRight: 8, verticalAlign: -3 }} />
              开始复习（全部 {weakWords.length} 词）
            </button>
          )}

          {/* 无弱词时的冒险按钮 */}
          {weakWords.length === 0 && Object.keys(gameState.wordHistory).length === 0 && (
            <button
              onClick={() => navigate(`/chapter/${gameState.currentChapter}/level/${gameState.currentLevel}`)}
              className="practice-adventure-btn btn-primary"
            >
              <Icon icon="lucide:play" width={18} height={18} style={{ marginRight: 8, verticalAlign: -3 }} />
              去冒险
            </button>
          )}
        </div>

        {/* 按章节分组的弱词列表 */}
        {chapterGroups.map((group) => (
          <div key={group.chapterId} className="practice-chapter">
            {/* 章节头 */}
            <button
              onClick={() => toggleChapter(group.chapterId)}
              className="practice-chapter__header"
            >
              <div className="practice-chapter__title">
                <span>{group.name.emoji}</span>{' '}
                {group.name.zh}
              </div>
              <div className="practice-chapter__info">
                <span className="practice-word-item__rate" style={{ color: rateColor(group.avgRate), backgroundColor: rateBg(group.avgRate) }}>
                  {group.words.length} 词
                </span>
                <div className={`practice-chapter__arrow ${expandedChapters.has(group.chapterId) ? 'practice-chapter__arrow--open' : ''}`}>
                  <Icon icon="lucide:chevron-down" width={16} height={16} />
                </div>
              </div>
            </button>

            {/* 展开内容 */}
            {expandedChapters.has(group.chapterId) && (
              <div className="practice-chapter__list">
                {/* 章节复习按钮 */}
                <button
                  onClick={() => startReview(group.words)}
                  className="practice-chapter__review-btn"
                >
                  <Icon icon="lucide:repeat" width={14} height={14} style={{ marginRight: 6, verticalAlign: -2 }} />
                  复习本章 {group.words.length} 词
                </button>

                {/* 单词列表 */}
                {group.words.map((w) => (
                  <div key={w.word} className="practice-word-item">
                    <button
                      onClick={() => speakWord(w.word, gameState.settings.ttsEnabled)}
                      className="practice-word-item__speak"
                    >
                      <Icon icon="lucide:volume-2" width={14} height={14} />
                    </button>
                    <div className="practice-word-item__content">
                      <div className="practice-word-item__word">
                        {w.word}
                        <span className="practice-word-item__pos">{w.pos}</span>
                      </div>
                      <div className="practice-word-item__meaning">{w.meaning}</div>
                    </div>
                    <div className="practice-word-item__info">
                      <span className="practice-word-item__rate" style={{ color: rateColor(w.rate), backgroundColor: rateBg(w.rate) }}>
                        {w.rate}%
                      </span>
                      <span className="practice-word-item__count">
                        {w.total}次
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 空状态提示 */}
        {weakWords.length === 0 && Object.keys(gameState.wordHistory).length > 0 && (
          <div className="card card--padded practice-empty">
            <div className="practice-empty__icon">{'\u{1F31F}'}</div>
            <div className="practice-empty__text">太厉害了！</div>
            <div className="practice-empty__text">
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
