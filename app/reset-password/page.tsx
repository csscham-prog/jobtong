'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false) // 세션 준비 여부

  useEffect(() => {
    // Supabase가 URL 해시에서 세션을 자동으로 복원함
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
      } else {
        setError('유효하지 않거나 만료된 링크입니다. 비밀번호 찾기를 다시 시도해주세요.')
      }
    })
  }, [])

  const handleResetPassword = async () => {
    if (!password || !passwordConfirm) { setError('새 비밀번호를 입력해주세요.'); return }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }

    setLoading(true); setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('비밀번호 변경에 실패했습니다. 링크가 만료되었을 수 있습니다. 다시 시도해주세요.')
    } else {
      setMessage('비밀번호가 성공적으로 변경되었습니다!')
      setTimeout(() => { window.location.href = '/' }, 2000)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12,
    padding: '13px 16px', fontSize: 15, color: '#1a1a1a',
    background: '#faf9f7', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const Emblem = () => (
    <div style={{
      width: 48, height: 48,
      background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)',
      borderRadius: 12, display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, background: '#e6a800', borderRadius: '50%' }} />
      <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: "'Pretendard', sans-serif" }}>J</span>
    </div>
  )

  return (
    <main style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#f7f6f3', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* 로고 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Emblem />
        <span style={{ fontSize: 28, fontWeight: 800, color: '#0f2244', letterSpacing: '-0.5px' }}>잡통</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #ece9e1', width: '100%', maxWidth: 420 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2244', marginBottom: 8, textAlign: 'center' }}>새 비밀번호 설정</h2>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28, lineHeight: 1.7 }}>
          사용할 새 비밀번호를 입력해주세요.
        </p>

        {/* 링크 만료 등 세션 없을 때 */}
        {!ready && !error && (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 14, padding: '20px 0' }}>확인 중...</div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 16 }}>
            {message}<br />
            <span style={{ fontSize: 12, opacity: 0.8 }}>잠시 후 메인 페이지로 이동합니다...</span>
          </div>
        )}

        {ready && !message && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <input
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                autoComplete="new-password"
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="새 비밀번호 확인"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </>
        )}

        {/* 링크 만료 시 비밀번호 찾기로 유도 */}
        {error && (
          <button
            onClick={() => window.location.href = '/login'}
            style={{ width: '100%', marginTop: 12, background: 'none', color: '#0f2244', border: '1.5px solid #0f2244', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            로그인 페이지로 돌아가기
          </button>
        )}
      </div>
    </main>
  )
}
