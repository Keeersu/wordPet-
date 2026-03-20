import { useNavigate } from 'react-router-dom'
import { pageLinks } from '../../pageLinks'

const tabs = [
  { id: 'collection', label: '图鉴', path: pageLinks.Collection(), color: '#4ECDC4', borderColor: '#9AE0DA' },
  { id: 'practice', label: '复习', path: pageLinks.Practice(), color: '#FFB840', borderColor: '#F5C87A' },
  { id: 'profile', label: '我的', path: pageLinks.Profile(), color: '#66BB6A', borderColor: '#A5D6A7' },
] as const

export function MainTabBar() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        left: 20,
        display: 'flex',
        gap: 12,
        zIndex: 39,
      }}
    >
      {tabs.map((tab) => (
        // 🖼️ ASSET | Tab图标 | PNG @3x | /assets/ui/icons/icon-{id}.png
        <button
          key={tab.id}
          onClick={() => navigate(tab.path)}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: tab.color,
            boxShadow: '0 4px 0 0 rgba(0,0,0,0.15)',
            border: `3px solid ${tab.borderColor}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            transition: 'transform 80ms ease, box-shadow 80ms ease',
          }}
          onPointerDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(3px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 0 0 rgba(0,0,0,0.15)'
          }}
          onPointerUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 rgba(0,0,0,0.15)'
          }}
          onPointerLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 rgba(0,0,0,0.15)'
          }}
        >
          <img
            src={`/assets/ui/icons/icon-${tab.id}.png`}
            alt={tab.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </button>
      ))}
    </div>
  )
}
