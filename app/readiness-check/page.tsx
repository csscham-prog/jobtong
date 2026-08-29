'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

const SCALE = [
  { value: 1, label: '매우 부족하다' },
  { value: 2, label: '부족한 편이다' },
  { value: 3, label: '보통이다' },
  { value: 4, label: '그런 편이다' },
  { value: 5, label: '매우 그렇다' },
]

interface Question {
  text: string
  featureId?: string
}

interface Category {
  key: string
  label: string
  icon: string
  questions: Question[]
}

const CATEGORIES: Category[] = [
  {
    key: 'direction', label: '방향성', icon: '🧭',
    questions: [
      { text: '내가 지원하려는 회사·직무가 명확한 편이다' },
      { text: '나만의 강점을 한 문장으로 설명할 수 있다' },
      { text: '왜 지금 이 직무·업계를 선택했는지 스스로 납득이 된다' },
    ],
  },
  {
    key: 'document', label: '서류 준비', icon: '📄',
    questions: [
      { text: '지금 자소서는 이 회사만을 위해 맞춤 작성한 편이다' },
      { text: '최근에 내 서류를 다른 사람(또는 AI)에게 보여주고 피드백을 받아봤다', featureId: 'analyze' },
      { text: '이력서의 경력·활동이 지원 직무와 어떻게 연결되는지 서류 안에서 설명이 된다' },
    ],
  },
  {
    key: 'interview', label: '면접 준비', icon: '🎤',
    questions: [
      { text: '예상 질문에 대해 어떻게 답할지 머릿속에 정리되어 있다' },
      { text: '그 답을 소리 내어 말하는 연습을 실제로 해봤다', featureId: 'mock-interview' },
      { text: '압박 질문이나 예상 못 한 질문에도 당황하지 않고 대응할 자신이 있다', featureId: 'mock-interview' },
    ],
  },
  {
    key: 'execution', label: '실행력·관리', icon: '📅',
    questions: [
      { text: '최근 지원 일정과 마감을 놓치지 않고 잘 관리하고 있다', featureId: 'schedule' },
      { text: '지금 몇 곳에 지원 중인지, 각각 어느 단계인지 바로 대답할 수 있다', featureId: 'schedule' },
      { text: '탈락 후에 원인을 분석하고 다음 지원에 반영한 적이 있다' },
    ],
  },
  {
    key: 'research', label: '정보력·리서치', icon: '🔍',
    questions: [
      { text: '지원하기 전에 그 회사의 최근 이슈나 사업 방향을 찾아보는 편이다' },
      { text: '채용공고의 자격요건·우대사항을 꼼꼼히 읽고 지원한다' },
      { text: '그 직무의 평균 연봉·처우 수준을 알아보고 지원한다', featureId: 'salary' },
    ],
  },
]

const FEATURE_CARDS: Record<string, { icon: string; title: string; desc: string; link: string }> = {
  analyze: { icon: '📝', title: '취업 서류 정밀 분석', desc: '자소서·이력서를 논리성·구체성·직무적합성까지 냉정하게 진단해드려요.', link: '/' },
  'mock-interview': { icon: '🎤', title: '모의 면접', desc: '서류 기반 맞춤 질문에 직접 답하고 AI 피드백을 받아보세요.', link: '/mock-interview' },
  schedule: { icon: '📅', title: '일정 관리', desc: '지원 마감·면접 일정을 한곳에서 관리하고 D-day 알림을 받아보세요.', link: '/schedule' },
  salary: { icon: '💰', title: '실수령액 계산기', desc: '지원 전에 예상 실수령액을 미리 확인해보세요.', link: '/salary-calculator' },
}

function getOverallComment(pct: number) {
  if (pct >= 80) return '전반적으로 탄탄하게 준비되어 있어요.'
  if (pct >= 60) return '준비는 되어가는데, 군데군데 채울 부분이 있어요.'
  if (pct >= 40) return '방향은 잡혔지만 실행이 아직 부족해요.'
  return '지금부터 하나씩 채워나가면 돼요.'
}

function getCategoryComment(categoryKey: string, pct: number) {
  const tier = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low'
  const map: Record<string, Record<string, string>> = {
    direction: {
      high: '방향이 명확해서 서류·면접에서도 일관된 메시지를 전달할 수 있어요.',
      mid: '방향은 있지만, 한 문장으로 정리해보면 더 선명해질 거예요.',
      low: '왜 이 직무·회사인지부터 스스로 정리해보는 게 우선이에요.',
    },
    document: {
      high: '서류가 지원 직무에 맞게 잘 준비되어 있어요.',
      mid: '기본은 되어 있지만, 회사별로 더 맞춤화하면 좋아요.',
      low: '서류를 다시 점검하고 객관적인 피드백을 받아볼 시점이에요.',
    },
    interview: {
      high: '면접 대응력이 준비되어 있어요.',
      mid: '답은 정리됐는데, 실전처럼 말해보는 연습이 더 필요해요.',
      low: '아직 실전 연습이 부족해요. 소리 내어 답하는 연습부터 시작해보세요.',
    },
    execution: {
      high: '지원 과정을 체계적으로 관리하고 있어요.',
      mid: '관리는 하고 있지만, 놓치는 부분이 있을 수 있어요.',
      low: '일정과 지원 현황을 한곳에서 관리해보는 게 도움이 될 거예요.',
    },
    research: {
      high: '지원 전 리서치가 꼼꼼한 편이에요.',
      mid: '기본적인 확인은 하고 있지만, 조금 더 깊이 알아보면 좋아요.',
      low: '회사·직무·처우에 대한 정보를 더 찾아보고 지원하는 게 좋아요.',
    },
  }
  return map[categoryKey][tier]
}

function getBarColor(pct: number) {
  return pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'
}

export default function ReadinessCheckPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setAuthLoading(false)
    }
    init()
  }, [])

  const allQuestions = CATEGORIES.flatMap((cat, ci) =>
    cat.questions.map((q, qi) => ({ ...q, categoryKey: cat.key, id: `${ci}-${qi}` }))
  )

  const setAnswer = (id: string, value: number) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
    setError('')
  }

  const handleSubmit = () => {
    const unanswered = allQuestions.filter(q => !answers[q.id])
    if (unanswered.length > 0) {
      setError(`아직 답하지 않은 문항이 ${unanswered.length}개 있어요.`)
      return
    }
    setError('')
    setStep('result')
    window.scrollTo(0, 0)
  }

  const handleRetake = () => {
    setAnswers({})
    setStep('quiz')
    window.scrollTo(0, 0)
  }

  if (authLoading) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontSize: 14 }}>불러오는 중...</p>
      </main>
    )
  }

  const Header = () => (
    <header style={headerStyle}>
      <div style={headerInner}>
        <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
          잡통
        </button>
        <span style={{ fontSize: 13, color: '#666' }}>취업 준비도 자가진단</span>
        <span style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#059669', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>무료</span>
      </div>
    </header>
  )

  // ── 인트로 ──
  if (step === 'intro') {
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧭</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f2244', margin: '0 0 12px' }}>취업 준비도 자가진단</h1>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, margin: '0 0 32px' }}>
            15개 문항으로 지금 내 취업 준비 상태를 점검해보세요.<br />
            방향성 · 서류 · 면접 · 실행력 · 정보력 5가지 영역을 진단해드려요.
          </p>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '20px 24px', marginBottom: 32, textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px' }}>⏱️ 소요 시간 약 2분</p>
            <p style={{ fontSize: 13, color: '#555', margin: 0 }}>📊 결과는 저장되지 않으며, 언제든 다시 진단할 수 있어요.</p>
          </div>
          <button onClick={() => setStep('quiz')} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 40px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
            진단 시작하기 →
          </button>
        </div>
      </main>
    )
  }

  // ── 퀴즈 ──
  if (step === 'quiz') {
    const answeredCount = Object.keys(answers).length
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 100px' }}>
          <div style={{ position: 'sticky', top: 64, background: '#f7f6f3', paddingTop: 12, paddingBottom: 12, zIndex: 40 }}>
            <div style={{ height: 8, background: '#e5e3dc', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredCount / 15) * 100}%`, background: '#0f2244', borderRadius: 4, transition: 'width 0.15s' }} />
            </div>
            <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0', textAlign: 'right' }}>{answeredCount} / 15</p>
          </div>

          {CATEGORIES.map((cat, ci) => (
            <div key={cat.key} style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2244' }}>{cat.label}</span>
              </div>
              {cat.questions.map((q, qi) => {
                const id = `${ci}-${qi}`
                return (
                  <div key={id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #ece9e1', padding: '18px 20px', marginBottom: 12 }}>
                    <p style={{ fontSize: 14, color: '#222', fontWeight: 600, margin: '0 0 14px', lineHeight: 1.6 }}>{q.text}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {SCALE.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setAnswer(id, s.value)}
                          style={{
                            flex: '1 1 auto', minWidth: 56, padding: '9px 6px', borderRadius: 10,
                            border: answers[id] === s.value ? '2px solid #0f2244' : '1.5px solid #e5e3dc',
                            background: answers[id] === s.value ? '#0f2244' : '#fff',
                            color: answers[id] === s.value ? '#fff' : '#555',
                            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4,
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {error && <p style={{ fontSize: 13, color: '#ef4444', margin: '16px 0 0' }}>{error}</p>}

          <button onClick={handleSubmit} style={{ width: '100%', marginTop: 24, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
            결과 보기
          </button>
        </div>
      </main>
    )
  }

  // ── 결과 ──
  const categoryScores = CATEGORIES.map(cat => {
    const sum = cat.questions.reduce((acc, _, qi) => {
      const ci = CATEGORIES.indexOf(cat)
      return acc + (answers[`${ci}-${qi}`] || 0)
    }, 0)
    return { ...cat, sum, pct: Math.round((sum / 15) * 100) }
  })

  const totalSum = categoryScores.reduce((acc, c) => acc + c.sum, 0)
  const overallPct = Math.round((totalSum / 75) * 100)

  // 낮은 점수(3점 이하) 문항의 featureId를 모아 카드 후보 생성, 문항 점수 낮은 순 정렬 후 중복 featureId 제거, 최대 3개
  const lowQuestions = allQuestions
    .filter(q => q.featureId && (answers[q.id] || 0) <= 3)
    .sort((a, b) => (answers[a.id] || 0) - (answers[b.id] || 0))

  const seenFeatures = new Set<string>()
  const recommendedFeatures: string[] = []
  for (const q of lowQuestions) {
    if (q.featureId && !seenFeatures.has(q.featureId)) {
      seenFeatures.add(q.featureId)
      recommendedFeatures.push(q.featureId)
    }
    if (recommendedFeatures.length >= 3) break
  }

  return (
    <main style={base}>
      <Header />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>

        <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '36px 32px', textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>나의 취업 준비도</p>
          <p style={{ fontSize: 48, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>{overallPct}%</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: 0 }}>{getOverallComment(overallPct)}</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', padding: '24px', marginBottom: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', margin: '0 0 18px' }}>영역별 점수</p>
          {categoryScores.map(cat => (
            <div key={cat.key} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: getBarColor(cat.pct) }}>{cat.pct}%</span>
              </div>
              <div style={{ height: 8, background: '#f0ede6', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${cat.pct}%`, background: getBarColor(cat.pct), borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 12, color: '#777', margin: 0, lineHeight: 1.6 }}>{getCategoryComment(cat.key, cat.pct)}</p>
            </div>
          ))}
        </div>

        {recommendedFeatures.length > 0 && (
          <>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', margin: '0 0 14px' }}>💡 지금 도움이 될 수 있어요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {recommendedFeatures.map(fid => {
                const f = FEATURE_CARDS[fid]
                return (
                  <div key={fid} onClick={() => window.location.href = f.link} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                    <span style={{ fontSize: 24 }}>{f.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e', margin: '0 0 3px' }}>{f.title}</p>
                      <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                    </div>
                    <span style={{ fontSize: 16, color: '#e6a800' }}>→</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <button onClick={handleRetake} style={{ width: '100%', background: '#fff', color: '#0f2244', border: '2px solid #0f2244', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
          다시 진단하기
        </button>
      </div>
    </main>
  )
}
