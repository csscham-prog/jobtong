'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PaidResult from '@/components/PaidResult'

export default function Home() {
  const [step, setStep] = useState<'landing' | 'analyze' | 'result'>('landing')
  const [analyzeType, setAnalyzeType] = useState<'free' | 'paid'>('free')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false)

  // 앱 목록 — 새 앱 추가 시 여기에만 추가하면 됩니다
  const APP_LIST = [
    {
      id: 'jobtong',
      name: '잡통',
      emoji: '💼',
      tag: '자소서 검토',
      desc: '합격을 위한 정직한 조언',
      url: 'https://jobtong.vercel.app',
      color: '#e6a800',
      current: true,
    },
    {
      id: 'geultong',
      name: '글통',
      emoji: '✍️',
      tag: 'SNS 변환',
      desc: 'SNS 콘텐츠 자동 변환 서비스',
      url: 'https://geultong.vercel.app',
      color: '#8b9fff',
      current: false,
    },
  ]

  useEffect(() => {
    // 점검 모드 체크 (어드민은 제외)
    supabase.from('settings').select('value').eq('key', 'maintenance_mode').single()
      .then(({ data }) => { if (data?.value === 'true') setMaintenance(true) })

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const keepLogin = localStorage.getItem('jobtong-keep-login') === 'true'
      const sessionOnly = sessionStorage.getItem('jobtong-session-only') === 'true'
      if (session?.user && !keepLogin && !sessionOnly) {
        await supabase.auth.signOut()
        setUser(null); setAuthLoading(false); return
      }
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setUserProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setUserProfile(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setUserProfile(null); setStep('landing')
  }

  const handleStartAnalyze = () => {
    if (!user) { window.location.href = '/login'; return }
    setStep('analyze')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.txt')) { setError('TXT 파일만 업로드 가능합니다.'); return }
    setFileName(file.name); setError('')
    const reader = new FileReader()
    reader.onload = (ev) => { const text = ev.target?.result as string; if (text) setContent(text) }
    reader.readAsText(file, 'utf-8')
  }

  // 어떤 분석 타입인지 계산
  const getAnalyzeMode = (): 'login' | 'paid' | 'both' | 'free' | 'purchase' => {
    if (!user) return 'login'
    if ((userProfile?.paid_credits || 0) > 0) return 'paid'
    if (!userProfile?.free_trial_used) return 'both'
    return 'purchase'
  }

  const handleAnalyze = async (type: 'free' | 'paid') => {
    if (!content.trim()) { setError('자소서 내용을 입력해주세요.'); return }
    if (content.trim().length < 100) { setError('자소서를 100자 이상 입력해주세요.'); return }
    setError(''); setLoading(true); setAnalyzeType(type)
    try {
      // 로그인 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ company, position, content, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      setResult(data)
      setStep('result')

      // 크레딧 차감
      if (type === 'paid' && userProfile) {
        await supabase.from('profiles').update({
          paid_credits: (userProfile.paid_credits || 0) - 1,
          total_analyses: (userProfile.total_analyses || 0) + 1,
          free_trial_used: true,
        }).eq('id', user.id)
        fetchProfile(user.id)
      } else if (type === 'free' && userProfile) {
        await supabase.from('profiles').update({
          free_trial_used: true,
          total_analyses: (userProfile.total_analyses || 0) + 1,
        }).eq('id', user.id)
        fetchProfile(user.id)
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  // 점검 모드 화면 — 어드민은 통과
  if (maintenance && userProfile?.role !== 'admin') {
    return (
      <main style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#0f2244', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🔧</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.5px' }}>서버 점검 중입니다</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 8 }}>
            더 나은 서비스를 위해 잠시 점검 중입니다.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            불편을 드려 죄송합니다. 곧 다시 서비스됩니다.
          </p>
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1a3a6b 0%, #0f2244 100%)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#e6a800', borderRadius: '50%' }} />
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>J</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>잡통</span>
          </div>
        </div>
      </main>
    )
  }

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreLabel = (s: number) => s >= 80 ? '우수' : s >= 60 ? '보통' : '미흡'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTxt = (s: number) => s >= 80 ? '#065f46' : s >= 60 ? '#92400e' : '#991b1b'

  const Emblem = ({ size = 36 }: { size?: number }) => (
    <div style={{ width: size, height: size, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: size * 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: size * 0.08, right: size * 0.08, width: size * 0.22, height: size * 0.22, background: '#e6a800', borderRadius: '50%' }} />
      <span style={{ fontSize: size * 0.46, fontWeight: 900, color: '#fff', fontFamily: "'Pretendard', sans-serif" }}>J</span>
    </div>
  )

  const Logo = ({ dark = false }: { dark?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, whiteSpace: 'nowrap' }}>
      <Emblem size={36} />
      <span style={{ fontSize: 20, fontWeight: 800, color: dark ? '#fff' : '#0f2244', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>잡통</span>
    </div>
  )

  const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
  const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
  const headerInner: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }

  const Header = () => (
    <header style={headerStyle}>
      <div style={headerInner}>
        {/* 로고 + 앱 스위처 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' }}>
          <button onClick={() => setStep('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Logo /></button>

          {/* 앱 스위처 버튼 */}
          <button
            onClick={() => setAppSwitcherOpen(prev => !prev)}
            style={{ background: 'none', border: '1px solid #e5e3dc', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#999', fontSize: 15, flexShrink: 0 }}
            title="다른 서비스 보기"
          >
            ⊞
          </button>

          {/* 드롭다운 바깥 클릭 닫기 레이어 */}
          {appSwitcherOpen && (
            <div
              onClick={() => setAppSwitcherOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 150 }}
            />
          )}

          {/* 앱 스위처 드롭다운 */}
          {appSwitcherOpen && (
            <div style={{ position: 'absolute', top: 44, left: 0, zIndex: 151, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #ece9e1', padding: '10px', minWidth: 260 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', padding: '4px 8px 8px', margin: 0 }}>BARUN APPLICATION</p>
              {APP_LIST.map(app => (
                <button
                  key={app.id}
                  onClick={() => { if (!app.current) window.open(app.url, '_blank'); setAppSwitcherOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 10, border: app.current ? `1.5px solid ${app.color}` : '1.5px solid transparent', background: app.current ? `${app.color}12` : 'transparent', cursor: app.current ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 4 }}
                >
                  <span style={{ fontSize: 22 }}>{app.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f2244' }}>{app.name}</span>
                      {app.current && (
                        <span style={{ background: app.color, color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>현재</span>
                      )}
                      <span style={{ background: '#f0ede6', color: '#888', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{app.tag}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="jobtong-slogan" style={{ fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.3, textAlign: 'center' }}>
            <span style={{ color: '#0f2244' }}>합격을 위한 정직한 조언,&nbsp;</span>
            <span style={{ color: '#e6a800' }}>잡통의 바른 자소서 검토</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                {(userProfile?.paid_credits || 0) > 0 ? `잔여 ${userProfile.paid_credits}회` : !userProfile?.free_trial_used ? '무료 1회 남음' : ''}
              </span>
              <button onClick={handleStartAnalyze} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>분석 시작</button>
              <button onClick={() => window.location.href = '/mypage'} style={{ background: 'none', color: '#0f2244', border: '1px solid #0f2244', borderRadius: 10, padding: '10px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>내 기록</button>
              <button onClick={handleLogout} className="mobile-hide" style={{ background: 'none', color: '#aaa', border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>로그아웃</button>
            </>
          ) : (
            <>
              <button onClick={() => window.location.href = '/login'} style={{ background: 'none', color: '#0f2244', border: '1.5px solid #0f2244', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>로그인</button>
              <button onClick={handleStartAnalyze} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>무료 체험</button>
            </>
          )}
        </div>
      </div>
    </header>
  )

  // ── LANDING ──
  if (step === 'landing') {
    return (
      <main style={base}>
        <Header />
        <section style={{ background: 'linear-gradient(160deg, #0a1628 0%, #1a3a6b 60%, #152f58 100%)', color: '#fff', padding: '80px 24px 90px', position: 'relative' }}>

          {/* 장식 레이어 — div 기반 눈금자 + 돋보기 */}

          {/* 눈금자 상단 가로선 */}
          <div style={{ position: 'absolute', top: 28, left: '12%', right: '12%', height: '1px', background: 'rgba(184,217,238,0.28)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.4)' }} />
            <div style={{ position: 'absolute', right: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.4)' }} />
            <div style={{ position: 'absolute', left: '16%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '33%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '50%', top: '-5px', width: '1px', height: '11px', background: 'rgba(184,217,238,0.35)' }} />
            <div style={{ position: 'absolute', left: '66%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '83%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
          </div>

          {/* 눈금자 하단 가로선 */}
          <div style={{ position: 'absolute', bottom: 44, left: '16%', right: '16%', height: '1px', background: 'rgba(184,217,238,0.22)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', right: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', left: '25%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.22)' }} />
            <div style={{ position: 'absolute', left: '50%', top: '-5px', width: '1px', height: '11px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '75%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.22)' }} />
          </div>

          {/* 눈금자 좌측 세로선 */}
          <div style={{ position: 'absolute', left: '4%', top: '14%', bottom: '14%', width: '1px', background: 'rgba(184,217,238,0.22)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', top: '33%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '-5px', width: '11px', height: '1px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', top: '66%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
          </div>

          {/* 눈금자 우측 세로선 */}
          <div style={{ position: 'absolute', right: '4%', top: '14%', bottom: '14%', width: '1px', background: 'rgba(184,217,238,0.22)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', top: '33%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '-5px', width: '11px', height: '1px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', top: '66%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
          </div>

          {/* 돋보기 좌상단 */}
          <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 44, left: '7%', width: 80, height: 80, opacity: 0.24, pointerEvents: 'none' }} viewBox="0 0 80 80" fill="none">
            <circle cx="32" cy="32" r="22" stroke="#b8d9ee" strokeWidth="3.5" fill="none"/>
            <line x1="48" y1="48" x2="70" y2="70" stroke="#b8d9ee" strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="21" y1="32" x2="43" y2="32" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
            <line x1="32" y1="21" x2="32" y2="43" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* 돋보기 우상단 */}
          <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 36, right: '7%', width: 66, height: 66, opacity: 0.2, pointerEvents: 'none', transform: 'scaleX(-1)' }} viewBox="0 0 80 80" fill="none">
            <circle cx="32" cy="32" r="22" stroke="#b8d9ee" strokeWidth="3.5" fill="none"/>
            <line x1="48" y1="48" x2="70" y2="70" stroke="#b8d9ee" strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="21" y1="32" x2="43" y2="32" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
            <line x1="32" y1="21" x2="32" y2="43" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* 메인 카피 */}
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h1 className="hero-title" style={{ fontWeight: 900, lineHeight: 1.25, marginBottom: 28, letterSpacing: '-1.5px' }}>
              당신의 이야기를<br />
              <span style={{ color: '#f0c040' }}>더 특별하게.</span><br />
              잡통의 정밀 자소서 검토.
            </h1>
            <p style={{ fontSize: 19, color: '#b8d9ee', lineHeight: 1.85, marginBottom: 44 }}>
              전문가의 눈으로 문장을 다듬고,<br />합격을 위한 정직한 솔루션을 드립니다.
            </p>
            <button onClick={handleStartAnalyze} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '20px 52px', fontWeight: 800, fontSize: 20, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(230,168,0,0.3)', position: 'relative', zIndex: 1 }}>
              {!user ? '무료로 분석 시작하기 →' :
               (userProfile?.paid_credits || 0) > 0 ? '전체 분석 시작하기 →' :
               !userProfile?.free_trial_used ? '무료 분석 시작하기 →' :
               '분석 시작하기 →'}
            </button>
          </div>
        </section>

        <section style={{ background: '#fff', padding: '72px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#0f2244', marginBottom: 8, letterSpacing: '-0.5px' }}>단순한 교정을 넘어, 합격의 확신을 드리는 '마지막 한 문장'까지</h2>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 52 }}>"어떻게 써야 할지" 고민하는 시간을 "어떻게 합격할지" 확신하는 시간으로 바꿔드립니다.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                { icon: '🔍', title: '가감 없는 냉철한 분석', desc: '좋은 말만 나열하는 위로보다, 합격에 꼭 필요한 정직한 조언을 우선합니다. 면접관의 시선에서 당신의 자소서가 가진 약점을 숨김없이 짚어내어, 합격 가능성을 객관적으로 높여드립니다.' },
                { icon: '✏️', title: '스토리를 완성하는 문장 교정', desc: '모호한 표현은 선명하게, 평범한 경험은 특별하게 다듬습니다. 단순히 오타를 잡는 수준을 넘어, 당신의 진심이 인사담당자에게 바르게 전달되도록 문장 단위로 세밀하게 손봅니다.' },
                { icon: '✓', title: '전략적인 직무 타겟팅', desc: '모든 회사에 통하는 범용 자소서는 없습니다. 지원하시는 산업군과 포지션에서 요구하는 핵심 역량을 정확히 꿰뚫어, 당신의 커리어가 해당 직무의 정답처럼 보이도록 전략을 설계합니다.' },
              ].map(item => (
                <div key={item.title} style={{ background: '#f7f6f3', borderRadius: 16, padding: '36px 32px', border: '1px solid #e8e5dc' }}>
                  <div style={{ fontSize: 40, marginBottom: 20 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f2244', marginBottom: 14 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: '#444', lineHeight: 1.85 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: '#f7f6f3', padding: '72px 24px' }}>
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#0f2244', marginBottom: 8, letterSpacing: '-0.5px' }}>무료 체험 vs 전체 분석</h2>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 52 }}>전문 컨설턴트의 1/50 가격으로 정밀 피드백을</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #e8e5dc' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 12, letterSpacing: 1 }}>무료 체험</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#0f2244', marginBottom: 4 }}>₩0</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f0ede6' }}>지금 바로 체험</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[{ t: '종합 점수', ok: true }, { t: '전체 총평', ok: true }, { t: '핵심 문제 1가지', ok: true }, { t: '항목별 세부 점수', ok: false }, { t: '문장 단위 개선 제안', ok: false }, { t: '"이런 내용 추가하세요" 제안', ok: false }, { t: '잘 된 점 피드백', ok: false }, { t: '최종 종합 조언', ok: false }].map(item => (
                    <li key={item.t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: item.ok ? '#222' : '#bbb' }}>
                      <span style={{ fontWeight: 800, color: item.ok ? '#10b981' : '#ddd', fontSize: 16, flexShrink: 0 }}>{item.ok ? '✓' : '✗'}</span>{item.t}
                    </li>
                  ))}
                </ul>
                <button onClick={handleStartAnalyze} style={{ marginTop: 28, width: '100%', background: '#f7f6f3', color: '#0f2244', border: '1.5px solid #ddd', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기</button>
              </div>
              <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #e8e5dc' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 12, letterSpacing: 1 }}>1회 분석권</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#0f2244', marginBottom: 4 }}>₩2,900</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f0ede6' }}>1회 전체 분석</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['종합 점수', '전체 총평', '핵심 문제 1가지', '항목별 세부 점수', '문장 단위 개선 제안', '"이런 내용 추가하세요" 제안', '잘 된 점 피드백', '최종 종합 조언'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#222' }}><span style={{ fontWeight: 800, color: '#10b981', fontSize: 16, flexShrink: 0 }}>✓</span>{item}</li>
                  ))}
                </ul>
                <button onClick={() => window.location.href = '/payment?plan=plan_1'} style={{ marginTop: 28, width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>1회권 구매하기</button>
              </div>
              <div style={{ background: '#0f2244', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #0f2244', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#e6a800', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 18px', borderRadius: 20, whiteSpace: 'nowrap' }}>⭐ 추천</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: 1 }}>5회 분석권</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 4 }}>₩9,900</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1회당 ₩1,980 · 32% 할인</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['종합 점수', '전체 총평', '핵심 문제 1가지', '항목별 세부 점수', '문장 단위 개선 제안', '"이런 내용 추가하세요" 제안', '잘 된 점 피드백', '최종 종합 조언'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}><span style={{ fontWeight: 800, color: '#f0c040', fontSize: 16, flexShrink: 0 }}>✓</span>{item}</li>
                  ))}
                </ul>
                <button onClick={() => window.location.href = '/payment?plan=plan_5'} style={{ marginTop: 28, width: '100%', background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>5회권 구매하기</button>
              </div>
            </div>
          </div>
        </section>

        <section style={{ background: '#0f2244', padding: '72px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.5px' }}>
            {!user || !userProfile?.free_trial_used ? '지금 바로 무료로 체험해보세요' : '자소서 분석을 시작해보세요'}
          </h2>
          <p style={{ color: '#b8d9ee', fontSize: 16, marginBottom: 36, lineHeight: 1.8 }}>
            {!user || !userProfile?.free_trial_used ? '첫 분석은 무료입니다. 총평과 핵심 문제점을 바로 확인하세요.' : '합격을 위한 정직한 피드백을 바로 확인하세요.'}
          </p>
          <button onClick={handleStartAnalyze} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 44px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>
            {!user ? '무료로 분석 시작하기 →' :
             (userProfile?.paid_credits || 0) > 0 ? '전체 분석 시작하기 →' :
             !userProfile?.free_trial_used ? '무료 분석 시작하기 →' :
             '분석 시작하기 →'}
          </button>
        </section>

        <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  .jobtong-slogan { font-size: 28px; white-space: nowrap; }
  .hero-title { font-size: clamp(38px, 6vw, 64px); }
  @media (max-width: 768px) { .jobtong-slogan { display: none; } .hero-title { font-size: 28px; } }
`}</style>
        {/* 다른 서비스 섹션 */}
        <section style={{ background: '#f0ede6', padding: '56px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.12em', marginBottom: 10 }}>BARUN APPLICATION</p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f2244', margin: 0, letterSpacing: '-0.5px' }}>바른어플리케이션의 다른 서비스</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              {APP_LIST.filter(app => !app.current).map(app => (
                <div
                  key={app.id}
                  onClick={() => window.open(app.url, '_blank')}
                  style={{ background: '#fff', borderRadius: 20, padding: '28px 28px', border: `2px solid #e5e3dc`, cursor: 'pointer', width: 280, transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = app.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${app.color}22` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e3dc'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 32 }}>{app.emoji}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#0f2244' }}>{app.name}</span>
                        <span style={{ background: `${app.color}20`, color: app.color, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{app.tag}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 14px' }}>{app.desc}</p>
                  <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>{app.url.replace('https://', '')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer style={{ background: '#0a1628', color: 'rgba(184,217,238,0.5)', padding: '40px 24px', textAlign: 'center', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <Emblem size={28} /><span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>잡통</span>
          </div>
          <p>자소서 정밀 검토 서비스 · 문의: barunapplication@gmail.com</p>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 24 }}>
            <button onClick={() => window.location.href = '/privacy'} style={{ background: 'none', border: 'none', color: 'rgba(184,217,238,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>개인정보처리방침</button>
            <button onClick={() => window.location.href = '/terms'} style={{ background: 'none', border: 'none', color: 'rgba(184,217,238,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>이용약관</button>
          </div>
          <p style={{ marginTop: 12, color: 'rgba(184,217,238,0.3)', fontSize: 11 }}>© 2026 바른어플리케이션. All rights reserved.</p>
        </footer>
      </main>
    )
  }

  // ── ANALYZE ──
  if (step === 'analyze') {
    const mode = getAnalyzeMode()
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #ece9e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>✏️</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f2244', letterSpacing: '-0.5px' }}>자소서 분석 시작</h2>
            </div>
            <p style={{ color: '#555', fontSize: 15, marginBottom: 36, lineHeight: 1.8 }}>
              자소서를 직접 입력하거나 파일을 업로드해주세요.<br />즉시 분석하고 정직하게 피드백합니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>지원 회사</label>
                <p style={{ fontSize: 12, color: '#e6a800', fontWeight: 600, margin: '0 0 8px' }}>※ 지원 회사나 직무를 입력하면 더욱 정밀한 분석이 가능합니다.</p>
                <input type="text" style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="예: 삼성전자, 카카오, 현대자동차" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 8 }}>지원 직무</label>
                <input type="text" style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="예: 마케팅, 백엔드 개발, 영업관리" value={position} onChange={e => setPosition(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>자소서 내용 <span style={{ color: '#e63946' }}>*</span></label>
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #e5e3dc', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: 12, background: fileName ? '#f0fdf4' : '#faf9f7' }}>
                  <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  {fileName ? (
                    <><p style={{ fontSize: 14, fontWeight: 700, color: '#10b981', margin: 0 }}>✓ {fileName}</p><p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>파일이 업로드됐습니다. 아래에서 내용을 확인하거나 수정할 수 있어요.</p></>
                  ) : (
                    <><p style={{ fontSize: 14, fontWeight: 700, color: '#0f2244', margin: 0 }}>📄 TXT 파일 업로드</p><p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>클릭하여 업로드</p><p style={{ fontSize: 11, color: '#bbb', margin: '6px 0 0', lineHeight: 1.6 }}>워드/한글 → 다른 이름으로 저장 → 파일 형식: 일반 텍스트(.txt)</p></>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
                  <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>또는 직접 입력</span>
                  <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <textarea style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.8, boxSizing: 'border-box' }} rows={14} placeholder="자소서 내용을 여기에 직접 입력하거나 붙여넣어 주세요. (최소 100자 이상)" value={content} onChange={e => { setContent(e.target.value); if (fileName) setFileName('') }} />
                  <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: '#bbb' }}>{content.length}자</div>
                </div>
              </div>

              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: '14px 16px', fontSize: 14 }}>{error}</div>}

              {/* 분석 버튼 — 상태에 따라 다르게 */}
              {mode === 'paid' && (
                <div>
                  <button onClick={() => handleAnalyze('paid')} disabled={loading} style={{ width: '100%', background: loading ? '#ccc' : '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {loading ? <><svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" /><path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>정밀 분석 중입니다...</> : `전체 분석 시작하기 (잔여 ${userProfile?.paid_credits || 0}회) →`}
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>분석 후 1회 차감됩니다</p>
                </div>
              )}

              {mode === 'both' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => handleAnalyze('free')} disabled={loading} style={{ width: '100%', background: loading ? '#ccc' : '#f7f6f3', color: '#0f2244', border: '1.5px solid #ddd', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    무료 분석 (총평 + 핵심문제만)
                  </button>
                  <button onClick={() => window.location.href = '/payment'} disabled={loading} style={{ width: '100%', background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}>
                    전체 분석권 구매하기 →
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 4 }}>1회권 ₩2,900 / 5회권 ₩9,900</p>
                </div>
              )}

              {mode === 'free' && (
                <div>
                  <button onClick={() => handleAnalyze('free')} disabled={loading} style={{ width: '100%', background: loading ? '#ccc' : '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {loading ? <><svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" /><path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>정밀 분석 중입니다...</> : '무료 분석 시작하기 →'}
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>총평 + 핵심 문제 1가지 제공</p>
                </div>
              )}

              {mode === 'purchase' && (
                <div>
                  <button onClick={() => window.location.href = '/payment'} style={{ width: '100%', background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}>
                    전체 분석권 구매하기 (₩2,900~) →
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>무료 체험을 이미 사용하셨습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .jobtong-slogan { font-size: 28px; white-space: nowrap; } @media (max-width: 768px) { .jobtong-slogan { display: none; } }`}</style>
      </main>
    )
  }

  // ── RESULT ──
  if (step === 'result' && result) {
    const isPaid = analyzeType === 'paid'
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 분석 타입 표시 + PDF 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }} />
            <span style={{ background: isPaid ? '#0f2244' : '#f7f6f3', color: isPaid ? '#fff' : '#888', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20 }}>
              {isPaid ? '✓ 전체 분석 결과' : '무료 분석 결과'}
            </span>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              {isPaid && (
                <button
                  onClick={async () => {
                    const element = document.getElementById('pdf-all-content')
                    if (!element) return
                    if (!(window as any).html2pdf) {
                      const script = document.createElement('script')
                      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
                      document.head.appendChild(script)
                      await new Promise(resolve => { script.onload = resolve })
                    }
                    const filename = `잡통_자소서분석_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.pdf`
                    element.style.display = 'block'
                    await (window as any).html2pdf().set({
                      margin: [10, 10, 10, 10], filename,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true },
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    }).from(element).save()
                    element.style.display = 'none'
                  }}
                  style={{ background: '#fff', color: '#0f2244', border: '1.5px solid #0f2244', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📄 전체 결과 PDF 저장
                </button>
              )}
            </div>
          </div>

          {/* 종합 점수 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #ece9e1', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#aaa', fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>종합 점수</p>
            <div style={{ fontSize: 88, fontWeight: 900, color: getScoreColor(result.totalScore), lineHeight: 1, marginBottom: 8 }}>{result.totalScore}</div>
            <div style={{ fontSize: 16, color: '#bbb', marginBottom: 16 }}>/ 100점</div>
            <div style={{ display: 'inline-block', background: getScoreBg(result.totalScore), color: getScoreTxt(result.totalScore), fontSize: 14, fontWeight: 700, padding: '6px 20px', borderRadius: 20 }}>{getScoreLabel(result.totalScore)}</div>
          </div>

          {/* 총평 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', border: '1px solid #ece9e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🔍</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f2244' }}>총평</h3>
            </div>
            <p style={{ color: '#333', lineHeight: 1.85, fontSize: 15 }}>{result.summary}</p>
          </div>

          {/* 핵심 문제 */}
          <div style={{ background: '#fffbeb', borderRadius: 20, padding: '32px 36px', border: '2px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>
                핵심 문제
                {!isPaid && <span style={{ fontSize: 11, background: '#fde68a', color: '#92400e', padding: '2px 10px', borderRadius: 20, marginLeft: 8, fontWeight: 700 }}>무료 공개</span>}
              </h3>
            </div>
            <p style={{ color: '#444', lineHeight: 1.85, fontSize: 15 }}>{result.mainIssue}</p>
          </div>

          {/* 유료 전용 결과 — 프리미엄 컴포넌트 */}
          {isPaid && (
            <PaidResult
              result={result}
              company={company}
              position={position}
              onReanalyze={() => { setStep('analyze'); setResult(null); setContent(''); setFileName('') }}
            />
          )}

          {/* 무료 결과 → 결제 유도 */}
          {!isPaid && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', overflow: 'hidden', position: 'relative' }}>
              <div style={{ padding: '32px 36px', filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.45 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', marginBottom: 20 }}>📊 항목별 세부 점수</h3>
                {['논리성', '구체성', '직무 적합성', '표현력'].map(item => (
                  <div key={item} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: '#333' }}>{item}</span>
                      <span style={{ color: '#aaa' }}>-- 점</span>
                    </div>
                    <div style={{ height: 8, background: '#eee', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: '65%', background: '#0f2244', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.97) 30%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '40px 36px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f2244', marginBottom: 10 }}>전체 분석 결과 보기</h3>
                  <p style={{ color: '#555', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>항목별 점수, 문장 개선 제안, 최종 종합 조언까지<br />결제 후 바로 확인하세요.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => window.location.href = '/payment'} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>1회권 ₩2,900</button>
                    <button onClick={() => window.location.href = '/payment'} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>5회권 ₩9,900 ⭐</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isPaid && (
            <button onClick={() => { setStep('analyze'); setResult(null); setContent(''); setFileName('') }} style={{ width: '100%', background: '#fff', color: '#0f2244', border: '2px solid #0f2244', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              다른 자소서 분석하기
            </button>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .jobtong-slogan { font-size: 28px; white-space: nowrap; } @media (max-width: 768px) { .jobtong-slogan { display: none; } }`}</style>
      </main>
    )
  }

  return null
}
