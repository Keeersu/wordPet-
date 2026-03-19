import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/GameContext'

type Appearance = 1 | 2 | 3 | 4
type Gender = 'male' | 'female'
type Personality = 'homebody' | 'lively' | 'mysterious'

const APPEARANCE_OPTIONS: { id: Appearance; label: string; color: string; border?: string }[] = [
  { id: 1, label: '橘猫', color: 'bg-[#F4A261]' },
  { id: 2, label: '白猫', color: 'bg-[#F5F5F5]', border: 'border border-gray-200' },
  { id: 3, label: '黑猫', color: 'bg-[#333333]' },
  { id: 4, label: '折耳猫', color: 'bg-[#C0A0A0]' },
]

const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: 'female', label: '♀ 女生' },
  { id: 'male', label: '♂ 男生' },
]

const PERSONALITY_OPTIONS: { id: Personality; label: string }[] = [
  { id: 'homebody', label: '🏠 居家' },
  { id: 'lively', label: '⚡ 活泼' },
  { id: 'mysterious', label: '🌙 神秘' },
]

function Onboarding() {
  const navigate = useNavigate()
  const { updateGameState } = useGameStore()

  const [appearance, setAppearance] = useState<Appearance>(1)
  const [gender, setGender] = useState<Gender>('female')
  const [personality, setPersonality] = useState<Personality>('homebody')
  const [name, setName] = useState('')

  const genderSuffix = gender === 'male' ? 'm' : 'f'
  const isSubmitDisabled = name.trim().length === 0

  const catPreviewSrc = useMemo(
    () => `/assets/cat/appearance_${appearance}_${personality}_${genderSuffix}.png`,
    [appearance, personality, genderSuffix],
  )

  const handleSubmit = () => {
    if (isSubmitDisabled) return

    updateGameState((prev) => ({
      ...prev,
      cat: {
        name: name.trim(),
        appearance,
        gender,
        personality,
      },
      onboardingDone: true,
    }))

    navigate('/')
  }

  // keep catPreviewSrc reference for asset replacement
  void catPreviewSrc

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8E7] px-5 pb-5 pt-6">
      <div className="mx-auto flex w-full max-w-md flex-col">
        {/* 1. Title */}
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold text-[#5D4037]">给你的猫咪起个名字吧～</h1>
          <p className="mt-1 text-sm text-gray-400">它将陪你一起学习英语</p>
        </div>

        {/* 2. Cat preview */}
        {/* 🖼️ ASSET | 猫咪预览图 | /assets/cat/appearance_{appearance}_{personality}_{m|f}.png */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#FFB840]">
            <span className="text-5xl">🐱</span>
          </div>
        </div>

        {/* 3. Appearance */}
        <div className="mb-3">
          <p className="mb-2 text-sm font-semibold text-[#5D4037]">选择外观</p>
          <div className="flex justify-center gap-2">
            {APPEARANCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAppearance(opt.id)}
                className={`flex h-20 w-16 flex-col items-center justify-center rounded-xl bg-white ${
                  appearance === opt.id ? 'border-2 border-[#FFB840]' : 'border-2 border-transparent'
                }`}
              >
                <div className={`h-12 w-12 rounded-lg ${opt.color} ${opt.border ?? ''}`} />
                <span className="mt-1 text-center text-xs text-[#5D4037]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Gender */}
        <div className="mb-3">
          <p className="mb-2 text-sm font-semibold text-[#5D4037]">性别</p>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setGender(opt.id)}
                className={`h-10 flex-1 rounded-xl text-sm ${
                  gender === opt.id
                    ? 'bg-[#FFB840] font-semibold text-[#3D1F00]'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Personality */}
        <div className="mb-3">
          <p className="mb-2 text-sm font-semibold text-[#5D4037]">性格</p>
          <div className="flex gap-2">
            {PERSONALITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPersonality(opt.id)}
                className={`h-10 flex-1 rounded-xl text-sm ${
                  personality === opt.id
                    ? 'bg-[#FFB840] font-semibold text-[#3D1F00]'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Name input */}
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

        {/* 7. Submit button */}
        <button
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className={`h-12 w-full rounded-full text-base font-bold ${
            isSubmitDisabled
              ? 'cursor-not-allowed bg-gray-200 text-gray-400'
              : 'bg-[#FFB840] text-[#3D1F00] shadow-[0_4px_0_0_#A06800] active:translate-y-[2px] active:shadow-[0_2px_0_0_#A06800]'
          }`}
        >
          Let&apos;s purr! 🐾
        </button>
      </div>
    </div>
  )
}

export default Onboarding
