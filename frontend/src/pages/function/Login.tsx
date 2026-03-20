/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 登录/注册页面，支持邮箱密码登录和注册，游戏进度云同步。
 * Style referenceFiles:
 * Design for: Mobile
 * </base-info>
 * <page-design>
 * ## Features & Interactions
 * - 登录/注册切换 Tab
 * - 邮箱 + 密码输入
 * - 注册时增加昵称输入
 * - 错误提示 Toast
 * - 登录成功后跳转回上一页或首页
 * - "跳过登录" 链接（游客模式）
 *
 * ## Page Layout
 * 全屏居中表单，顶部猫咪 Logo，底部跳过登录链接
 * </page-design>
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signIn, signUp } from '@/store/authStore'
import { useGameStore } from '@/store/GameContext'
import { useAuth } from '@/store/AuthContext'
import { saveGameStateToServer } from '@/store/authStore'

type AuthMode = 'login' | 'register'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { gameState, loadFromCloud } = useGameStore()
  const { refreshSession } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string })?.from || '/'

  const handleSubmit = async () => {
    setError('')
    if (!email.trim()) {
      setError('请输入邮箱')
      return
    }
    if (!password.trim() || password.length < 4) {
      setError('密码至少 4 个字符')
      return
    }
    if (mode === 'register' && !name.trim()) {
      setError('请输入昵称')
      return
    }

    setLoading(true)
    try {
      let result
      if (mode === 'login') {
        result = await signIn(email.trim(), password, name.trim() || undefined)
      } else {
        result = await signUp(email.trim(), password, name.trim())
      }

      if ('error' in result) {
        setError(result.error)
        return
      }

      // Login/register successful
      // 1. Refresh auth context to pick up the new user
      await refreshSession()

      // 2. Sync game state: push local to server, then load from cloud
      try {
        await saveGameStateToServer(gameState)
        await loadFromCloud()
      } catch {
        // Ignore sync errors during login
      }

      // Navigate back
      navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: '2px solid rgba(93,64,55,0.15)',
    backgroundColor: 'white',
    fontSize: 15,
    fontWeight: 600,
    color: '#5D4037',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 0',
    borderRadius: 14,
    border: 'none',
    backgroundColor: '#FFB840',
    color: 'white',
    fontSize: 16,
    fontWeight: 800,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 0 0 rgba(200,140,0,0.3)',
    opacity: loading ? 0.6 : 1,
    transition: 'opacity 0.2s, transform 0.1s',
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF8E7',
        fontFamily: "'Nunito', 'PingFang SC', sans-serif",
        color: '#5D4037',
        padding: '24px 20px',
      }}
    >
      {/* Logo */}
      <div style={{ fontSize: 64, marginBottom: 8, lineHeight: 1 }}>🐱</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>WordPet</div>
      <div
        style={{
          fontSize: 14,
          color: 'rgba(93,64,55,0.55)',
          marginBottom: 32,
          fontWeight: 600,
        }}
      >
        {mode === 'login' ? '登录后同步学习进度' : '注册账号，数据永不丢失'}
      </div>

      {/* Mode Toggle */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'rgba(93,64,55,0.06)',
          borderRadius: 12,
          padding: 3,
          marginBottom: 24,
          width: '100%',
          maxWidth: 340,
        }}
      >
        {(['login', 'register'] as AuthMode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m)
              setError('')
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              border: 'none',
              backgroundColor: mode === m ? 'white' : 'transparent',
              color: mode === m ? '#5D4037' : 'rgba(93,64,55,0.45)',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: mode === m ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {m === 'login' ? '登录' : '注册'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'register' && (
          <input
            type="text"
            placeholder="昵称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            maxLength={10}
          />
        )}
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              backgroundColor: 'rgba(239,83,80,0.1)',
              color: '#EF5350',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={btnStyle}
        >
          {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
        </button>
      </div>

      {/* Skip Login Link */}
      <button
        onClick={() => navigate(from, { replace: true })}
        style={{
          marginTop: 24,
          padding: '8px 16px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'rgba(93,64,55,0.45)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        暂不登录，以游客身份继续
      </button>

      <style>{`
        input::placeholder {
          color: rgba(93,64,55,0.35);
        }
        input:focus {
          border-color: #FFB840 !important;
        }
      `}</style>
    </div>
  )
}

export default Login
