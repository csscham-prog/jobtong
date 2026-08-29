'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const RESUME_FILE_MAX_SIZE = 10 * 1024 * 1024
const RESUME_FILE_MAX_COUNT = 3

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

interface QuestionFeedback {
  question: string
  answer: string
  score: number
  strengths: string
  issues: string[]
  improvement: string
}

interface AnalysisResult {
  overallScore: number
  overallSummary: string
  repeatedPatterns: string[]
  questionFeedback: QuestionFeedback[]
  finalAdvice: string
}

const GUIDELINES = [
  '크레딧은 시작하는 순간 차감돼요. 중간에 그만두셔도 복구되지 않아요.',
  '각 질문마다 녹음 후 "끝내기"를 누르면 다음 질문으로 넘어가고, 이전 질문으로 돌아갈 수 없어요.',
  '실전처럼 즉흥으로 답변해주세요. 미리 적어두고 읽거나 오래 생각한 뒤 정리된 문장으로 말하면 연습 효과가 크게 떨어져요.',
  '브라우저에서 마이크 권한 요청 팝업이 뜨면 반드시 "허용"을 눌러주세요. 허용하지 않으면 녹음 자체가 되지 않아 이 기능을 이용할 수 없어요.',
  '음성 인식 기능은 발음이나 주변 소음에 따라 일부 단어가 다르게 인식될 수 있어요. 인식된 텍스트를 꼭 확인하고 필요하면 직접 수정해주세요.',
  '음성 인식 정확도를 위해 주변 소음이 적은 환경을 추천드리고, 반드시 크롬 브라우저에서 실행해주세요.',
  '중간에 창을 닫거나 페이지를 벗어나면 처음부터 다시 시작해야 해요. 진행 상황은 저장되지 않아요.',
]

export default function MockInterviewPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [credits, setCredits] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  const [step, setStep] = useState<'notice' | 'form' | 'interview' | 'summary' | 'result'>('notice')
  const [agreed, setAgreed] = useState(false)

  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [companyVision, setCompanyVision] = useState('')
  const [coverLetterContent, setCoverLetterContent] = useState('')
  const [coverLetterFileError, setCoverLetterFileError] = useState('')
  const [resumeFiles, setResumeFiles] = useState<{ base64: string; fileName: string; sizeLabel: string }[]>([])
  const [resumeFileError, setResumeFileError] = useState('')
  const [jobPostingFile, setJobPostingFile] = useState<{ base64: string; fileName: string; sizeLabel: string } | null>(null)
  const [jobPostingFileError, setJobPostingFileError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverLetterFileInputRef = useRef<HTMLInputElement>(null)
  const jobPostingFileInputRef = useRef<HTMLInputElement>(null)

  // 인터뷰 진행 상태
  const [sessionId, setSessionId] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const recordingRef = useRef(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [showAnswerConfirm, setShowAnswerConfirm] = useState(false)
  const [editableAnswer, setEditableAnswer] = useState('')
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')

  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('paid_credits, role')
        .eq('id', session.user.id)
        .single()
      setCredits(profile?.paid_credits || 0)
      setIsAdmin(profile?.role === 'admin')
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

  const handleJobPostingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setJobPostingFileError('')
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setJobPostingFileError('PDF 파일만 업로드 가능합니다.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setJobPostingFileError('파일 용량은 5MB 이하만 업로드 가능합니다.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const res = ev.target?.result as string
      const base64 = res.split(',')[1] || ''
      setJobPostingFile({ base64, fileName: file.name, sizeLabel: formatFileSize(file.size) })
    }
    reader.onerror = () => setJobPostingFileError('파일을 읽는 중 오류가 발생했습니다.')
    reader.readAsDataURL(file)
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

  const handleStartInterview = async () => {
    setShowConfirmModal(false)
    setError('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/mock-interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          company, position,
          companyVision: companyVision.trim(),
          jobPostingFile: jobPostingFile ? { base64: jobPostingFile.base64, fileName: jobPostingFile.fileName } : null,
          coverLetterContent: coverLetterContent.trim(),
          resumeFiles: resumeFiles.map(f => ({ base64: f.base64, fileName: f.fileName })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.')

      setSessionId(data.sessionId)
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(''))
      setQIndex(0)
      setCredits(prev => Math.max(prev - 1, 0))
      setStep('interview')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── 음성 인식 ──
  const getRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null
    const rec = new SpeechRecognition()
    rec.lang = 'ko-KR'
    rec.continuous = true
    rec.interimResults = true
    return rec
  }

  const startRecording = () => {
    const rec = getRecognition()
    if (!rec) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저를 사용해주세요.')
      return
    }
    finalTranscriptRef.current = ''
    setLiveTranscript('')
    rec.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscriptRef.current += chunk + ' '
        else interim += chunk
      }
      setLiveTranscript((finalTranscriptRef.current + interim).trim())
    }
    rec.onerror = (event: any) => {
      // 무음(no-speech) 등 일시적 오류는 onend에서 자동 재시작되므로 무시
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('음성 인식 오류:', event.error)
      }
    }
    rec.onend = () => {
      if (recognitionRef.current === rec && recordingRef.current) {
        try { rec.start() } catch (e) {}
      }
    }
    recognitionRef.current = rec
    recordingRef.current = true
    setRecording(true)
    rec.start()
  }

  const stopRecordingInternal = () => {
    recordingRef.current = false
    if (recognitionRef.current) {
      const rec = recognitionRef.current
      recognitionRef.current = null
      try { rec.stop() } catch (e) {}
    }
    setRecording(false)
  }

  const handleRetryRecording = () => {
    stopRecordingInternal()
    finalTranscriptRef.current = ''
    setLiveTranscript('')
    setTimeout(startRecording, 200)
  }

  const handleFinishRecording = () => {
    stopRecordingInternal()
    setEditableAnswer(liveTranscript.trim())
    setShowAnswerConfirm(true)
  }

  const handleConfirmAnswer = () => {
    const updated = [...answers]
    updated[qIndex] = editableAnswer.trim()
    setAnswers(updated)
    setShowAnswerConfirm(false)
    setLiveTranscript('')
    finalTranscriptRef.current = ''

    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1)
    } else {
      setStep('summary')
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/mock-interview/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      setResult(data)
      setStep('result')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'

  const Header = () => (
    <header style={headerStyle}>
      <div style={headerInner}>
        <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
          잡통
        </button>
        <span style={{ fontSize: 13, color: '#666' }}>모의 면접</span>
      </div>
    </header>
  )

  if (authLoading) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontSize: 14 }}>불러오는 중...</p>
      </main>
    )
  }

  // ── 질문 생성 중 로딩 (form 화면에서 "시작하기" 누른 직후) ──
  if (loading) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: 40, height: 40, marginBottom: 20 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(15,34,68,0.15)" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="#0f2244" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 15, color: '#333', fontWeight: 700, marginBottom: 8 }}>서류를 분석해서 질문을 만들고 있어요.</p>
          <p style={{ fontSize: 13, color: '#aaa' }}>최대 1분 이상 소요될 수 있습니다.</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  // ── 답변 분석 중 로딩 (summary 화면에서 "분석하기" 누른 직후) ──
  if (analyzing) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: 40, height: 40, marginBottom: 20 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(15,34,68,0.15)" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="#0f2244" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 15, color: '#333', fontWeight: 700, marginBottom: 8 }}>답변 5개를 종합해서 분석하고 있어요.</p>
          <p style={{ fontSize: 13, color: '#aaa' }}>최대 1분 이상 소요될 수 있습니다.</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    )
  }

  // ── 1. 안내 화면 ──
  if (step === 'notice') {
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f2244', margin: '0 0 10px' }}>모의 면접</h1>
          <p style={{ fontSize: 16, color: '#444', lineHeight: 1.7, margin: '0 0 28px' }}>
            서류 기반 맞춤 질문 5개에 실제로 답변하고, AI에게 정밀 피드백을 받아보세요.
          </p>

          {!speechSupported && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 16, padding: '18px 22px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🚫</span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#991b1b', margin: '0 0 4px' }}>이 브라우저는 음성 인식을 지원하지 않아요</p>
                <p style={{ fontSize: 14, color: '#7f1d1d', margin: 0, lineHeight: 1.7 }}>
                  모의 면접은 브라우저의 음성 인식 기능을 사용해요. 지금 접속하신 브라우저에서는 이 기능이 지원되지 않아 답변을 녹음할 수 없어요. <strong>크롬(Chrome)</strong> 브라우저로 다시 접속해주세요.
                </p>
              </div>
            </div>
          )}

          {/* 진행 절차 도식 */}
          <div style={{ background: '#0f2244', borderRadius: 16, padding: '24px 20px', marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[
                { icon: '📄', title: '서류 입력', desc: '이력서·자소서\n+선택 정보' },
                { icon: '🎬', title: '시작하기', desc: '이 시점에\n크레딧 차감', accent: true },
                { icon: '🤖', title: '질문 5개 생성', desc: '서류 기반\n맞춤 질문' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: s.accent ? 'rgba(230,168,0,0.1)' : 'rgba(255,255,255,0.06)', border: s.accent ? '1px solid rgba(230,168,0,0.3)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.accent ? '#f0c040' : '#fff', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, color: s.accent ? 'rgba(240,192,64,0.8)' : 'rgba(255,255,255,0.65)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: '2px 0' }}>↓</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { icon: '🎤', title: '답변 녹음 ×5', desc: '질문마다\n녹음→확인→다음' },
                { icon: '🧠', title: '분석하기', desc: '5개 답변\n종합 분석' },
                { icon: '📋', title: '결과 확인', desc: '피드백\n리포트', accent: true },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: s.accent ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)', border: s.accent ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '16px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.accent ? '#6ee7b7' : '#fff', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, color: s.accent ? 'rgba(110,231,183,0.8)' : 'rgba(255,255,255,0.65)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 주의사항 */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '20px 22px', marginBottom: 20 }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: '#92400e', margin: '0 0 14px' }}>⚠️ 시작하기 전에 꼭 확인해주세요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {GUIDELINES.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#92400e', flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                  <p style={{ fontSize: 15, color: '#78350f', lineHeight: 1.8, margin: 0 }}>{g}</p>
                </div>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 16, color: '#222', fontWeight: 600 }}>위 내용을 모두 확인했으며 동의합니다</span>
          </label>

          <button
            onClick={() => agreed && speechSupported && setStep('form')}
            disabled={!agreed || !speechSupported}
            style={{ width: '100%', background: (agreed && speechSupported) ? '#0f2244' : '#ccc', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 16, cursor: (agreed && speechSupported) ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >
            {speechSupported ? '다음' : '크롬 브라우저로 접속해주세요'}
          </button>
        </div>
      </main>
    )
  }

  // ── 2. 입력 폼 ──
  if (step === 'form') {
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f2244', margin: '0 0 20px' }}>서류 입력</h1>

          <div style={{ background: (credits > 0 || isAdmin) ? '#eef2ff' : '#fffbeb', border: `1px solid ${(credits > 0 || isAdmin) ? '#c7d2fe' : '#fde68a'}`, borderRadius: 14, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: (credits > 0 || isAdmin) ? '#3730a3' : '#78350f', fontWeight: 700 }}>
            {isAdmin ? `관리자 계정 — 크레딧 소모 없이 테스트 가능 (잔여 분석권 ${credits}회)` : credits > 0 ? `잔여 분석권: ${credits}회` : '보유한 분석권이 없습니다.'}
          </div>

          {(credits <= 0 && !isAdmin) ? (
            <button onClick={() => window.location.href = '/'} style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              잡통 홈으로
            </button>
          ) : (
            <>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '20px', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2244', marginBottom: 4 }}>📄 이력서 · 경력기술서 파일 <span style={{ color: '#ef4444' }}>*</span></div>
                <p style={{ fontSize: 12, color: '#555', margin: '0 0 12px' }}>PDF · DOCX, 최대 3개, 파일당 10MB</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" multiple onChange={handleResumeFileUpload} style={{ display: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[0, 1, 2].map(slot => {
                    const f = resumeFiles[slot]
                    if (f) {
                      return (
                        <div key={slot} style={{ border: '1.5px solid #d1fae5', borderRadius: 12, padding: '14px 10px', background: '#f0fdf4', position: 'relative', textAlign: 'center', minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <button onClick={() => removeResumeFile(slot)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#555', cursor: 'pointer', fontSize: 12 }}>✕</button>
                          <span style={{ fontSize: 20, marginBottom: 4 }}>📄</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 4px' }}>{f.fileName}</span>
                          <span style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{f.sizeLabel}</span>
                        </div>
                      )
                    }
                    return (
                      <div key={slot} onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #ccc', borderRadius: 12, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', background: '#faf9f7', minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 22, color: '#999', marginBottom: 4 }}>+</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#444' }}>파일 업로드</span>
                      </div>
                    )
                  })}
                </div>
                {resumeFileError && <p style={{ fontSize: 12, color: '#ef4444', margin: '8px 0 0' }}>{resumeFileError}</p>}
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2244' }}>✍️ 자기소개서 <span style={{ color: '#ef4444' }}>*</span></div>
                  <button onClick={() => coverLetterFileInputRef.current?.click()} style={{ background: '#f7f6f3', color: '#333', border: '1px solid #ccc', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    📎 TXT 파일 불러오기
                  </button>
                  <input ref={coverLetterFileInputRef} type="file" accept=".txt" onChange={handleCoverLetterFileUpload} style={{ display: 'none' }} />
                </div>
                <textarea
                  value={coverLetterContent}
                  onChange={e => setCoverLetterContent(e.target.value)}
                  placeholder="자기소개서 내용을 붙여넣거나, TXT 파일을 불러와주세요 (100자 이상, 5,000자 이하)"
                  style={{ width: '100%', minHeight: 160, padding: '14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', color: '#222' }}
                />
                {coverLetterFileError && <p style={{ fontSize: 12, color: '#ef4444', margin: '6px 0 0' }}>{coverLetterFileError}</p>}
                <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0', textAlign: 'right' }}>{coverLetterContent.trim().length} / 5,000자</p>
              </div>

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '20px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2244', marginBottom: 4 }}>➕ 추가 정보 (선택)</div>
                <p style={{ fontSize: 12, color: '#555', margin: '0 0 14px' }}>입력하실수록 질문과 피드백이 더 정교해져요.</p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input value={company} onChange={e => setCompany(e.target.value)} placeholder="회사명" style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222' }} />
                  <input value={position} onChange={e => setPosition(e.target.value)} placeholder="채용 직무" style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222' }} />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#333', margin: '0 0 6px' }}>회사의 비전·인재상</p>
                  <textarea
                    value={companyVision}
                    onChange={e => setCompanyVision(e.target.value.slice(0, 1000))}
                    placeholder="회사 홈페이지 등에서 확인한 비전·인재상을 붙여넣어주세요"
                    style={{ width: '100%', minHeight: 60, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', color: '#222' }}
                  />
                </div>

                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#333', margin: '0 0 6px' }}>채용공고 (PDF)</p>
                  <input ref={jobPostingFileInputRef} type="file" accept=".pdf" onChange={handleJobPostingFileUpload} style={{ display: 'none' }} />
                  {jobPostingFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1.5px solid #d1fae5', borderRadius: 12, padding: '12px 14px' }}>
                      <span style={{ fontSize: 13, color: '#065f46', fontWeight: 600 }}>📄 {jobPostingFile.fileName} · {jobPostingFile.sizeLabel}</span>
                      <button onClick={() => setJobPostingFile(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                  ) : (
                    <div onClick={() => jobPostingFileInputRef.current?.click()} style={{ border: '2px dashed #ccc', borderRadius: 12, padding: '18px', textAlign: 'center', cursor: 'pointer', background: '#faf9f7' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>+ 채용공고 PDF 업로드</span>
                    </div>
                  )}
                  {jobPostingFileError && <p style={{ fontSize: 12, color: '#ef4444', margin: '6px 0 0' }}>{jobPostingFileError}</p>}
                </div>
              </div>

              {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</p>}

              <button onClick={openConfirm} style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
                모의 면접 시작 (분석권 1회 사용)
              </button>
            </>
          )}
        </div>

        {showConfirmModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 360, width: '100%' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: '0 0 14px' }}>이대로 진행할까요?</h3>
              <div style={{ background: '#f7f6f3', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13, color: '#333', lineHeight: 1.9 }}>
                <p style={{ margin: 0 }}>📄 이력서 파일 {resumeFiles.length}개</p>
                <p style={{ margin: 0 }}>✍️ 자소서 {coverLetterContent.trim().length}자</p>
                {company && <p style={{ margin: 0 }}>🏢 {company}{position ? ` · ${position}` : ''}</p>}
                {jobPostingFile && <p style={{ margin: 0 }}>📋 채용공고 첨부됨</p>}
              </div>
              <p style={{ fontSize: 13, color: '#991b1b', fontWeight: 700, margin: '0 0 20px' }}>
                {isAdmin ? '관리자 계정은 크레딧이 차감되지 않아요.' : `진행 시 분석권 1회가 즉시 차감돼요. (잔여 ${credits}회)`}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, background: '#f7f6f3', color: '#444', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>다시 확인</button>
                <button onClick={handleStartInterview} disabled={loading} style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? '준비 중...' : '시작하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ── 3. 인터뷰 진행 ──
  if (step === 'interview') {
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < qIndex ? '#10b981' : i === qIndex ? '#0f2244' : '#e5e3dc' }} />
            ))}
          </div>

          <p style={{ fontSize: 13, color: '#666', fontWeight: 700, margin: '0 0 10px' }}>질문 {qIndex + 1} / {questions.length}</p>
          <div style={{ background: '#0f2244', borderRadius: 16, padding: '28px 26px', marginBottom: 24 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.6, margin: 0 }}>{questions[qIndex]}</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '20px', minHeight: 140, marginBottom: 20 }}>
            {recording ? (
              <p style={{ fontSize: 15, color: '#222', lineHeight: 1.8, margin: 0 }}>{liveTranscript || <span style={{ color: '#aaa' }}>말씀해주세요...</span>}</p>
            ) : (
              <p style={{ fontSize: 14, color: '#999', margin: 0 }}>"녹음 시작"을 누르고 답변해주세요.</p>
            )}
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</p>}

          {!recording ? (
            <button onClick={startRecording} style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
              🎙️ 녹음 시작
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleRetryRecording} style={{ flex: 1, background: '#fff', color: '#0f2244', border: '2px solid #0f2244', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                🔄 다시 녹음하기
              </button>
              <button onClick={handleFinishRecording} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⏹️ 끝내기
              </button>
            </div>
          )}
        </div>

        {showAnswerConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 440, width: '100%' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f2244', margin: '0 0 6px' }}>답변 내용을 확인해주세요</h3>
              <p style={{ fontSize: 12, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>
                음성 인식은 완벽하지 않아요. 잘못 인식된 부분이 있으면 직접 수정해주세요.
              </p>
              <textarea
                value={editableAnswer}
                onChange={e => setEditableAnswer(e.target.value)}
                style={{ width: '100%', minHeight: 140, padding: '14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', color: '#222', marginBottom: 18 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowAnswerConfirm(false); startRecording() }} style={{ flex: 1, background: '#f7f6f3', color: '#444', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  다시 녹음
                </button>
                <button onClick={handleConfirmAnswer} style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {qIndex < questions.length - 1 ? '다음 질문으로' : '마지막 질문 완료'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ── 4. 요약 (분석 전) ──
  if (step === 'summary') {
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f2244', margin: '0 0 8px' }}>답변 완료</h1>
          <p style={{ fontSize: 14, color: '#444', margin: '0 0 24px' }}>5개 질문에 모두 답변하셨어요. 분석을 시작하면 결과를 확인할 수 있어요.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {questions.map((q, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #ece9e1', padding: '16px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f2244', margin: '0 0 8px' }}>{i + 1}. {q}</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>{answers[i] || '(답변 없음)'}</p>
              </div>
            ))}
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</p>}

          <button onClick={handleAnalyze} disabled={analyzing} style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 16, cursor: analyzing ? 'default' : 'pointer', opacity: analyzing ? 0.6 : 1, fontFamily: 'inherit' }}>
            {analyzing ? '분석 중...' : '분석하기'}
          </button>
        </div>
      </main>
    )
  }

  // ── 5. 결과 ──
  if (step === 'result' && result) {
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '32px 36px', color: '#fff', textAlign: 'center' }}>
            <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>모의 면접 결과</span>
            <div style={{ fontSize: 64, fontWeight: 900, marginTop: 16, lineHeight: 1 }}>{result.overallScore}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/ 100점</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: '0 0 14px' }}>📋 종합 총평</h3>
            <p style={{ color: '#333', lineHeight: 1.85, fontSize: 15, margin: 0 }}>{result.overallSummary}</p>
          </div>

          {result.repeatedPatterns?.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20, padding: '24px 28px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#92400e', margin: '0 0 12px' }}>🔁 반복된 패턴</h3>
              {result.repeatedPatterns.map((p, i) => (
                <p key={i} style={{ fontSize: 13, color: '#78350f', margin: '0 0 8px', lineHeight: 1.7 }}>• {p}</p>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
            <span style={{ fontSize: 18 }}>🎤</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f2244', margin: 0 }}>질문별 피드백</h2>
          </div>

          {result.questionFeedback.map((qf, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden' }}>
              <div style={{ background: '#0f2244', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{i + 1}. {qf.question}</span>
                <span style={{ background: getScoreColor(qf.score), color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 10 }}>{qf.score}점</span>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <div style={{ background: '#f7f6f3', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#888', margin: '0 0 6px' }}>내 답변</p>
                  <p style={{ fontSize: 13, color: '#333', lineHeight: 1.7, margin: 0 }}>{qf.answer || '(답변 없음)'}</p>
                </div>
                {qf.issues?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {qf.issues.map((tag, ti) => (
                      <span key={ti} style={{ background: '#fef2f2', color: '#991b1b', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#065f46', margin: '0 0 6px' }}>잘한 점</p>
                  <p style={{ fontSize: 13, color: '#065f46', lineHeight: 1.7, margin: 0 }}>{qf.strengths}</p>
                </div>
                <div style={{ background: '#eef2ff', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#3730a3', margin: '0 0 6px' }}>💡 이렇게 답하면 더 좋아요</p>
                  <p style={{ fontSize: 13, color: '#3730a3', lineHeight: 1.7, margin: 0 }}>{qf.improvement}</p>
                </div>
              </div>
            </div>
          ))}

          <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '28px 32px' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>🎯 최종 조언</h3>
            <p style={{ color: '#b8d9ee', lineHeight: 1.9, fontSize: 15, margin: 0 }}>{result.finalAdvice}</p>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            style={{ width: '100%', background: '#fff', color: '#0f2244', border: '2px solid #0f2244', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            잡통 홈으로
          </button>
        </div>
      </main>
    )
  }

  return null
}
