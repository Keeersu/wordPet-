import { useParams } from 'react-router-dom'

function Room() {
  const { chapterId } = useParams()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF8E7] px-6">
      <div className="text-center text-[#5D4037]">
        <h1 className="text-2xl font-bold">房间详情页</h1>
        <p className="mt-2 text-sm opacity-70">Chapter: {chapterId}</p>
      </div>
    </div>
  )
}

export default Room
