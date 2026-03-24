/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 猫咪创建页面，支持经典形象选择和 AI 创作两种模式。
 * Style referenceFiles: styles/onboarding.css, styles/components.css
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 选择创建模式（经典 / AI 创作）
 * - 经典模式：选择外观、性格，输入名字
 * - AI 模式：选择毛色、配饰、性格标签，AI 生成猫咪形象
 * - 为猫咪起名字后进入主页
 *
 * ## Basic Layout
 * Full-screen form: warm background + centered content + bottom nav
 *
 * ## Page Layout
 * 模式选择 → 经典/AI 表单 → 底部导航按钮
 * </page-design>
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/GameContext'
import type { CatGenerationTags, CatPersonality, GeneratedAppearance } from '@/store/gameStore'
import {
  FUR_COLOR_OPTIONS,
  ACCESSORY_OPTIONS,
  randomizeTags,
  type TagOption,
} from '@/lib/catPrompt'
import {
  generateCatImage,
  getDailyGenerationCount,
  incrementDailyCount,
  MAX_DAILY_GENERATIONS,
} from '@/lib/catGeneration'
import { AudioToggles } from '@/components/function/AudioToggles'

type Appearance = 1 | 2 | 3 | 4
type Personality = 'homebody' | 'lively' | 'mysterious' | 'sleepy'
type Mode = 'classic' | 'ai'
type AiStep = 'config' | 'generate'

const LOADING_TIPS = [
  '开盲盒前的每分每秒都让人兴奋呐～',
  'AI 正在挑选最适合你的毛色…',
  '你的猫主子正在化妆间准备登场…',
  '据说等待的人运气会更好哦 🍀',
  '马上就好，它正在整理自己的小围巾～',
  '猫猫正在镜子前端详自己的新造型…',
  '再等一下下，好东西值得等待！',
  '你的猫咪正从次元壁那头赶来…',
  '它可能在纠结今天戴哪顶帽子…',
  '倒计时开始，准备迎接你的新伙伴！',
]

const APPEARANCE_OPTIONS: { id: Appearance; label: string; color: string; border?: string }[] = [
  { id: 1, label: '橘猫', color: '#F4A261' },
  { id: 2, label: '白猫', color: '#F5F5F5' },
  { id: 3, label: '黑猫', color: '#333333' },
  { id: 4, label: '三花猫', color: '#D4956A' },
]

const PERSONALITY_OPTIONS: { id: Personality; label: string }[] = [
  { id: 'lively', label: '会后空翻的猫' },
  { id: 'mysterious', label: '冷若冰霜的猫' },
  { id: 'sleepy', label: '智商堪忧的猫' },
  { id: 'homebody', label: '监狱出逃的猫' },
]

const PERSONALITY_FLAVORS: Record<Personality, string[]> = {
  lively: [
    '别问我为什么会后空翻，快乐上头了，猫也控制不住自己。',
    '没有什么烦恼是一个后空翻解决不了的，如果有，那就翻两个。',
    '活着就是要大闹一场，翻个跟头把所有破事都甩在身后！',
    '我从不在一个地方待太久，风一吹，我就翻着跟头奔向热闹。',
    '别管我！快乐已经冲昏头脑，不翻个后空翻我根本憋不住！',
  ],
  mysterious: [
    '不撒娇，不讨好，不解释，高冷是给自己的安全感。',
    '眼神里藏着一整部猫生电影，只是你没资格看剧情。',
    '别靠近我，别靠近我，冷漠只是在强行稳住精神状态！',
    '见过太多无趣的人类，只对值得的人温柔。',
    '别来烦我！人类的热情好吵，我只想独自发疯，谁也别管！',
  ],
  sleepy: [
    '别骂我笨，我只是把智商都点在了可爱上。',
    '脑袋空空，烦恼为零，简单又快乐，这才是猫生真谛。',
    '别叫醒我我没傻！你知道什么是钝感力吗？',
    '反应永远慢半拍，不知道在干嘛，但活得比谁都自在。',
    '人家笨但是人家可爱啊！关键还有人疼！',
  ],
  homebody: [
    '刚越狱成功，你猜我在里面干了些啥？嘿嘿（嘴角上扬）。',
    '看上去浪迹天涯、桀骜不驯，实际上也得去码头找薯条。',
    '刚越狱成功！谁爱流浪谁去，我只想冲回家疯狂贴贴！',
    '外表再野，终究还是只想赖在你身边。',
    '小小围栏不在话下，《越狱》真该请我当主角！',
  ],
}

const PERSONALITY_MOOD: Record<Personality, string> = {
  lively: '超活泼',
  mysterious: '超高冷',
  sleepy: '超呆萌',
  homebody: '超邪恶',
}

function randomizePersonality() {
  return PERSONALITY_OPTIONS[Math.floor(Math.random() * PERSONALITY_OPTIONS.length)]?.id ?? 'lively'
}

function describeAiCat(tags: CatGenerationTags, personality: Personality) {
  const furLabel = FUR_COLOR_OPTIONS.find((o) => o.id === tags.furColor)?.label ?? '猫咪'
  const accessoryLabel = ACCESSORY_OPTIONS.find((o) => o.id === tags.accessory)?.label ?? ''
  const accessoryText = tags.accessory === 'none' ? '' : `，戴${accessoryLabel}`
  const moodText = PERSONALITY_MOOD[personality]

  return `${moodText}的${furLabel}猫${accessoryText}。`
}

function TagSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: TagOption<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="onboarding-section">
      <p className="onboarding-section__label">{label}</p>
      <div className="onboarding-tag-group" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value === opt.id}
            onClick={() => onChange(opt.id)}
            className={`onboarding-tag-btn ${
              value === opt.id ? 'onboarding-tag-btn--active' : 'onboarding-tag-btn--inactive'
            }`}
          >
            {opt.swatch && (
              <span
                className="onboarding-tag-swatch"
                style={{ backgroundColor: opt.swatch }}
                aria-hidden="true"
              />
            )}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Onboarding() {
  const navigate = useNavigate()
  const { updateGameState } = useGameStore()

  const [mode, setMode] = useState<Mode | null>(null)
  const [aiStep, setAiStep] = useState<AiStep>('config')
  const [appearance, setAppearance] = useState<Appearance>(1)
  const [personality, setPersonality] = useState<Personality>('lively')
  const [name, setName] = useState('')
  const [appearanceThumbLoaded, setAppearanceThumbLoaded] = useState<Record<number, boolean>>({})

  const [aiTags, setAiTags] = useState<CatGenerationTags>(() => randomizeTags())
  const [generating, setGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GeneratedAppearance | null>(null)
  const [genError, setGenError] = useState('')
  const [dailyCount, setDailyCount] = useState(() => getDailyGenerationCount())
  const [loadingTipIdx, setLoadingTipIdx] = useState(() => Math.floor(Math.random() * LOADING_TIPS.length))

  useEffect(() => {
    if (!generating) return
    setLoadingTipIdx(Math.floor(Math.random() * LOADING_TIPS.length))
    const timer = setInterval(() => {
      setLoadingTipIdx((prev) => (prev + 1) % LOADING_TIPS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [generating])

  const aiCatSummary = useMemo(() => describeAiCat(aiTags, personality), [aiTags, personality])
  const aiCatFlavorPoolKey = PERSONALITY_FLAVORS[personality].join('|')
  const aiCatFlavor = useMemo(() => {
    const flavors = PERSONALITY_FLAVORS[personality]
    return flavors[Math.floor(Math.random() * flavors.length)] ?? flavors[0]
  }, [personality, aiCatFlavorPoolKey])

  const handleGenerate = useCallback(async () => {
    if (dailyCount >= MAX_DAILY_GENERATIONS) {
      setGenError(`今日已达生成上限 (${MAX_DAILY_GENERATIONS}次)`)
      return
    }
    setGenerating(true)
    setGenError('')
    setGeneratedResult(null)
    try {
      const result = await generateCatImage(aiTags, personality)
      incrementDailyCount()
      setDailyCount((c) => c + 1)
      setGeneratedResult({
        imageUrl: result.imageUrl,
        rawImageUrl: result.rawImageUrl,
        tags: aiTags,
        generatedAt: new Date().toISOString(),
      })
    } catch (err) {
      setGenError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }, [aiTags, dailyCount, personality])

  const handleSubmit = () => {
    if (name.trim().length === 0) return
    if (mode === 'ai' && generatedResult) {
      updateGameState((prev) => ({
        ...prev,
        cat: {
          name: name.trim(),
          appearance: 1,
          gender: 'female',
          personality: personality as CatPersonality,
          generatedAppearance: {
            ...generatedResult,
            imageUrl: generatedResult.rawImageUrl ?? generatedResult.imageUrl,
          },
        },
        onboardingDone: true,
      }))
    } else {
      updateGameState((prev) => ({
        ...prev,
        cat: { name: name.trim(), appearance, gender: 'female', personality },
        onboardingDone: true,
      }))
    }
    navigate(mode === 'ai' && generatedResult ? '/onboarding/transition' : '/')
  }

  const updateTag = <K extends keyof CatGenerationTags>(key: K, value: CatGenerationTags[K]) => {
    setAiTags((t) => ({ ...t, [key]: value }))
    setGeneratedResult(null)
  }

  // ─── Mode Selection ────────────────────────────────────────

  if (mode === null) {
    return (
      <div className="onboarding-page onboarding-page--centered">
        <AudioToggles className="onboarding-page__audio" />
        <div className="onboarding-mode-list">
          <div className="onboarding-hero">
            <div className="onboarding-hero__emoji" aria-hidden="true">🐱</div>
            <h1 className="onboarding-hero__title">创建你的猫咪</h1>
            <p className="onboarding-hero__subtitle">它将陪你一起学习英语</p>
          </div>

          <button
            type="button"
            onClick={() => setMode('classic')}
            className="onboarding-mode-card"
            aria-label="经典形象：从 4 种预设猫咪中选择"
          >
            <span className="onboarding-mode-card__icon" aria-hidden="true">🐾</span>
            <div>
              <p className="onboarding-mode-card__title">经典形象</p>
              <p className="onboarding-mode-card__desc">从 4 种预设猫咪中选择</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => { setMode('ai'); setAiStep('config') }}
            className="onboarding-mode-card"
            aria-label="AI 创作：自定义标签，AI 生成独一无二的猫咪"
          >
            <span className="onboarding-mode-card__icon" aria-hidden="true">🎨</span>
            <div>
              <p className="onboarding-mode-card__title">AI 创作</p>
              <p className="onboarding-mode-card__desc">自定义标签，AI 生成独一无二的猫咪</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ─── Classic Mode ──────────────────────────────────────────

  const classicPreviewSrc = `/assets/cat/appearance_${appearance}_${personality}.png`

  if (mode === 'classic') {
    return (
      <div className="onboarding-page onboarding-page--form">
        <AudioToggles className="onboarding-page__audio" />
        <div className="onboarding-content">
          <div className="onboarding-ai-header">
            <h1 className="onboarding-ai-header__title">选择你的猫咪</h1>
            <p className="onboarding-ai-header__subtitle">挑一只你喜欢的猫咪形象</p>
          </div>

          <div className="onboarding-ai-generate onboarding-ai-generate--vertical">
            <div className="onboarding-ai-preview--large">
              <img
                src={classicPreviewSrc}
                alt={APPEARANCE_OPTIONS.find((o) => o.id === appearance)?.label ?? '猫咪'}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>

            <div className="onboarding-ai-desc">
              <p className="onboarding-ai-desc__summary">
                {PERSONALITY_MOOD[personality]}的{APPEARANCE_OPTIONS.find((o) => o.id === appearance)?.label ?? '猫咪'}
              </p>
              <p className="onboarding-ai-desc__flavor">{aiCatFlavor}</p>
            </div>
          </div>

          <div className="onboarding-ai-config">
            <div className="onboarding-section">
              <p className="onboarding-section__label">花色</p>
              <div className="onboarding-tag-group" role="radiogroup" aria-label="选择花色">
                {APPEARANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={appearance === opt.id}
                    onClick={() => setAppearance(opt.id)}
                    className={`onboarding-tag-btn ${
                      appearance === opt.id ? 'onboarding-tag-btn--active' : 'onboarding-tag-btn--inactive'
                    }`}
                  >
                    <span
                      className="onboarding-tag-swatch"
                      style={{ backgroundColor: opt.color }}
                      aria-hidden="true"
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-section">
              <p className="onboarding-section__label">性格</p>
              <div className="onboarding-toggle-group" role="radiogroup" aria-label="选择性格">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={personality === opt.id}
                    onClick={() => setPersonality(opt.id)}
                    className={`onboarding-toggle-btn ${
                      personality === opt.id ? 'onboarding-toggle-btn--active' : 'onboarding-toggle-btn--inactive'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-section">
              <label className="onboarding-section__label" htmlFor="cat-name-classic">给猫咪起个名字</label>
              <input
                id="cat-name-classic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="最多10个字"
                maxLength={10}
                autoComplete="off"
                className="onboarding-name-input"
              />
            </div>
          </div>
        </div>

        <div className="onboarding-nav">
          <div className="onboarding-nav__row">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="onboarding-btn-back"
            >
              返回
            </button>
            <button
              type="button"
              disabled={name.trim().length === 0}
              onClick={handleSubmit}
              className={`onboarding-btn-primary${name.trim().length === 0 ? ' onboarding-btn-primary--disabled' : ''}`}
            >
              Let's purr! 🐾
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── AI Creation Mode ─────────────────────────────────────

  return (
    <div className="onboarding-page onboarding-page--form">
      <AudioToggles className="onboarding-page__audio" />
      <div className="onboarding-content">
        <div className="onboarding-ai-header">
          <h1 className="onboarding-ai-header__title">AI 创作你的猫咪</h1>
          <p className="onboarding-ai-header__subtitle">
            {aiStep === 'config' ? '先选择毛色、配饰和性格' : '生成形象后，再给它取个名字'}
          </p>
        </div>

        {aiStep === 'config' ? (
          <div className="onboarding-ai-config">
            <div className="onboarding-ai-summary">
              <div>
                <p className="onboarding-ai-summary__text">{aiCatSummary}</p>
                <p className="onboarding-ai-summary__flavor">{aiCatFlavor}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAiTags(randomizeTags())
                  setPersonality(randomizePersonality())
                  setGeneratedResult(null)
                }}
                className="onboarding-ai-random-btn"
                aria-label="随机生成标签"
              >
                🎲 随机
              </button>
            </div>

            <TagSelector label="毛色" options={FUR_COLOR_OPTIONS} value={aiTags.furColor} onChange={(v) => updateTag('furColor', v)} />
            <TagSelector label="配饰" options={ACCESSORY_OPTIONS} value={aiTags.accessory} onChange={(v) => updateTag('accessory', v)} />

            <div className="onboarding-section">
              <p className="onboarding-section__label">性格</p>
              <div className="onboarding-toggle-group" role="radiogroup" aria-label="选择性格">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={personality === opt.id}
                    onClick={() => {
                      setPersonality(opt.id)
                      setGeneratedResult(null)
                    }}
                    className={`onboarding-toggle-btn ${
                      personality === opt.id ? 'onboarding-toggle-btn--active' : 'onboarding-toggle-btn--inactive'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="onboarding-ai-generate onboarding-ai-generate--vertical">
            <div className="onboarding-ai-preview--large">
              {generatedResult ? (
                <img src={generatedResult.imageUrl} alt="AI 生成猫咪" />
              ) : generating ? (
                <div className="onboarding-ai-spinner" role="status" aria-label="AI 创作中">
                  <div className="onboarding-ai-spinner__ring" />
                  <span className="onboarding-ai-spinner__text">AI 创作中...</span>
                  <span className="onboarding-ai-spinner__tip" key={loadingTipIdx}>
                    {LOADING_TIPS[loadingTipIdx]}
                  </span>
                  <span className="onboarding-ai-spinner__eta">预计 15 秒</span>
                </div>
              ) : (
                <span className="onboarding-ai-preview__placeholder" aria-hidden="true">🎨</span>
              )}
            </div>

            <div className="onboarding-ai-desc">
              <p className="onboarding-ai-desc__summary">{aiCatSummary}</p>
              <p className="onboarding-ai-desc__flavor">{aiCatFlavor}</p>
              <p className="onboarding-ai-desc__remaining">今日剩余 {MAX_DAILY_GENERATIONS - dailyCount} 次</p>
            </div>

            {genError && <p className="onboarding-error" role="alert">{genError}</p>}

            <div className="onboarding-section" style={{ marginTop: 'var(--space-4xl)' }}>
              <label className="onboarding-section__label" htmlFor="cat-name-ai">给猫咪起个名字</label>
              <input
                id="cat-name-ai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="最多10个字"
                maxLength={10}
                autoComplete="off"
                className="onboarding-name-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="onboarding-nav">
        {aiStep === 'config' ? (
          <div className="onboarding-nav__row">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="onboarding-btn-back"
            >
              返回
            </button>
            <button
              type="button"
              onClick={() => setAiStep('generate')}
              className="onboarding-btn-primary"
            >
              下一步
            </button>
          </div>
        ) : (
          <div className="onboarding-nav__row">
            <button
              type="button"
              onClick={() => setAiStep('config')}
              className="onboarding-btn-back"
            >
              上一步
            </button>
            {generatedResult ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedResult(null)
                    handleGenerate()
                  }}
                  disabled={generating || dailyCount >= MAX_DAILY_GENERATIONS}
                  className="onboarding-btn-back"
                  style={{ opacity: generating || dailyCount >= MAX_DAILY_GENERATIONS ? 0.5 : 1 }}
                >
                  重新生成
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={name.trim().length === 0}
                  className={`onboarding-btn-primary${name.trim().length === 0 ? ' onboarding-btn-primary--disabled' : ''}`}
                >
                  就是它了
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || dailyCount >= MAX_DAILY_GENERATIONS}
                className={`onboarding-btn-primary${
                  generating || dailyCount >= MAX_DAILY_GENERATIONS ? ' onboarding-btn-primary--disabled' : ''
                }`}
              >
                {generating ? 'AI 创作中...' : '开始生成'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Onboarding
