'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleKakaoLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setMessage('이메일을 확인해주세요! 인증 링크를 보내드렸습니다.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      else window.location.href = '/'
    }
    setLoading(false)
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

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2244', marginBottom: 8, textAlign: 'center' }}>
          {isSignUp ? '회원가입' : '로그인'}
        </h2>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
          {isSignUp ? '가입 후 무료 체험 1회를 드립니다!' : '잡통에 오신 것을 환영합니다'}
        </p>

        {/* 카카오 로그인 */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          style={{ width: '100%', background: '#FEE500', color: '#191919', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
            <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.64 1.67 4.97 4.2 6.35L6.1 20.5c-.1.37.35.66.65.44L11 18.1c.33.03.66.05 1 .05 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
          </svg>
          카카오로 {isSignUp ? '가입' : '로그인'}하기
        </button>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
          <span style={{ fontSize: 12, color: '#aaa' }}>또는 이메일로</span>
          <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
        </div>

        {/* 이메일 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
            style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
            style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 12 }}>
            {message}
          </div>
        )}

        <button
          onClick={handleEmailAuth}
          disabled={loading}
          style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '처리 중...' : isSignUp ? '가입하기' : '로그인'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', marginTop: 20 }}>
          {isSignUp ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}
          {' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            style={{ color: '#0f2244', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}
          >
            {isSignUp ? '로그인' : '회원가입'}
          </button>
        </p>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        style={{ marginTop: 20, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}
      >
        ← 메인으로 돌아가기
      </button>
    </main>
  )
}
