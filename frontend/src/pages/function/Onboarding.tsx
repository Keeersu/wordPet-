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
type Gender = 'male' | 'female'
type Personality = 'homebody' | 'lively' | 'mysterious'
type Mode = 'classic' | 'ai'

const APPEARANCE_OPTIONS: { id: Appearance; label: string; color: string; border?: string }[] = [
  { id: 1, label: '橘猫', color: 'bg-[#F4A261]' },
  { id: 2, label: '白猫', color: 'bg-[#F5F5F5]', border: 'border border-gray-200' },
  { id: 3, label: '黑猫', color: 'bg-[#333333]' },
  { id: 4, label: '折耳猫', color: 'bg-[#C0A0A0]' },
]

const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: 'female', label: '女生' },
  { id: 'male', label: '男生' },
]

const PERSONALITY_OPTIONS: { id: Personality; label: string }[] = [
  { id: 'homebody', label: '居家' },
  { id: 'lively', label: '活泼' },
  { id: 'mysterious', label: '神秘' },
]

const PERSONALITY_FLAVOR: Record<Personality, string> = {
  homebody: '安静陪你待着。',
  lively: '一看就很会撒娇。',
  mysterious: '有点酷，也有点黏人。',
}

const PERSONALITY_MOOD: Record<Personality, string> = {
  homebody: '温柔',
  lively: '活泼',
  mysterious: '神秘',
}

function describeAiCat(tags: CatGenerationTags, personality: Personality) {
  const furLabel = FUR_COLOR_OPTIONS.find((o) => o.id === tags.furColor)?.label ?? '猫咪'
  const accessoryLabel = ACCESSORY_OPTIONS.find((o) => o.id === tags.accessory)?.label ?? ''
  const accessoryText = tags.accessory === 'none' ? '' : `，戴${accessoryLabel}`
  const moodText = PERSONALITY_MOOD[personality]

  return `${moodText}的${furLabel}猫${accessoryText}。`
}

// ─── 通用组件 ────────────────────────────────────────────────

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
    <div>
      <p className="mb-2.5 text-sm font-semibold text-[#5D4037]">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${
              value === opt.id
                ? 'bg-[#FFB840] font-bold text-[#3D1F00] shadow-sm'
                : 'bg-white text-gray-600 active:bg-gray-100'
            }`}
          >
            {opt.swatch && (
              <span
                className="mr-1.5 inline-block h-3 w-3 rounded-full border border-black/10 align-middle"
                style={{ backgroundColor: opt.swatch }}
              />
            )}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepNavButtons({
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
  backLabel = '上一步',
  showBack = true,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel: string
  nextDisabled?: boolean
  backLabel?: string
  showBack?: boolean
}) {
  return (
    <div className="flex gap-3 pt-4 pb-2">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="h-12 flex-1 rounded-[14px] border-2 border-[rgba(93,64,55,0.15)] bg-white text-sm font-extrabold text-[#5D4037] shadow-[0_3px_0_0_rgba(93,64,55,0.08)] transition-transform active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(93,64,55,0.08)]"
        >
          {backLabel}
        </button>
      )}
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className={`h-12 rounded-[14px] text-base font-black ${showBack ? 'flex-[2]' : 'w-full'} ${
          nextDisabled
            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
            : 'border-[2.5px] border-[#F5C87A] bg-[#FFB840] text-[#3D1F00] shadow-[0_3px_0_0_#A06800] transition-transform active:translate-y-[3px] active:shadow-[0_0px_0_0_#A06800]'
        }`}
      >
        {nextLabel}
      </button>
    </div>
  )
}

// ─── 主组件 ──────────────────────────────────────────────────

function Onboarding() {
  const navigate = useNavigate()
  const { updateGameState } = useGameStore()

  const [mode, setMode] = useState<Mode | null>(null)
  const [appearance, setAppearance] = useState<Appearance>(1)
  const [gender, setGender] = useState<Gender>('female')
  const [personality, setPersonality] = useState<Personality>('homebody')
  const [name, setName] = useState('')
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [appearanceThumbLoaded, setAppearanceThumbLoaded] = useState<Record<number, boolean>>({})

  const [aiTags, setAiTags] = useState<CatGenerationTags>(() => randomizeTags())
  const [generating, setGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GeneratedAppearance | null>(null)
  const [genError, setGenError] = useState('')
  const [dailyCount, setDailyCount] = useState(() => getDailyGenerationCount())

  const genderSuffix = gender === 'male' ? 'm' : 'f'

  const catPreviewSrc = useMemo(
    () => `/assets/cat/appearance_${appearance}_${personality}_${genderSuffix}.png`,
    [appearance, personality, genderSuffix],
  )
  const aiCatSummary = useMemo(() => describeAiCat(aiTags, personality), [aiTags, personality])
  const aiCatFlavor = useMemo(() => PERSONALITY_FLAVOR[personality], [personality])

  useEffect(() => {
    setPreviewLoaded(false)
  }, [catPreviewSrc])

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
          gender,
          personality: personality as CatPersonality,
          generatedAppearance: {
            ...generatedResult,
            imageUrl: generatedResult.rawImageUrl,
          },
        },
        onboardingDone: true,
      }))
    } else {
      updateGameState((prev) => ({
        ...prev,
        cat: { name: name.trim(), appearance, gender, personality },
        onboardingDone: true,
      }))
    }
    navigate(mode === 'ai' && generatedResult ? '/onboarding/transition' : '/')
  }

  const updateTag = <K extends keyof CatGenerationTags>(key: K, value: CatGenerationTags[K]) => {
    setAiTags((t) => ({ ...t, [key]: value }))
    setGeneratedResult(null)
  }

  // ─── 首屏：模式选择 ───────────────────────────────────────

  if (mode === null) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#FFF8E7] px-5">
        <AudioToggles className="absolute top-4 right-5" />
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <div className="mb-2 text-6xl">🐱</div>
            <h1 className="mb-1 text-2xl font-bold text-[#5D4037]">创建你的猫咪</h1>
            <p className="text-sm text-gray-400">它将陪你一起学习英语</p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setMode('classic')}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm active:shadow-none"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E0] text-2xl">🐾</span>
              <div>
                <p className="font-bold text-[#5D4037]">经典形象</p>
                <p className="text-xs text-gray-400">从 4 种预设猫咪中选择</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('ai')}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm active:shadow-none"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E0] text-2xl">🎨</span>
              <div>
                <p className="font-bold text-[#5D4037]">AI 创作</p>
                <p className="text-xs text-gray-400">自定义标签，AI 生成独一无二的猫咪</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── 经典模式 ──────────────────────────────────────────────

  if (mode === 'classic') {
    return (
      <div className="relative flex h-screen flex-col bg-[#FFF8E7] px-5">
        <AudioToggles className="absolute top-4 right-5 z-10" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto pb-4 pt-6">
          <div>
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-[#5D4037]">外观</p>
              <div className="grid grid-cols-2 gap-3">
                {APPEARANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAppearance(opt.id)}
                    className={`rounded-2xl bg-white p-2 ${
                      appearance === opt.id ? 'border-2 border-[#FFB840]' : 'border-2 border-transparent'
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                      <img
                        src={`/assets/onboarding/cat/appearance_${opt.id}.png`}
                        alt={opt.label}
                        className="absolute inset-0 h-full w-full object-contain"
                        onLoad={() => setAppearanceThumbLoaded((prev) => ({ ...prev, [opt.id]: true }))}
                        onError={(e) => {
                          setAppearanceThumbLoaded((prev) => ({ ...prev, [opt.id]: false }))
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      {!appearanceThumbLoaded[opt.id] && (
                        <div className={`aspect-square w-full rounded-xl ${opt.color} ${opt.border ?? ''}`} />
                      )}
                    </div>
                    <p className="mt-1 text-center text-xs text-gray-500">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-[#5D4037]">性别</p>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGender(opt.id)}
                    className={`h-11 flex-1 rounded-lg text-sm ${
                      gender === opt.id ? 'bg-[#FFB840] font-semibold text-[#3D1F00]' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-[#5D4037]">性格</p>
              <div className="flex gap-2">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPersonality(opt.id)}
                    className={`h-11 flex-1 rounded-lg text-sm ${
                      personality === opt.id ? 'bg-[#FFB840] font-semibold text-[#3D1F00]' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-[#5D4037]">名字</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="最多10个字"
                maxLength={10}
                className="h-11 w-full rounded-xl border border-[#E0D5C0] bg-white px-4 text-sm placeholder-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Buttons pinned to bottom */}
        <div className="mx-auto w-full max-w-md shrink-0 px-0 pb-5">
          <StepNavButtons
            onBack={() => setMode(null)}
            onNext={handleSubmit}
            backLabel="返回"
            nextLabel="Let's purr! 🐾"
            nextDisabled={name.trim().length === 0}
          />
        </div>
      </div>
    )
  }

  // ─── AI 创作模式（单页） ─────────────────────────────────

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#FFF8E7] px-5">
      <AudioToggles className="absolute top-4 right-5 z-10" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between py-5">
        <div className="shrink-0 pb-3 text-center">
          <h1 className="text-lg font-bold text-[#5D4037]">AI 创作你的猫咪</h1>
          <p className="mt-0.5 text-xs text-gray-400">在同一页完成设定、生成和命名</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-stretch gap-4">
              <div className="relative flex h-[184px] w-[184px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">
                {generatedResult ? (
                  <img src={generatedResult.imageUrl} alt="AI 生成猫咪" className="h-full w-full object-contain" />
                ) : generating ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FFB840] border-t-transparent" />
                    <span className="text-sm text-gray-400">AI 创作中...</span>
                    <span className="text-xs text-gray-300">大约需要 15 秒</span>
                  </div>
                ) : (
                  <span className="text-7xl">🎨</span>
                )}
              </div>

              <div className="flex h-[184px] min-w-0 flex-1 flex-col rounded-2xl bg-white/70 p-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold leading-5 text-[#5D4037]">{aiCatSummary}</p>
                  <p className="text-xs leading-5 text-[#7A665E]">{aiCatFlavor}</p>
                </div>
                <div className="mt-auto space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiTags(randomizeTags())
                      setGeneratedResult(null)
                    }}
                    className="rounded-full bg-white px-3 py-1.5 text-xs text-gray-500 shadow-sm active:bg-gray-50"
                  >
                    🎲 随机
                  </button>
                  <p className="text-xs text-gray-300">今日剩余 {MAX_DAILY_GENERATIONS - dailyCount} 次</p>
                </div>
              </div>
            </div>

            {genError && <p className="text-center text-sm text-red-400">{genError}</p>}

            <div className="space-y-4 pt-3">
              <TagSelector label="毛色" options={FUR_COLOR_OPTIONS} value={aiTags.furColor} onChange={(v) => updateTag('furColor', v)} />
              <TagSelector label="配饰" options={ACCESSORY_OPTIONS} value={aiTags.accessory} onChange={(v) => updateTag('accessory', v)} />

              <div>
                <p className="mb-2 text-sm font-semibold text-[#5D4037]">性格</p>
                <div className="flex gap-2">
                  {PERSONALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPersonality(opt.id)
                        setGeneratedResult(null)
                      }}
                      className={`h-10 flex-1 rounded-lg text-sm ${
                        personality === opt.id ? 'bg-[#FFB840] font-semibold text-[#3D1F00]' : 'bg-white text-gray-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#5D4037]">给猫咪起个名字</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="最多10个字"
                  maxLength={10}
                  className="h-11 w-full rounded-xl border border-[#E0D5C0] bg-white px-4 text-base placeholder-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md shrink-0 pb-5 pt-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="h-12 flex-1 rounded-[14px] border-2 border-[rgba(93,64,55,0.15)] bg-white text-sm font-extrabold text-[#5D4037] shadow-[0_3px_0_0_rgba(93,64,55,0.08)] transition-transform active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(93,64,55,0.08)]"
          >
            返回
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
                className="h-12 flex-1 rounded-[14px] border-2 border-[rgba(93,64,55,0.15)] bg-white text-sm font-extrabold text-[#5D4037] shadow-[0_3px_0_0_rgba(93,64,55,0.08)] transition-transform disabled:opacity-50 active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(93,64,55,0.08)]"
              >
                重新生成
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={name.trim().length === 0}
                className={`h-12 flex-[2] rounded-[14px] text-base font-black ${
                  name.trim().length === 0
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'border-[2.5px] border-[#F5C87A] bg-[#FFB840] text-[#3D1F00] shadow-[0_3px_0_0_#A06800] transition-transform active:translate-y-[3px] active:shadow-[0_0px_0_0_#A06800]'
                }`}
              >
                就是它了
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || dailyCount >= MAX_DAILY_GENERATIONS}
              className={`h-12 flex-[2] rounded-[14px] text-base font-black ${
                generating || dailyCount >= MAX_DAILY_GENERATIONS
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'border-[2.5px] border-[#F5C87A] bg-[#FFB840] text-[#3D1F00] shadow-[0_3px_0_0_#A06800] transition-transform active:translate-y-[3px] active:shadow-[0_0px_0_0_#A06800]'
              }`}
            >
              {generating ? 'AI 创作中...' : '开始生成'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Onboarding
