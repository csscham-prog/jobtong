'use client'

import { useState } from 'react'

export default function Home() {
  const [step, setStep] = useState<'landing' | 'analyze' | 'result'>('landing')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('자소서 내용을 입력해주세요.')
      return
    }
    if (content.trim().length < 100) {
      setError('자소서를 100자 이상 입력해주세요.')
      return
    }
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '우수'
    if (score >= 60) return '보통'
    return '미흡'
  }

  if (step === 'landing') {
    return (
      <main className="min-h-screen">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-500">잡통</span>
              <span className="text-xs bg-gold-400 text-white px-2 py-0.5 rounded-full font-medium">AI</span>
            </div>
            <button
              onClick={() => setStep('analyze')}
              className="btn-primary text-sm py-2 px-5"
            >
              무료 체험하기
            </button>
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-b from-primary-900 to-primary-700 text-white py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/10 text-white text-sm px-4 py-2 rounded-full mb-6 font-medium">
              ✨ AI 자소서 분석 서비스 — 무료 체험 가능
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              취업 컨설턴트에게<br />
              <span className="text-gold-400">20만 원</span> 내지 마세요
            </h1>
            <p className="text-lg text-blue-100 mb-10 leading-relaxed">
              AI가 지금 바로 자소서를 분석해드립니다.<br />
              항목별 점수와 구체적인 개선 방향을 확인하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setStep('analyze')}
                className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                무료로 분석 시작하기 →
              </button>
            </div>
            <p className="text-blue-200 text-sm mt-4">신용카드 불필요 · 가입 없이 바로 체험</p>
          </div>
        </section>

        {/* 가격 섹션 */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-primary-500 mb-4">합리적인 가격</h2>
            <p className="text-center text-gray-500 mb-12">전문 컨설턴트의 1/50 가격으로 AI 피드백을</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card border-2 border-gray-100">
                <div className="text-lg font-bold text-gray-700 mb-1">1회 분석권</div>
                <div className="text-4xl font-bold text-primary-500 mb-1">₩2,900</div>
                <div className="text-gray-400 text-sm mb-6">1회 전체 분석</div>
                <ul className="space-y-3 text-gray-600 text-sm">
                  <li className="flex items-center gap-2">✓ 항목별 점수 분석</li>
                  <li className="flex items-center gap-2">✓ 구체적 개선 문장 제안</li>
                  <li className="flex items-center gap-2">✓ 직무 적합성 평가</li>
                </ul>
              </div>
              <div className="card border-2 border-primary-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs px-4 py-1 rounded-full font-medium">추천</div>
                <div className="text-lg font-bold text-gray-700 mb-1">5회 분석권</div>
                <div className="text-4xl font-bold text-primary-500 mb-1">₩9,900</div>
                <div className="text-gray-400 text-sm mb-6">1회당 ₩1,980 · 32% 할인</div>
                <ul className="space-y-3 text-gray-600 text-sm">
                  <li className="flex items-center gap-2">✓ 항목별 점수 분석</li>
                  <li className="flex items-center gap-2">✓ 구체적 개선 문장 제안</li>
                  <li className="flex items-center gap-2">✓ 직무 적합성 평가</li>
                  <li className="flex items-center gap-2">✓ 분석 히스토리 저장</li>
                  <li className="flex items-center gap-2">✓ 수정 전/후 비교</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-primary-900 text-blue-200 py-10 px-6 text-center text-sm">
          <div className="mb-2 font-bold text-white text-lg">잡통</div>
          <p>AI 자소서 분석 서비스 · 문의: jobtong@gmail.com</p>
          <p className="mt-2 text-blue-300/50">© 2026 잡통. All rights reserved.</p>
        </footer>
      </main>
    )
  }

  if (step === 'analyze') {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setStep('landing')} className="flex items-center gap-2 text-primary-500 font-bold text-xl">
              ← 잡통
            </button>
            <span className="text-sm text-gray-400">무료 체험 — 총평 + 핵심 문제 1가지 제공</span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="card">
            <h2 className="text-2xl font-bold text-primary-500 mb-2">자소서 분석 시작</h2>
            <p className="text-gray-500 text-sm mb-8">자소서를 붙여넣으면 AI가 즉시 분석해드립니다.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">지원 회사 <span className="text-gray-400 font-normal">(선택)</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 삼성전자, 카카오, 현대자동차"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">지원 직무 <span className="text-gray-400 font-normal">(선택)</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 마케팅, 백엔드 개발, 영업관리"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  자소서 내용 <span className="text-red-400">*</span>
                  <span className="text-gray-400 font-normal ml-2">{content.length}자</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={12}
                  placeholder="자소서 내용을 여기에 붙여넣어 주세요. (최소 100자 이상)"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    AI가 분석 중입니다...
                  </span>
                ) : 'AI 분석 시작하기 →'}
              </button>

              <p className="text-center text-gray-400 text-xs">
                무료 체험 시 총평과 핵심 문제 1가지를 제공합니다.<br />
                전체 분석은 1회권(₩2,900) 또는 5회권(₩9,900)으로 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'result' && result) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setStep('landing')} className="flex items-center gap-2 text-primary-500 font-bold text-xl">
              ← 잡통
            </button>
            <button onClick={() => { setStep('analyze'); setResult(null) }} className="text-sm text-gray-500 hover:text-primary-500">
              다시 분석하기
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">

          {/* 총점 */}
          <div className="card text-center">
            <p className="text-gray-500 text-sm mb-2">종합 점수</p>
            <div className="text-7xl font-bold text-primary-500 mb-2">{result.totalScore}</div>
            <div className="text-lg font-semibold text-gray-600">/ 100점</div>
            <div className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-medium ${
              result.totalScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
              result.totalScore >= 60 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {getScoreLabel(result.totalScore)}
            </div>
          </div>

          {/* 총평 */}
          <div className="card">
            <h3 className="text-lg font-bold text-primary-500 mb-3">📋 총평</h3>
            <p className="text-gray-700 leading-relaxed">{result.summary}</p>
          </div>

          {/* 핵심 문제 — 무료 공개 */}
          <div className="card border-2 border-amber-200 bg-amber-50">
            <h3 className="text-lg font-bold text-amber-700 mb-3">⚠️ 핵심 문제 (무료 공개)</h3>
            <p className="text-gray-700 leading-relaxed">{result.mainIssue}</p>
          </div>

          {/* 페이월 — 나머지 분석 잠금 */}
          <div className="card relative overflow-hidden">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-xl font-bold text-primary-500 mb-2">전체 분석 결과 보기</h3>
              <p className="text-gray-500 text-sm mb-6">항목별 세부 점수, 개선 문장, 직무 적합성 분석을<br />확인하려면 결제가 필요합니다.</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm">
                  1회권 ₩2,900
                </button>
                <button className="flex-1 bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm">
                  5회권 ₩9,900 ⭐
                </button>
              </div>
            </div>

            {/* 블러 처리된 미리보기 */}
            <h3 className="text-lg font-bold text-primary-500 mb-4">📊 항목별 세부 분석</h3>
            <div className="space-y-4 filter blur-sm">
              {['논리성', '구체성', '직무 적합성', '표현력'].map((item) => (
                <div key={item}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item}</span>
                    <span className="text-gray-400">--점</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill bg-gray-300 w-3/4"/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setStep('analyze'); setResult(null) }}
            className="w-full btn-secondary"
          >
            다른 자소서 분석하기
          </button>
        </div>
      </main>
    )
  }

  return null
}
