'use client'

import { useState } from 'react'

interface Score {
  logic: number
  specific: number
  fit: number
  expression: number
}

interface Improvement {
  category: string
  issue: string
  original: string
  suggestion: string
  addContent: string
}

interface AnalysisResult {
  totalScore: number
  summary: string
  mainIssue: string
  scores?: Score
  improvements?: Improvement[]
  strongPoints?: string[]
  finalAdvice?: string
}

interface PaidResultProps {
  result: AnalysisResult
  company?: string
  position?: string
  onReanalyze: () => void
}

export default function PaidResult({ result, company, position, onReanalyze }: PaidResultProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'guide'>('overview')

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreLabel = (s: number) => s >= 80 ? '우수' : s >= 60 ? '보통' : '미흡'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTxt = (s: number) => s >= 80 ? '#065f46' : s >= 60 ? '#92400e' : '#991b1b'

  const scoreItems = [
    { label: '논리성', key: 'logic', desc: '주장과 근거의 연결', icon: '🔗' },
    { label: '구체성', key: 'specific', desc: '수치·사례의 활용도', icon: '📌' },
    { label: '직무 적합성', key: 'fit', desc: '직무 역량 부합도', icon: '🎯' },
    { label: '표현력', key: 'expression', desc: '문장 품질·가독성', icon: '✍️' },
  ]

  const totalScore = result.totalScore || 0
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (totalScore / 100) * circumference

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-all-content')
    if (!element) return

    // html2pdf.js CDN 로드
    if (!(window as any).html2pdf) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      document.head.appendChild(script)
      await new Promise(resolve => { script.onload = resolve })
    }

    const filename = `잡통_자소서분석_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.pdf`

    const opt = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }

    // 잠깐 보이게 했다가 PDF 생성 후 다시 숨김
    element.style.display = 'block'
    await (window as any).html2pdf().set(opt).from(element).save()
    element.style.display = 'none'
  }

  return (
    <div id="paid-result-content" style={{ fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 상단 레포트 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '32px 36px', marginBottom: 20, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>PREMIUM REPORT</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>

        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>자기소개서 정밀 분석 리포트</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              {company && `${company}`}{position && ` · ${position}`}
              {!company && !position && '지원 직무 전반'}
            </p>
          </div>
          {/* 원형 점수 게이지 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle cx="60" cy="60" r="54" fill="none" stroke={getScoreColor(totalScore)} strokeWidth="10"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalScore}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>/ 100</span>
              </div>
            </div>
            <div>
              <div style={{ background: getScoreBg(totalScore), color: getScoreTxt(totalScore), fontSize: 15, fontWeight: 800, padding: '6px 16px', borderRadius: 20, marginBottom: 6 }}>
                {getScoreLabel(totalScore)}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>종합 평가</p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 안내 문구 */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          💡 탭을 클릭하면 문장 개선 제안과 강점 & 조언을 확인할 수 있어요!
        </span>
      </div>

      {/* 탭 네비게이션 + PDF 버튼 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', gap: 6, background: '#f0ede6', borderRadius: 14, padding: 4 }}>
        {[
          { key: 'overview', label: '📋 종합 분석' },
          { key: 'detail', label: '✏️ 문장 개선' },
          { key: 'guide', label: '⭐ 강점 & 조언' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              background: activeTab === tab.key ? '#0f2244' : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#888',
              border: 'none', borderRadius: 10, padding: '11px 8px',
              fontWeight: activeTab === tab.key ? 800 : 500,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(15,34,68,0.25)' : 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            {tab.label}
          </button>
        ))}
        </div>
        <button onClick={handleDownloadPDF}
          style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          📄 PDF
        </button>
      </div>

      {/* ── 탭 1: 종합 분석 ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 총평 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>전문가 총평</h3>
            </div>
            <p style={{ color: '#333', lineHeight: 1.85, fontSize: 15, margin: 0 }}>{result.summary}</p>
          </div>

          {/* 핵심 문제 */}
          <div style={{ background: '#fffbeb', borderRadius: 20, padding: '28px 32px', border: '2px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#92400e', margin: 0 }}>가장 시급한 개선 과제</h3>
            </div>
            <p style={{ color: '#555', lineHeight: 1.85, fontSize: 15, margin: 0 }}>{result.mainIssue}</p>
          </div>

          {/* 4개 항목 점수 — 레이더 느낌으로 */}
          {result.scores && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>역량 진단 점수</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {scoreItems.map(item => {
                  const score = result.scores![item.key as keyof Score] || 0
                  return (
                    <div key={item.key} style={{ background: '#f7f6f3', borderRadius: 14, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{item.icon} {item.label}</div>
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{item.desc}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: getScoreColor(score), lineHeight: 1 }}>{score}</div>
                          <div style={{ fontSize: 10, color: '#aaa' }}>/ 100</div>
                        </div>
                      </div>
                      <div style={{ height: 8, background: '#e8e5dc', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${getScoreColor(score)}, ${getScoreColor(score)}99)`, borderRadius: 4, transition: 'width 0.8s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                        <span style={{ background: getScoreBg(score), color: getScoreTxt(score), fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{getScoreLabel(score)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 종합 평균 코멘트 */}
              <div style={{ marginTop: 16, padding: '14px 18px', background: '#f0f4ff', borderRadius: 12, fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
                💡 <strong>분석 인사이트:</strong> {
                  (() => {
                    const scores = result.scores!
                    const lowest = scoreItems.reduce((a, b) => (scores[a.key as keyof Score] || 0) < (scores[b.key as keyof Score] || 0) ? a : b)
                    const highest = scoreItems.reduce((a, b) => (scores[a.key as keyof Score] || 0) > (scores[b.key as keyof Score] || 0) ? a : b)
                    return `${highest.label}이 가장 강점이며, ${lowest.label} 영역의 집중 보완이 합격 가능성을 높이는 핵심입니다.`
                  })()
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 탭 2: 문장 개선 ── */}
      {activeTab === 'detail' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result.improvements && result.improvements.length > 0 ? (
            result.improvements.map((imp, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <span style={{ background: '#0f2244', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2244' }}>{imp.category}</span>
                </div>

                {/* 문제점 */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 8 }}>🔍 문제점</div>
                  <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, margin: 0 }}>{imp.issue}</p>
                </div>

                {/* Before */}
                {imp.original && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: 1, marginBottom: 8 }}>BEFORE — 현재 문제 문장</div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: 10, padding: '14px 16px', fontSize: 14, color: '#7f1d1d', lineHeight: 1.8, fontStyle: 'italic' }}>
                      "{imp.original}"
                    </div>
                  </div>
                )}

                {/* After */}
                <div style={{ marginBottom: imp.addContent ? 16 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: 1, marginBottom: 8 }}>AFTER — 이렇게 고치세요</div>
                  <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderLeft: '4px solid #10b981', borderRadius: 10, padding: '14px 16px', fontSize: 14, color: '#064e3b', lineHeight: 1.8 }}>
                    {imp.suggestion}
                  </div>
                </div>

                {/* 추가 내용 */}
                {imp.addContent && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: 1, marginBottom: 8 }}>➕ 이런 내용을 추가하세요</div>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '4px solid #6366f1', borderRadius: 10, padding: '14px 16px', fontSize: 14, color: '#1e40af', lineHeight: 1.8 }}>
                      {imp.addContent}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ background: '#fff', borderRadius: 20, padding: '40px', textAlign: 'center', border: '1px solid #ece9e1' }}>
              <p style={{ color: '#aaa', fontSize: 15 }}>개선 제안이 없습니다. 자소서가 전반적으로 잘 작성되었습니다!</p>
            </div>
          )}
        </div>
      )}

      {/* ── 탭 3: 강점 & 조언 ── */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 잘 된 점 */}
          {result.strongPoints && result.strongPoints.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>잘 된 점 — 유지하세요</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.strongPoints.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <p style={{ fontSize: 14, color: '#065f46', lineHeight: 1.75, margin: 0 }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최종 조언 */}
          {result.finalAdvice && (
            <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>🎯</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>전문가 최종 조언</h3>
              </div>
              <p style={{ color: '#b8d9ee', lineHeight: 1.9, fontSize: 15, margin: 0 }}>{result.finalAdvice}</p>
            </div>
          )}

          {/* 합격을 위한 체크리스트 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', border: '1px solid #ece9e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>📝</span>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>최종 제출 전 체크리스트</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '지원 직무에서 요구하는 핵심 역량이 명확히 드러나는가?',
                '추상적 표현 대신 구체적 수치와 사례를 사용했는가?',
                '각 문단이 하나의 메시지에 집중하고 있는가?',
                '맞춤법·문장 부호 오류가 없는가?',
                '분량이 지원 기업의 권장 분량에 맞는가?',
                '지원 동기가 해당 기업만의 이유로 특화되어 있는가?',
              ].map((item, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, background: '#f7f6f3' }}>
                  <input type="checkbox" style={{ marginTop: 2, accentColor: '#0f2244', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 다음 단계 안내 */}
          <div style={{ background: '#fffbeb', borderRadius: 20, padding: '24px 28px', border: '1px solid #fde68a' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', margin: '0 0 12px' }}>💡 이렇게 활용하세요</h3>
            <ol style={{ padding: '0 0 0 18px', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '이 리포트를 참고해 자소서를 수정하세요',
                '수정한 자소서를 다시 분석해 점수 변화를 확인하세요',
                '80점 이상이 될 때까지 반복하면 합격률이 크게 높아집니다',
              ].map((step, i) => (
                <li key={i} style={{ fontSize: 14, color: '#92400e', lineHeight: 1.7 }}>{step}</li>
              ))}
            </ol>
          </div>

        </div>
      )}

      {/* 하단 버튼 */}
      {/* 하단 버튼 영역 */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button onClick={handleDownloadPDF}
          style={{ flex: 1, background: '#f7f6f3', color: '#0f2244', border: '1.5px solid #ddd', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          📄 전체 결과 PDF 저장
        </button>
        <button onClick={onReanalyze}
          style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
          수정 후 다시 분석하기
        </button>
      </div>

      {/* 인쇄용 — 모든 탭 내용 포함 (화면에는 안 보임) */}
      <div id="pdf-all-content" style={{ display: 'none' }}>
        <div style={{ fontFamily: "'Pretendard', sans-serif", padding: 20 }}>
          {/* 헤더 */}
          <div style={{ background: '#0f2244', color: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e6a800', marginBottom: 8 }}>PREMIUM REPORT · {new Date().toLocaleDateString('ko-KR')}</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>자기소개서 정밀 분석 리포트</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              {company && position ? `${company} · ${position}` : company || position || '지원 직무 전반'}
            </p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>{result.totalScore}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/ 100점 · {getScoreLabel(result.totalScore)}</span>
            </div>
          </div>

          {/* 총평 */}
          <div style={{ marginBottom: 20, padding: '20px 24px', background: '#f7f6f3', borderRadius: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 10 }}>📋 전문가 총평</h2>
            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.8, margin: 0 }}>{result.summary}</p>
          </div>

          {/* 핵심 문제 */}
          <div style={{ marginBottom: 20, padding: '20px 24px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 10 }}>⚠️ 가장 시급한 개선 과제</h2>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8, margin: 0 }}>{result.mainIssue}</p>
          </div>

          {/* 점수 */}
          {result.scores && (
            <div style={{ marginBottom: 20, padding: '20px 24px', background: '#f7f6f3', borderRadius: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>📊 역량 진단 점수</h2>
              {scoreItems.map(item => {
                const score = result.scores![item.key as keyof Score] || 0
                return (
                  <div key={item.key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{item.icon} {item.label}</span>
                      <span style={{ fontWeight: 700, color: getScoreColor(score) }}>{score}점</span>
                    </div>
                    <div style={{ height: 8, background: '#e8e5dc', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: getScoreColor(score), borderRadius: 4 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 문장 개선 */}
          {result.improvements && result.improvements.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>✏️ 문장 개선 제안</h2>
              {result.improvements.map((imp, i) => (
                <div key={i} style={{ padding: '18px 20px', background: '#fff', borderRadius: 12, marginBottom: 12, border: '1px solid #ece9e1' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2244', marginBottom: 8 }}>#{i+1} {imp.category}</div>
                  <p style={{ fontSize: 12, color: '#555', marginBottom: 10, lineHeight: 1.7 }}>{imp.issue}</p>
                  {imp.original && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#7f1d1d' }}>BEFORE: "{imp.original}"</div>}
                  <div style={{ background: '#ecfdf5', borderRadius: 8, padding: '8px 12px', marginBottom: imp.addContent ? 8 : 0, fontSize: 12, color: '#064e3b' }}>AFTER: {imp.suggestion}</div>
                  {imp.addContent && <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1e40af' }}>추가: {imp.addContent}</div>}
                </div>
              ))}
            </div>
          )}

          {/* 잘 된 점 */}
          {result.strongPoints && result.strongPoints.length > 0 && (
            <div style={{ marginBottom: 20, padding: '20px 24px', background: '#ecfdf5', borderRadius: 12, border: '1px solid #bbf7d0' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#065f46', marginBottom: 12 }}>⭐ 잘 된 점</h2>
              {result.strongPoints.map((p, i) => (
                <p key={i} style={{ fontSize: 13, color: '#065f46', margin: '0 0 8px', lineHeight: 1.7 }}>✓ {p}</p>
              ))}
            </div>
          )}

          {/* 최종 조언 */}
          {result.finalAdvice && (
            <div style={{ marginBottom: 20, padding: '20px 24px', background: '#0f2244', borderRadius: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 10 }}>🎯 전문가 최종 조언</h2>
              <p style={{ fontSize: 13, color: '#b8d9ee', lineHeight: 1.8, margin: 0 }}>{result.finalAdvice}</p>
            </div>
          )}

          {/* 최종 제출 전 체크리스트 */}
          <div style={{ marginBottom: 20, padding: '20px 24px', background: '#f7f6f3', borderRadius: 12, border: '1px solid #ece9e1' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 14 }}>📝 최종 제출 전 체크리스트</h2>
            {[
              '지원 직무에서 요구하는 핵심 역량이 명확히 드러나는가?',
              '추상적 표현 대신 구체적 수치와 사례를 사용했는가?',
              '각 문단이 하나의 메시지에 집중하고 있는가?',
              '맞춤법·문장 부호 오류가 없는가?',
              '분량이 지원 기업의 권장 분량에 맞는가?',
              '지원 동기가 해당 기업만의 이유로 특화되어 있는가?',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: '#fff', borderRadius: 8, marginBottom: 8 }}>
                <span style={{ color: '#0f2244', fontWeight: 700, flexShrink: 0 }}>☐</span>
                <span style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* 이렇게 활용하세요 */}
          <div style={{ padding: '20px 24px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 12 }}>💡 이렇게 활용하세요</h2>
            {[
              '이 리포트를 참고해 자소서를 수정하세요',
              '수정한 자소서를 다시 분석해 점수 변화를 확인하세요',
              '80점 이상이 될 때까지 반복하면 합격률이 크게 높아집니다',
            ].map((step, i) => (
              <p key={i} style={{ fontSize: 13, color: '#92400e', margin: '0 0 8px', lineHeight: 1.7 }}>{i + 1}. {step}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
