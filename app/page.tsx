'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [step, setStep] = useState<'landing' | 'analyze' | 'result'>('landing')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')

    // txt는 브라우저에서 직접 읽기
    if (file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        if (text) setContent(text)
      }
      reader.readAsText(file, 'utf-8')
      return
    }

    // doc/docx는 서버 API로 파싱
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/parse-file', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '파일 읽기 오류')
      setContent(data.text)
    } catch (e: any) {
      setError(e.message)
      setFileName('')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!content.trim()) { setError('자소서 내용을 입력하거나 파일을 업로드해주세요.'); return }
    if (content.trim().length < 100) { setError('자소서를 100자 이상 입력해주세요.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, position, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      setResult(data)
      setStep('result')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreLabel = (score: number) => score >= 80 ? '우수' : score >= 60 ? '보통' : '미흡'
  const getScoreBg = (score: number) => score >= 80 ? '#ecfdf5' : score >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTextColor = (score: number) => score >= 80 ? '#065f46' : score >= 60 ? '#92400e' : '#991b1b'

  const Emblem = ({ size = 36 }: { size?: number }) => (
    <div style={{
      width: size, height: size,
      background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)',
      borderRadius: size * 0.25,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: size * 0.08, right: size * 0.08,
        width: size * 0.22, height: size * 0.22,
        background: '#e6a800', borderRadius: '50%',
      }} />
      <span style={{ fontSize: size * 0.46, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1, fontFamily: "'Pretendard', sans-serif" }}>J</span>
    </div>
  )

  const Logo = ({ dark = false }: { dark?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Emblem size={36} />
      <span style={{ fontSize: 20, fontWeight: 800, color: dark ? '#fff' : '#0f2244', letterSpacing: '-0.5px', fontFamily: "'Pretendard', sans-serif" }}>잡통</span>
    </div>
  )

  const base: React.CSSProperties = {
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    background: '#f7f6f3', minHeight: '100vh',
  }

  const headerStyle: React.CSSProperties = {
    background: '#fff', borderBottom: '1px solid #ece9e1',
    position: 'sticky', top: 0, zIndex: 50,
  }

  // ── LANDING ──
  if (step === 'landing') {
    return (
      <main style={base}>

        {/* 헤더 */}
        <header style={headerStyle}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

            {/* 로고 */}
            <Logo />

            {/* 슬로건 — 헤더 중앙 */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="jobtong-slogan" style={{ fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.3, textAlign: 'center' }}>
                <span style={{ color: '#0f2244' }}>합격을 위한 정직한 조언,&nbsp;</span>
                <span style={{ color: '#e6a800' }}>잡통의 바른 자소서 검토</span>
              </p>
            </div>

            {/* 버튼 */}
            <button onClick={() => setStep('analyze')} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
              무료 체험하기
            </button>
          </div>
        </header>

        {/* 히어로 */}
        <section style={{ background: 'linear-gradient(160deg, #0a1628 0%, #1a3a6b 60%, #152f58 100%)', color: '#fff', padding: '80px 24px 90px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <h1 className="hero-title" style={{ fontWeight: 900, lineHeight: 1.2, marginBottom: 28, letterSpacing: '-1.5px' }}>
              당신의 진심을<br />
              <span style={{ color: '#f0c040' }}>바르게 담아내는</span> 문장,<br />
              잡통이 함께 고민합니다.
            </h1>
            <p style={{ fontSize: 19, color: '#b8d9ee', lineHeight: 1.85, marginBottom: 44 }}>
              당신의 강점이 돋보이도록 문장을 다듬고,<br />
              부족한 부분은 정직하게 짚어드립니다.
            </p>
            <button onClick={() => setStep('analyze')} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '20px 52px', fontWeight: 800, fontSize: 20, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(230,168,0,0.3)' }}>
              무료로 분석 시작하기 →
            </button>
          </div>
        </section>

        {/* 서비스 특징 */}
        <section style={{ background: '#fff', padding: '72px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#0f2244', marginBottom: 8, letterSpacing: '-0.5px' }}>
              단순 분석을 넘어, 구체적인 처방까지
            </h2>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 52 }}>
              "이 문장을 이렇게 고치세요" — 실행 가능한 피드백을 드립니다
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                { icon: '🔍', title: '정직한 진단', desc: '좋은 점만 말하지 않습니다. 면접관이 실제로 느낄 수 있는 문제점을 솔직하게 짚어드립니다.' },
                { icon: '✏️', title: '문장 단위 개선 제안', desc: '"이 문장은 이렇게 고치세요", "이런 내용을 추가하세요" — 바로 적용할 수 있는 구체적 방향을 제시합니다.' },
                { icon: '✓', title: '직무 맞춤 분석', desc: '지원 회사와 직무를 고려해 해당 포지션에서 중요하게 보는 역량 중심으로 분석합니다.' },
              ].map((item) => (
                <div key={item.title} style={{ background: '#f7f6f3', borderRadius: 16, padding: '36px 32px', border: '1px solid #e8e5dc' }}>
                  <div style={{ fontSize: 40, marginBottom: 20 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f2244', marginBottom: 14 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: '#444', lineHeight: 1.85 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 가격 비교 3단 */}
        <section style={{ background: '#f7f6f3', padding: '72px 24px' }}>
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#0f2244', marginBottom: 8, letterSpacing: '-0.5px' }}>
              무료 체험 vs 전체 분석
            </h2>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 52 }}>
              전문 컨설턴트의 1/50 가격으로 AI 피드백을
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

              {/* 무료 */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #e8e5dc' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 12, letterSpacing: 1 }}>무료 체험</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#0f2244', marginBottom: 4 }}>₩0</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f0ede6' }}>지금 바로 체험</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { text: '종합 점수', ok: true },
                    { text: '전체 총평', ok: true },
                    { text: '핵심 문제 1가지', ok: true },
                    { text: '항목별 세부 점수', ok: false },
                    { text: '문장 단위 개선 제안', ok: false },
                    { text: '"이런 내용 추가하세요" 제안', ok: false },
                    { text: '잘 된 점 피드백', ok: false },
                    { text: '최종 종합 조언', ok: false },
                  ].map(item => (
                    <li key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: item.ok ? '#222' : '#bbb' }}>
                      <span style={{ fontWeight: 800, color: item.ok ? '#10b981' : '#ddd', fontSize: 16, flexShrink: 0 }}>{item.ok ? '✓' : '✗'}</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setStep('analyze')} style={{ marginTop: 28, width: '100%', background: '#f7f6f3', color: '#0f2244', border: '1.5px solid #ddd', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                  무료로 시작하기
                </button>
              </div>

              {/* 1회권 */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #e8e5dc' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 12, letterSpacing: 1 }}>1회 분석권</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#0f2244', marginBottom: 4 }}>₩2,900</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f0ede6' }}>1회 전체 분석</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['종합 점수', '전체 총평', '핵심 문제 1가지', '항목별 세부 점수', '문장 단위 개선 제안', '"이런 내용 추가하세요" 제안', '잘 된 점 피드백', '최종 종합 조언'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#222' }}>
                      <span style={{ fontWeight: 800, color: '#10b981', fontSize: 16, flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button style={{ marginTop: 28, width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                  1회권 구매하기
                </button>
              </div>

              {/* 5회권 */}
              <div style={{ background: '#0f2244', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #0f2244', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#e6a800', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 18px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  ⭐ 추천
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: 1 }}>5회 분석권</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 4 }}>₩9,900</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  1회당 ₩1,980 · 32% 할인
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['종합 점수', '전체 총평', '핵심 문제 1가지', '항목별 세부 점수', '문장 단위 개선 제안', '"이런 내용 추가하세요" 제안', '잘 된 점 피드백', '최종 종합 조언'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                      <span style={{ fontWeight: 800, color: '#f0c040', fontSize: 16, flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button style={{ marginTop: 28, width: '100%', background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                  5회권 구매하기
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: '#0f2244', padding: '72px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.5px' }}>
            지금 바로 무료로 체험해보세요
          </h2>
          <p style={{ color: '#b8d9ee', fontSize: 16, marginBottom: 36, lineHeight: 1.8 }}>
            첫 분석은 무료입니다. 총평과 핵심 문제점을 바로 확인하세요.
          </p>
          <button onClick={() => setStep('analyze')} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 44px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>
            무료 분석 시작하기 →
          </button>
        </section>

        <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  .jobtong-slogan { font-size: 40px; white-space: nowrap; }
  .hero-title { font-size: clamp(38px, 6vw, 64px); }
  @media (max-width: 768px) {
    .jobtong-slogan { display: none; }
    .hero-title { font-size: 28px; }
  }
`}</style>
        {/* 푸터 */}
        <footer style={{ background: '#0a1628', color: 'rgba(184,217,238,0.5)', padding: '40px 24px', textAlign: 'center', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <Emblem size={28} />
            <span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>잡통</span>
          </div>
          <p>AI 자소서 분석 서비스 · 문의: csscham@gmail.com</p>
          <p style={{ marginTop: 8, color: 'rgba(184,217,238,0.3)' }}>© 2026 잡통. All rights reserved.</p>
        </footer>
      </main>
    )
  }

  // ── ANALYZE ──
  if (step === 'analyze') {
    return (
      <main style={base}>
        <header style={headerStyle}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <button onClick={() => setStep('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Logo />
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="jobtong-slogan" style={{ fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.3, textAlign: 'center' }}>
                <span style={{ color: '#0f2244' }}>합격을 위한 정직한 조언,&nbsp;</span>
                <span style={{ color: '#e6a800' }}>잡통의 바른 자소서 검토</span>
              </p>
            </div>
            <div style={{ width: 120, flexShrink: 0 }} />
          </div>
        </header>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #ece9e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>✏️</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f2244', letterSpacing: '-0.5px' }}>자소서 분석 시작</h2>
            </div>
            <p style={{ color: '#555', fontSize: 15, marginBottom: 36, lineHeight: 1.8 }}>
              자소서를 직접 입력하거나 파일을 업로드해주세요.<br />
              AI가 즉시 분석하고 정직하게 피드백합니다.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 8 }}>지원 회사 <span style={{ color: '#aaa', fontWeight: 400 }}>(선택)</span></label>
                <input type="text" style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="예: 삼성전자, 카카오, 현대자동차" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 8 }}>지원 직무 <span style={{ color: '#aaa', fontWeight: 400 }}>(선택)</span></label>
                <input type="text" style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="예: 마케팅, 백엔드 개발, 영업관리" value={position} onChange={e => setPosition(e.target.value)} />
              </div>

              {/* 자소서 입력 — 탭 방식 */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>
                  자소서 내용 <span style={{ color: '#e63946' }}>*</span>
                </label>

                {/* 파일 업로드 버튼 */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed #e5e3dc', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: 12, background: fileName ? '#f0fdf4' : '#faf9f7', transition: 'all 0.2s' }}
                >
                  <input ref={fileInputRef} type="file" accept=".txt,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  {fileName ? (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#10b981', margin: 0 }}>✓ {fileName}</p>
                      <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>파일이 업로드됐습니다. 아래에서 내용을 확인하거나 수정할 수 있어요.</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f2244', margin: 0 }}>파일 업로드</p>
                      <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>TXT, DOC, DOCX 파일 지원 · 클릭하여 업로드</p>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
                  <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>또는 직접 입력</span>
                  <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.8, boxSizing: 'border-box' }}
                    rows={14}
                    placeholder="자소서 내용을 여기에 직접 입력하거나 붙여넣어 주세요. (최소 100자 이상)"
                    value={content}
                    onChange={e => { setContent(e.target.value); if (e.target.value !== content) setFileName('') }}
                  />
                  <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: '#bbb' }}>
                    {content.length}자
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: '14px 16px', fontSize: 14 }}>{error}</div>
              )}

              <button onClick={handleAnalyze} disabled={loading} style={{ width: '100%', background: loading ? '#ccc' : '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {loading ? (
                  <><svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" /><path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>AI가 분석 중입니다...</>
                ) : 'AI 분석 시작하기 →'}
              </button>

              <p style={{ textAlign: 'center', color: '#888', fontSize: 13, lineHeight: 1.7 }}>
                무료 체험 시 총평과 핵심 문제 1가지를 제공합니다.<br />
                전체 분석은 1회권(₩2,900) 또는 5회권(₩9,900)으로 확인하세요.
              </p>
            </div>
          </div>
        </div>
        <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  .jobtong-slogan { font-size: 40px; white-space: nowrap; }
  .hero-title { font-size: clamp(38px, 6vw, 64px); }
  @media (max-width: 768px) {
    .jobtong-slogan { display: none; }
    .hero-title { font-size: 28px; }
  }
`}</style>
      </main>
    )
  }

  // ── RESULT ──
  if (step === 'result' && result) {
    return (
      <main style={base}>
        <header style={headerStyle}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <button onClick={() => setStep('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Logo />
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="jobtong-slogan" style={{ fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.3, textAlign: 'center' }}>
                <span style={{ color: '#0f2244' }}>합격을 위한 정직한 조언,&nbsp;</span>
                <span style={{ color: '#e6a800' }}>잡통의 바른 자소서 검토</span>
              </p>
            </div>
            <button onClick={() => { setStep('analyze'); setResult(null) }} style={{ fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>다시 분석하기</button>
          </div>
        </header>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 종합 점수 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #ece9e1', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#aaa', fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>종합 점수</p>
            <div style={{ fontSize: 88, fontWeight: 900, color: getScoreColor(result.totalScore), lineHeight: 1, marginBottom: 8 }}>{result.totalScore}</div>
            <div style={{ fontSize: 16, color: '#bbb', marginBottom: 16 }}>/ 100점</div>
            <div style={{ display: 'inline-block', background: getScoreBg(result.totalScore), color: getScoreTextColor(result.totalScore), fontSize: 14, fontWeight: 700, padding: '6px 20px', borderRadius: 20 }}>
              {getScoreLabel(result.totalScore)}
            </div>
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
                <span style={{ fontSize: 11, background: '#fde68a', color: '#92400e', padding: '2px 10px', borderRadius: 20, marginLeft: 8, fontWeight: 700 }}>무료 공개</span>
              </h3>
            </div>
            <p style={{ color: '#444', lineHeight: 1.85, fontSize: 15 }}>{result.mainIssue}</p>
          </div>

          {/* 페이월 */}
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
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', marginTop: 28, marginBottom: 16 }}>✏️ 문장 개선 제안</h3>
              <div style={{ background: '#f7f6f3', borderRadius: 12, padding: '20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 8 }}>지원동기</div>
                <div style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>이 부분은 지원 이유가 명확하지 않습니다.</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e6a800', marginBottom: 6 }}>💡 이렇게 고치세요</div>
                <div style={{ fontSize: 14, color: '#333' }}>구체적인 경험과 수치를 활용하여 작성하면...</div>
              </div>
            </div>

            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.97) 30%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '40px 36px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f2244', marginBottom: 10 }}>전체 분석 결과 보기</h3>
                <p style={{ color: '#555', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
                  항목별 세부 점수, 문장 단위 개선 제안,<br />
                  "이런 내용 추가하세요" 제안까지<br />
                  결제 후 바로 확인하세요.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>1회권 ₩2,900</button>
                  <button style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>5회권 ₩9,900 ⭐</button>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => { setStep('analyze'); setResult(null) }} style={{ width: '100%', background: '#fff', color: '#0f2244', border: '2px solid #0f2244', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            다른 자소서 분석하기
          </button>
        </div>
        <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  .jobtong-slogan { font-size: 40px; white-space: nowrap; }
  .hero-title { font-size: clamp(38px, 6vw, 64px); }
  @media (max-width: 768px) {
    .jobtong-slogan { display: none; }
    .hero-title { font-size: 28px; }
  }
`}</style>
      </main>
    )
  }

  return null
}
