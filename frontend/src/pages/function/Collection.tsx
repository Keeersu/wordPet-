/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 单词图鉴画廊，按章节/房间分类展示用户已学过的单词卡片，含正确率、词性、释义。
 * Style referenceFiles: styles/collection.css, styles/components.css
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 按 5 个章节分组展示已学单词
 * - 每个章节可折叠/展开
 * - 单词卡片显示：单词、词性、释义、正确率色标
 * - 顶部统计：已学/总数 + 收集进度条
 * - 空状态引导
 *
 * ## Page Layout
 * 顶部 Header + 统计概览 + 章节折叠列表 + MainTabBar
 * </page-design>
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useGameStore } from '@/store/GameContext'
import { chapterWordsMap } from '@/data/words'
import type { WordConfig } from '@/data/words'
import { CHAPTERS } from '@/data/chapters'
import { rateColor, rateBgColor as rateBg } from '@/lib/utils/colors'

/** 使用公共章节元数据 */
const chapterMeta = CHAPTERS

interface LearnedWord {
  word: string
  meaning: string
  pos: string
  correct: number
  wrong: number
  rate: number
}

// ─── 单词卡片 ──────────────────────────────────────────────────────────────

function WordCard({ w }: { w: LearnedWord }) {
  return (
    <div className="collection-word">
      {/* 左侧：单词 + 释义 */}
      <div className="collection-word__text">
        <div className="collection-word__name-row">
          <span className="collection-word__name">{w.word}</span>
          <span className="collection-word__pos">{w.pos}</span>
        </div>
        <div className="collection-word__meaning">
          {w.meaning}
        </div>
      </div>

      {/* 右侧：正确率 */}
      <div
        className="collection-word__rate"
        style={{
          backgroundColor: rateBg(w.rate),
          color: rateColor(w.rate),
        }}
      >
        {w.rate}%
      </div>
    </div>
  )
}

// ─── 章节区块 ──────────────────────────────────────────────────────────────

function ChapterSection({
  meta,
  words,
  defaultExpanded,
}: {
  meta: (typeof CHAPTERS)[number]
  words: LearnedWord[]
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const totalInChapter = (chapterWordsMap[meta.id] ?? []).length

  return (
    <div className="card collection-chapter">
      {/* 章节标题行 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="collection-chapter__header"
      >
        <div className="collection-chapter__left">
          <div
            className="collection-chapter__icon"
            style={{ backgroundColor: meta.themeColor }}
          >
            {meta.emoji}
          </div>
          <div className="collection-chapter__name">
            <div className="collection-chapter__name-cn">{meta.nameCn}</div>
            <div className="collection-chapter__name-en">
              {meta.nameEn}
            </div>
          </div>
        </div>

        <div className="collection-chapter__right">
          <span className="collection-chapter__count">
            {words.length}/{totalInChapter}
          </span>
          <Icon
            icon={expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            className="collection-chapter__expand-icon"
          />
        </div>
      </button>

      {/* 展开的单词列表 */}
      {expanded && (
        <div className="collection-chapter__body">
          {words.length === 0 ? (
            <div className="collection-chapter__empty">
              还没有学习这个章节的单词哦 ~
            </div>
          ) : (
            words.map((w) => <WordCard key={w.word} w={w} />)
          )}
        </div>
      )}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

function Collection() {
  const navigate = useNavigate()
  const { gameState } = useGameStore()

  // 构建按章节分组的已学单词
  const { chapterGroups, totalLearned, totalWords } = useMemo(() => {
    const history = gameState.wordHistory
    let learned = 0
    let total = 0

    const groups = chapterMeta.map((meta) => {
      const chapterWords: WordConfig[] = chapterWordsMap[meta.id] ?? []
      total += chapterWords.length

      const learnedWords: LearnedWord[] = []
      for (const wc of chapterWords) {
        const record = history[wc.word]
        if (record) {
          const sum = record.correct + record.wrong
          learnedWords.push({
            word: wc.word,
            meaning: wc.meaning,
            pos: wc.pos,
            correct: record.correct,
            wrong: record.wrong,
            rate: sum > 0 ? Math.round((record.correct / sum) * 100) : 0,
          })
          learned++
        }
      }

      // 按正确率从低到高排序（让薄弱单词在前面，方便复习）
      learnedWords.sort((a, b) => a.rate - b.rate)

      return { meta, words: learnedWords }
    })

    return { chapterGroups: groups, totalLearned: learned, totalWords: total }
  }, [gameState.wordHistory])

  const progressPct = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0

  return (
    <div className="collection-page">
      {/* Header */}
      <div className="page-header page-header--padded">
        <button
          onClick={() => navigate(-1)}
          className="back-btn"
        >
          <Icon icon="lucide:arrow-left" style={{ width: 16, height: 16 }} />
          返回
        </button>

        <div className="page-header__title">单词图鉴</div>

        <div className="page-header__spacer" />
      </div>

      {/* 可滚动内容区 */}
      <div className="collection-content">
        {/* 收集进度概览 */}
        <div className="card card--padded collection-progress">
          <div className="collection-progress__header">
            <div className="collection-progress__title">📖 收集进度</div>
            <div className="collection-progress__count">
              {totalLearned} / {totalWords} 个
            </div>
          </div>
          <div className="collection-progress__bar">
            <div
              className={`collection-progress__fill ${totalLearned === totalWords ? 'collection-progress__fill--complete' : 'collection-progress__fill--partial'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="collection-progress__percent">
            {progressPct}% 已收集
          </div>
        </div>

        {/* 按章节展示 */}
        {chapterGroups.map((group, idx) => (
          <ChapterSection
            key={group.meta.id}
            meta={group.meta}
            words={group.words}
            defaultExpanded={idx === 0 && group.words.length > 0}
          />
        ))}

        {/* 全空状态 */}
        {totalLearned === 0 && (
          <div className="collection-empty">
            <div className="collection-empty__emoji">📚</div>
            <div className="collection-empty__title">还没有收集到任何单词</div>
            <div className="collection-empty__text">快去冒险学习新单词吧！</div>
          </div>
        )}
      </div>

    </div>
  )
}

export default Collection
