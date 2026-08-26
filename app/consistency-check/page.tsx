'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { downloadElementAsPdf } from '@/lib/downloadPdf'

const RESUME_FILE_MAX_SIZE = 10 * 1024 * 1024 // 10MB
const RESUME_FILE_MAX_COUNT = 3

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

interface Gap {
  category: string
  missingIn: string
  issue: string
  suggestion: string
}

interface ConsistencyResult {
  matchScore: number
  summary: string
  strongAlignments: string[]
  gaps: Gap[]
  finalAdvice: string
  resumeFileWarning?: string
}

export default function ConsistencyCheckPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState(0)

  const [step, setStep] = useState<'form' | 'result'>('form')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [coverLetterContent, setCoverLetterContent] = useState('')
  const [coverLetterFileError, setCoverLetterFileError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [resumeFiles, setResumeFiles] = useState<{ base64: string; fileName: string; sizeLabel: string }[]>([])
  const [resumeFileError, setResumeFileError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [result, setResult] = useState<ConsistencyResult | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverLetterFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('consistency_credits')
        .eq('id', session.user.id)
        .single()
      setCredits(profile?.consistency_credits || 0)
      setAuthLoading(false)
    }
    init()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setResumeFileError('')

    if (resumeFiles.length + files.length > RESUME_FILE_MAX_COUNT) {
      setResumeFileError(`파일은 최대 ${RESUME_FILE_MAX_COUNT}개까지 업로드 가능합니다.`)
      e.target.value = ''
      return
    }

    files.forEach(file => {
      const lowerName = file.name.toLowerCase()
      if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.docx') && !lowerName.endsWith('.doc')) {
        setResumeFileError(`${file.name}: PDF 또는 DOCX 파일만 업로드 가능합니다.`)
        return
      }
      if (file.size > RESUME_FILE_MAX_SIZE) {
        setResumeFileError(`${file.name}: 파일 용량은 10MB 이하만 업로드 가능합니다.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (ev) => {
        const res = ev.target?.result as string
        const base64 = res.split(',')[1] || ''
        setResumeFiles(prev => [...prev, { base64, fileName: file.name, sizeLabel: formatFileSize(file.size) }])
      }
      reader.onerror = () => setResumeFileError(`${file.name}: 파일을 읽는 중 오류가 발생했습니다.`)
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  const removeResumeFile = (index: number) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index))
    setResumeFileError('')
  }

  const handleCoverLetterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverLetterFileError('')

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setCoverLetterFileError('TXT 파일만 업로드 가능합니다.')
      e.target.value = ''
      return
    }
    if (file.size > 1 * 1024 * 1024) {
      setCoverLetterFileError('파일 용량은 1MB 이하만 업로드 가능합니다.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || ''
      setCoverLetterContent(text.slice(0, 5000))
    }
    reader.onerror = () => setCoverLetterFileError('파일을 읽는 중 오류가 발생했습니다.')
    reader.readAsText(file, 'utf-8')

    e.target.value = ''
  }

  const validate = () => {
    if (!coverLetterContent.trim()) { setError('자소서 내용을 입력해주세요.'); return false }
    if (coverLetterContent.trim().length < 100) { setError('자소서를 100자 이상 입력해주세요.'); return false }
    if (coverLetterContent.trim().length > 5000) { setError('자소서는 5,000자 이하로 입력해주세요.'); return false }
    if (resumeFiles.length === 0) { setError('이력서 또는 경력기술서 파일을 1개 이상 업로드해주세요.'); return false }
    setError('')
    return true
  }

  const openConfirm = () => {
    if (!validate()) return
    setShowConfirmModal(true)
  }

  const handleAnalyze = async () => {
    setShowConfirmModal(false)
    setError(''); setLoading(true); setLoadingStage(0)

    const stageTimer1 = setTimeout(() => setLoadingStage(1), 4000)
    const stageTimer2 = setTimeout(() => setLoadingStage(2), 10000)
    const stageTimer3 = setTimeout(() => setLoadingStage(3), 18000)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/analyze-consistency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          company, position,
          coverLetterContent: coverLetterContent.trim(),
          resumeFiles: resumeFiles.map(f => ({ base64: f.base64, fileName: f.fileName })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      setResult(data)
      setStep('result')
      setCredits(prev => Math.max(prev - 1, 0))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      clearTimeout(stageTimer1); clearTimeout(stageTimer2); clearTimeout(stageTimer3)
    }
  }

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTxt = (s: number) => s >= 80 ? '#065f46' : s >= 60 ? '#92400e' : '#991b1b'
  const getScoreLabel = (s: number) => s >= 80 ? '매우 일관됨' : s >= 60 ? '부분 보완 필요' : '스토리 불일치'

  const handleDownloadPDF = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const filename = `잡통_정합성검증_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.pdf`
      await downloadElementAsPdf('consistency-pdf-content', filename)
    } finally {
      setIsDownloading(false)
    }
  }

  const loadingMessages = [
    '이력서와 자소서를 대조하고 있어요.',
    '두 문서에서 겹치는 경험을 찾고 있어요.',
    '누락되거나 어긋나는 부분을 정리하고 있어요.',
    '거의 다 됐어요. 최종 조언을 작성 중입니다.',
  ]

  const Header = () => (
    <header style={headerStyle}>
      <div style={headerInner}>
        <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
          잡통
        </button>
        <span style={{ fontSize: 13, color: '#aaa' }}>정합성 검증</span>
      </div>
    </header>
  )

  if (authLoading) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa', fontSize: 14 }}>불러오는 중...</p>
      </main>
    )
  }

  // ── 로딩 화면 ──
  if (loading) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: 40, height: 40, marginBottom: 20 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(15,34,68,0.15)" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="#0f2244" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 15, color: '#333', fontWeight: 700, marginBottom: 8 }}>{loadingMessages[loadingStage]}</p>
          <p style={{ fontSize: 13, color: '#aaa' }}>최대 1분 이상 소요될 수 있습니다.</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  // ── 결과 화면 ──
  if (step === 'result' && result) {
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleDownloadPDF} disabled={isDownloading}
              style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: isDownloading ? 'default' : 'pointer', opacity: isDownloading ? 0.6 : 1, fontFamily: 'inherit' }}>
              {isDownloading ? '⏳ 생성 중...' : '📄 PDF 저장'}
            </button>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '32px 36px', color: '#fff', textAlign: 'center' }}>
            <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>정합성 검증</span>
            <div style={{ fontSize: 64, fontWeight: 900, marginTop: 16, lineHeight: 1 }}>{result.matchScore}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>/ 100점</div>
            <div style={{ display: 'inline-block', background: getScoreBg(result.matchScore), color: getScoreTxt(result.matchScore), fontSize: 13, fontWeight: 700, padding: '5px 16px', borderRadius: 20 }}>
              {getScoreLabel(result.matchScore)}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: '0 0 14px' }}>📋 종합 총평</h3>
            <p style={{ color: '#333', lineHeight: 1.85, fontSize: 15, margin: 0 }}>{result.summary}</p>
          </div>

          {result.strongAlignments && result.strongAlignments.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: '0 0 16px' }}>⭐ 일관되게 잘 연결된 부분</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.strongAlignments.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: 14, color: '#065f46', lineHeight: 1.7, margin: 0 }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.gaps && result.gaps.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 4, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f2244', margin: 0 }}>보완이 필요한 부분</h2>
              </div>
              {result.gaps.map((gap, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '24px 28px', border: '1px solid #ece9e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ background: '#0f2244', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>#{i + 1}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2244' }}>{gap.category}</span>
                    <span style={{ fontSize: 11, background: '#fef2f2', color: '#991b1b', fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{gap.missingIn} 보완 필요</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, margin: '0 0 14px' }}>{gap.issue}</p>
                  <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderLeft: '4px solid #10b981', borderRadius: 10, padding: '14px 16px', fontSize: 14, color: '#064e3b', lineHeight: 1.8 }}>
                    {gap.suggestion}
                  </div>
                </div>
              ))}
            </>
          )}

          {result.finalAdvice && (
            <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '28px 32px' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>🎯 최종 조언</h3>
              <p style={{ color: '#b8d9ee', lineHeight: 1.9, fontSize: 15, margin: 0 }}>{result.finalAdvice}</p>
            </div>
          )}

          <button
            onClick={() => window.location.href = '/'}
            style={{ width: '100%', background: '#fff', color: '#0f2244', border: '2px solid #0f2244', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            잡통 홈으로
          </button>

          {/* 인쇄용 — 화면에는 안 보임 */}
          <div id="consistency-pdf-content" style={{ display: 'none' }}>
            <div style={{ fontFamily: "'Pretendard', sans-serif", padding: 20 }}>
              <div style={{ background: '#0f2244', color: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e6a800', marginBottom: 8 }}>정합성 검증 · {new Date().toLocaleDateString('ko-KR')}</div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>자소서 ↔ 이력서 정합성 검증 리포트</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  {company && position ? `${company} · ${position}` : company || position || '지원 직무 전반'}
                </p>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>{result.matchScore}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/ 100점 · {getScoreLabel(result.matchScore)}</span>
                </div>
              </div>

              <div style={{ marginBottom: 20, padding: '20px 24px', background: '#f7f6f3', borderRadius: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 10 }}>📋 종합 총평</h2>
                <p style={{ fontSize: 13, color: '#333', lineHeight: 1.8, margin: 0 }}>{result.summary}</p>
              </div>

              {result.strongAlignments && result.strongAlignments.length > 0 && (
                <div style={{ marginBottom: 20, padding: '20px 24px', background: '#ecfdf5', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#065f46', marginBottom: 12 }}>⭐ 일관되게 잘 연결된 부분</h2>
                  {result.strongAlignments.map((p, i) => (
                    <p key={i} style={{ fontSize: 13, color: '#065f46', margin: '0 0 8px', lineHeight: 1.7 }}>✓ {p}</p>
                  ))}
                </div>
              )}

              {result.gaps && result.gaps.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>⚠️ 보완이 필요한 부분</h2>
                  {result.gaps.map((gap, i) => (
                    <div key={i} style={{ padding: '18px 20px', background: '#fff', borderRadius: 12, marginBottom: 12, border: '1px solid #ece9e1' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2244', marginBottom: 8 }}>#{i + 1} {gap.category} ({gap.missingIn} 보완 필요)</div>
                      <p style={{ fontSize: 12, color: '#555', marginBottom: 10, lineHeight: 1.7 }}>{gap.issue}</p>
                      <div style={{ background: '#ecfdf5', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#064e3b' }}>{gap.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.finalAdvice && (
                <div style={{ padding: '20px 24px', background: '#0f2244', borderRadius: 12 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 10 }}>🎯 최종 조언</h2>
                  <p style={{ fontSize: 13, color: '#b8d9ee', lineHeight: 1.8, margin: 0 }}>{result.finalAdvice}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── 입력 폼 ──
  return (
    <main style={base}>
      <Header />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f2244', margin: '0 0 8px' }}>자소서 ↔ 이력서 정합성 검증</h1>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, margin: 0 }}>
            두 문서가 하나의 지원자 스토리로 일관되게 읽히는지 정밀 대조합니다. 개인정보처리방침에 따라 원문은 저장되지 않습니다.
          </p>
        </div>

        <div style={{ background: credits > 0 ? '#eef2ff' : '#fffbeb', border: `1px solid ${credits > 0 ? '#c7d2fe' : '#fde68a'}`, borderRadius: 14, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: credits > 0 ? '#4338ca' : '#92400e', fontWeight: 600 }}>
          {credits > 0
            ? `🎁 사용 가능한 무료 정합성 검증: ${credits}회`
            : '이력서·경력기술서와 자기소개서를 각각 1회 이상 정밀 분석(유료)하시면 정합성 검증이 무료로 열립니다.'}
        </div>

        {credits <= 0 ? (
          <button onClick={() => window.location.href = '/'} style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            잡통에서 정밀 분석 시작하기 →
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="지원 회사 (선택)" style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #e5e3dc', fontSize: 14, fontFamily: 'inherit' }} />
              <input value={position} onChange={e => setPosition(e.target.value)} placeholder="지원 직무 (선택)" style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #e5e3dc', fontSize: 14, fontFamily: 'inherit' }} />
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2244', marginBottom: 4 }}>📄 이력서 · 경력기술서 파일</div>
              <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 12px', lineHeight: 1.6 }}>
                이력서와 경력기술서가 별도 파일이라면 최대 3개까지 함께 첨부해주세요. 파일 안에 자기소개서 내용도 포함되어 있다면, 아래 자기소개서 칸에 그 부분만 복사해서 붙여넣어주세요.
              </p>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" multiple onChange={handleResumeFileUpload} style={{ display: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[0, 1, 2].map(slot => {
                  const f = resumeFiles[slot]
                  if (f) {
                    return (
                      <div key={slot} style={{ border: '1.5px solid #d1fae5', borderRadius: 12, padding: '14px 10px', background: '#f0fdf4', position: 'relative', textAlign: 'center', minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => removeResumeFile(slot)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#888', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                        <span style={{ fontSize: 20, marginBottom: 4 }}>📄</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px' }}>{f.fileName}</span>
                        <span style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{f.sizeLabel}</span>
                      </div>
                    )
                  }
                  return (
                    <div key={slot} onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #e5e3dc', borderRadius: 12, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', background: '#faf9f7', minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 22, color: '#bbb', marginBottom: 4 }}>+</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>파일 업로드</span>
                      <span style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>PDF · DOCX</span>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: 11, color: '#aaa', margin: '8px 0 0', textAlign: 'right' }}>{resumeFiles.length}/{RESUME_FILE_MAX_COUNT} · 파일당 최대 10MB</p>
              {resumeFileError && <p style={{ fontSize: 12, color: '#ef4444', margin: '8px 0 0' }}>{resumeFileError}</p>}
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2244' }}>✍️ 자기소개서</div>
                <button onClick={() => coverLetterFileInputRef.current?.click()} style={{ background: '#f7f6f3', color: '#555', border: '1px solid #e5e3dc', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  📎 TXT 파일 불러오기
                </button>
                <input ref={coverLetterFileInputRef} type="file" accept=".txt" onChange={handleCoverLetterFileUpload} style={{ display: 'none' }} />
              </div>
              <textarea
                value={coverLetterContent}
                onChange={e => setCoverLetterContent(e.target.value)}
                placeholder="자기소개서 내용을 붙여넣거나, TXT 파일을 불러와주세요 (100자 이상, 5,000자 이하)"
                style={{ width: '100%', minHeight: 180, padding: '14px', borderRadius: 12, border: '1.5px solid #e5e3dc', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              />
              {coverLetterFileError && <p style={{ fontSize: 12, color: '#ef4444', margin: '6px 0 0' }}>{coverLetterFileError}</p>}
              <p style={{ fontSize: 11, color: '#aaa', margin: '6px 0 0', textAlign: 'right' }}>{coverLetterContent.trim().length} / 5,000자</p>
            </div>

            {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</p>}

            <button onClick={openConfirm} style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
              정합성 검증 시작하기 (무료 이용 1회 사용)
            </button>
          </>
        )}
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 340, width: '100%' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: '0 0 10px' }}>정합성 검증을 시작할까요?</h3>
            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7, margin: '0 0 20px' }}>
              보유하신 무료 정합성 검증 1회가 사용됩니다. (잔여 {credits}회)
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, background: '#f7f6f3', color: '#888', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
              <button onClick={handleAnalyze} style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>시작하기</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
