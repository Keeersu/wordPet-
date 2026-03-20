/*
 * DO NOT DELETE — base-info and page-design tags are consumed by project-snapshot tooling for quick page overview. Always update them to reflect actual page content.
 * <base-info>
 * Description: 登录/注册页面，支持邮箱密码登录和注册，游戏进度云同步。
 * Style referenceFiles: styles/login.css
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
      await refreshSession()

      try {
        await saveGameStateToServer(gameState)
        await loadFromCloud()
      } catch {
        // Ignore sync errors during login
      }

      navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Logo */}
      <div className="login-logo">🐱</div>
      <div className="login-title">WordPet</div>
      <div className="login-subtitle">
        {mode === 'login' ? '登录后同步学习进度' : '注册账号，数据永不丢失'}
      </div>

      {/* Mode Toggle */}
      <div className="login-tabs">
        {(['login', 'register'] as AuthMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError('') }}
            className={`login-tab ${mode === m ? 'login-tab--active' : 'login-tab--inactive'}`}
          >
            {m === 'login' ? '登录' : '注册'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="login-form">
        {mode === 'register' && (
          <input
            type="text"
            placeholder="昵称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="login-input"
            maxLength={10}
          />
        )}
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />

        {/* Error Message */}
        {error && (
          <div className="login-error">{error}</div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="login-submit-btn"
        >
          {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
        </button>
      </div>

      {/* Skip Login Link */}
      <button
        onClick={() => navigate(from, { replace: true })}
        className="login-skip"
      >
        暂不登录，以游客身份继续
      </button>
    </div>
  )
}

export default Login
