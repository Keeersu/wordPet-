import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { pageLinks } from '../../pageLinks'

const tabs = [
  { id: 'collection', icon: 'lucide:book-open', label: '图鉴', path: pageLinks.Collection() },
  { id: 'practice', icon: 'lucide:gamepad-2', label: '练习', path: pageLinks.Practice() },
  { id: 'profile', icon: 'lucide:user', label: '我的', path: pageLinks.Profile() },
] as const

export function MainTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 34px))',
        left: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-end',
        zIndex: 40,
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Icon
              icon={tab.icon}
              style={{
                width: '18px',
                height: '18px',
                color: isActive ? '#FFB840' : 'rgba(93,64,55,0.4)',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                marginTop: '1px',
                color: isActive ? '#FFB840' : 'rgba(93,64,55,0.4)',
                fontWeight: isActive ? 700 : 400,
                fontFamily: "'PingFang SC', sans-serif",
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
