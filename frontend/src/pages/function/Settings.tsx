/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 应用基础设置、通知偏好配置与账户管理。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 切换通知、音效开关
 * - 退出登录
 * - 导航：返回 (Header Back)
 *
 * ## Page Layout
 * 顶部导航（返回按钮 + 标题），内容区占位
 * </page-design>
 */

import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'

function Settings() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#FFF8E7',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        color: '#5D4037',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px',
          background: 'rgba(255,248,231,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(93,64,55,0.08)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 10,
            border: '2px solid rgba(93,64,55,0.12)',
            backgroundColor: 'white',
            boxShadow: '0 2px 0 0 rgba(93,64,55,0.1)',
            cursor: 'pointer',
            color: '#5D4037',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          <Icon icon="lucide:arrow-left" style={{ width: 16, height: 16 }} />
          返回
        </button>

        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5 }}>设置</div>

        <div style={{ width: 68 }} />
      </div>

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 48 }}>⚙️</span>
        <p style={{ fontSize: 16, fontWeight: 700 }}>设置</p>
        <p style={{ fontSize: 14, color: 'rgba(93,64,55,0.5)' }}>敬请期待 🐾</p>
      </div>
    </div>
  )
}

export default Settings
