import { useNavigate } from 'react-router-dom'

function Result() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF8E7] px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-extrabold text-[#5D4037]">关卡完成！</h1>
        <button
          onClick={() => navigate('/')}
          className="rounded-full bg-[#FFB840] px-8 py-3 text-base font-bold text-[#3D1F00] shadow-[0_4px_0_0_#A06800] active:translate-y-[2px] active:shadow-[0_2px_0_0_#A06800]"
        >
          返回首页
        </button>
      </div>
    </div>
  )
}

export default Result
