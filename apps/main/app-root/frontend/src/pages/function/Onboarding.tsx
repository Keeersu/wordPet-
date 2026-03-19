import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '@/store/GameContext'

type Appearance = 1 | 2 | 3 | 4
type Gender = 'male' | 'female'
type Personality = 'homebody' | 'lively' | 'mysterious'

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

  return (
    <div className="min-h-screen bg-[#FFF8E7] px-5 py-6 text-[#5D4037]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <h1 className="text-2xl font-extrabold">来，先认识一下你的猫咪</h1>

        <div className="rounded-2xl border-2 border-[#F1DDB6] bg-white p-4">
          {/* 🖼️ ASSET | 猫咪预览图 | /assets/cat/appearance_{appearance}_{personality}_{m|f}.png */}
          <img
            src={catPreviewSrc}
            alt="猫咪预览"
            className="mx-auto h-40 w-40 rounded-full bg-[#FFEFD2] object-contain"
          />
        </div>

        <label className="text-sm font-semibold">外观</label>
        <select
          value={appearance}
          onChange={(e) => setAppearance(Number(e.target.value) as Appearance)}
          className="rounded-xl border border-[#E8D5B0] bg-white px-3 py-2"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>

        <label className="text-sm font-semibold">性别</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="rounded-xl border border-[#E8D5B0] bg-white px-3 py-2"
        >
          <option value="female">female</option>
          <option value="male">male</option>
        </select>

        <label className="text-sm font-semibold">性格</label>
        <select
          value={personality}
          onChange={(e) => setPersonality(e.target.value as Personality)}
          className="rounded-xl border border-[#E8D5B0] bg-white px-3 py-2"
        >
          <option value="homebody">homebody</option>
          <option value="lively">lively</option>
          <option value="mysterious">mysterious</option>
        </select>

        <label className="text-sm font-semibold">名字</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="给你的猫咪起个名字"
          maxLength={10}
          className="rounded-xl border border-[#E8D5B0] bg-white px-3 py-2"
        />

        <button
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className="mt-2 rounded-full bg-[#FFB840] px-5 py-3 text-base font-bold text-[#3D1F00] shadow-[0_4px_0_0_#A06800] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Let&apos;s purr!
        </button>
      </div>
    </div>
  )
}

export default Onboarding
