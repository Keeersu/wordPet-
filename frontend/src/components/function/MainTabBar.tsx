import { useNavigate } from 'react-router-dom'
import { pageLinks } from '../../pageLinks'

/* ── 可爱简约 SVG icon ── */

/** 图鉴 — 翻开的小书本 */
function IconCollection({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 6C12 6 9.5 4 6 4C4 4 3 4.8 3 4.8V19.2C3 19.2 4 18.5 6 18.5C9 18.5 12 20 12 20C12 20 15 18.5 18 18.5C20 18.5 21 19.2 21 19.2V4.8C21 4.8 20 4 18 4C14.5 4 12 6 12 6Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 6V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** 复习 — 闪亮小星星 */
function IconPractice({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3L14.4 9.2L21 9.8L16 14.2L17.5 21L12 17.5L6.5 21L8 14.2L3 9.8L9.6 9.2L12 3Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 我的 — 可爱小人 */
function IconProfile({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <path
        d="M5 20C5 17 8 15 12 15C16 15 19 17 19 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const iconMap: Record<string, React.FC<{ size?: number; color?: string }>> = {
  collection: IconCollection,
  practice: IconPractice,
  profile: IconProfile,
}

const tabs = [
  { id: 'collection', label: '图鉴', path: pageLinks.Collection(), color: '#4ECDC4' },
  { id: 'practice', label: '复习', path: pageLinks.Practice(), color: '#FFB840' },
  { id: 'profile', label: '我的', path: pageLinks.Profile(), color: '#66BB6A' },
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
      {tabs.map((tab) => {
        const IconComponent = iconMap[tab.id]
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: tab.color,
              boxShadow: '0 4px 0 0 rgba(0,0,0,0.15)',
              border: '3px solid white',
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
            {IconComponent && <IconComponent size={26} color="#fff" />}
          </button>
        )
      })}
    </div>
  )
}
