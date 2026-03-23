import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pageLinks } from '../../pageLinks'

const tabs = [
  { id: 'collection', label: '图鉴', path: pageLinks.Collection(), color: '#4ECDC4', borderColor: '#9AE0DA' },
  { id: 'practice', label: '复习', path: pageLinks.Practice(), color: '#FFB840', borderColor: '#F5C87A' },
  { id: 'profile', label: '我的', path: pageLinks.Profile(), color: '#66BB6A', borderColor: '#A5D6A7' },
] as const

export function MainTabBar() {
  const navigate = useNavigate()
  const [loadedTabImages, setLoadedTabImages] = useState<Record<string, boolean>>({})

  return (
    <div className="main-tabbar">
      {tabs.map((tab) => (
        // 🖼️ ASSET | Tab图标 | PNG @3x | /assets/ui/icons/icon-{id}.png
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          className={`tabbar-btn ${loadedTabImages[tab.id] ? 'tabbar-btn--image-only' : 'tabbar-btn--fallback-shell'}`}
          style={{
            ...(loadedTabImages[tab.id]
              ? {}
              : {
                  backgroundColor: tab.color,
                  border: `3px solid ${tab.borderColor}`,
                }),
          }}
        >
          <img
            src={`/assets/ui/icons/icon-${tab.id}.png`}
            alt={tab.label}
            className="tabbar-btn__img"
            onLoad={() => {
              setLoadedTabImages((prev) => ({ ...prev, [tab.id]: true }))
            }}
            onError={(e) => {
              setLoadedTabImages((prev) => ({ ...prev, [tab.id]: false }))
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </button>
      ))}
    </div>
  )
}
