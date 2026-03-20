/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 单词图鉴画廊，按章节/房间分类展示用户已学过的单词卡片，含正确率、词性、释义。
 * Style referenceFiles:
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
import { MainTabBar } from '@/components/function/MainTabBar'
import { useGameStore } from '@/store/GameContext'
import { chapterWordsMap } from '@/data/words'
import type { WordConfig } from '@/data/words'
import { CHAPTERS } from '@/data/chapters'
import { rateColor, rateBgColor as rateBg } from '@/lib/utils/colors'
import { CARD_STYLE } from '@/lib/utils/styles'

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

// ─── 样式（使用公共 CARD_STYLE） ────────────────────────────────────────

const cardStyle: React.CSSProperties = { ...CARD_STYLE }

// ─── 单词卡片 ──────────────────────────────────────────────────────────────

function WordCard({ w }: { w: LearnedWord }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        backgroundColor: 'rgba(93,64,55,0.03)',
        border: '1.5px solid rgba(93,64,55,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* 左侧：单词 + 释义 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#5D4037' }}>{w.word}</span>
          <span style={{ fontSize: 11, color: 'rgba(93,64,55,0.4)', fontWeight: 600 }}>{w.pos}</span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(93,64,55,0.55)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {w.meaning}
        </div>
      </div>

      {/* 右侧：正确率 */}
      <div
        style={{
          flexShrink: 0,
          padding: '4px 10px',
          borderRadius: 20,
          backgroundColor: rateBg(w.rate),
          fontSize: 13,
          fontWeight: 800,
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
    <div style={cardStyle}>
      {/* 章节标题行 */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: '#5D4037',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: meta.themeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            {meta.emoji}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{meta.nameCn}</div>
            <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.45)', marginTop: 1 }}>
              {meta.nameEn}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(93,64,55,0.5)' }}>
            {words.length}/{totalInChapter}
          </span>
          <Icon
            icon={expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            style={{ width: 18, height: 18, color: 'rgba(93,64,55,0.3)' }}
          />
        </div>
      </button>

      {/* 展开的单词列表 */}
      {expanded && (
        <div
          style={{
            borderTop: '1px solid rgba(93,64,55,0.06)',
            padding: '12px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {words.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '16px 0',
                fontSize: 13,
                color: 'rgba(93,64,55,0.4)',
              }}
            >
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
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFF8E7',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        color: '#5D4037',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          background: 'rgba(255,248,231,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(93,64,55,0.08)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 10,
            border: '2px solid rgba(93,64,55,0.12)',
            backgroundColor: 'white',
            boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
            cursor: 'pointer',
            color: '#5D4037',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          <Icon icon="lucide:arrow-left" style={{ width: 16, height: 16 }} />
          返回
        </button>

        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>单词图鉴</div>

        <div style={{ width: 68 }} />
      </div>

      {/* 可滚动内容区 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingBottom: 120,
        }}
      >
        {/* 收集进度概览 */}
        <div style={{ ...cardStyle, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 15 }}>📖 收集进度</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFB840' }}>
              {totalLearned} / {totalWords} 个
            </div>
          </div>
          <div
            style={{
              width: '100%',
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(93,64,55,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: 5,
                backgroundColor: totalLearned === totalWords ? '#66BB6A' : '#FFB840',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(93,64,55,0.4)', marginTop: 6, textAlign: 'right' }}>
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
          <div
            style={{
              textAlign: 'center',
              padding: '32px 20px',
              color: 'rgba(93,64,55,0.45)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>还没有收集到任何单词</div>
            <div style={{ fontSize: 13 }}>快去冒险学习新单词吧！</div>
          </div>
        )}
      </div>

      <MainTabBar />
    </div>
  )
}

export default Collection
