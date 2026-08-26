'use client'

import { useState } from 'react'
import { downloadElementAsPdf } from '@/lib/downloadPdf'

interface Score {
  logic?: number
  specific?: number
  fit?: number
  expression?: number
  structure?: number
  achievement?: number
  relevance?: number
  completeness?: number
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
  hasCoverLetterContent?: boolean
  coverLetterHint?: string
}

interface PaidResultProps {
  result: AnalysisResult
  company?: string
  position?: string
  docType?: 'coverletter' | 'resume'
  onReanalyze: () => void
}

export default function PaidResult({ result, company, position, docType = 'coverletter', onReanalyze }: PaidResultProps) {

  const isResume = docType === 'resume'
  const [isDownloading, setIsDownloading] = useState(false)

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreLabel = (s: number) => s >= 80 ? '우수' : s >= 60 ? '보통' : '미흡'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTxt = (s: number) => s >= 80 ? '#065f46' : s >= 60 ? '#92400e' : '#991b1b'

  const scoreItemsCoverLetter = [
    { label: '논리성', key: 'logic', desc: '주장과 근거의 연결', icon: '🔗' },
    { label: '구체성', key: 'specific', desc: '수치·사례의 활용도', icon: '📌' },
    { label: '직무 적합성', key: 'fit', desc: '직무 역량 부합도', icon: '🎯' },
    { label: '표현력', key: 'expression', desc: '문장 품질·가독성', icon: '✍️' },
  ]

  const scoreItemsResume = [
    { label: '구조·가독성', key: 'structure', desc: '핵심 정보 파악 용이성', icon: '🗂️' },
    { label: '성과 정량화', key: 'achievement', desc: '수치·근거의 설득력', icon: '📈' },
    { label: '직무 연관성', key: 'relevance', desc: '지원 직무와의 연결성', icon: '🎯' },
    { label: '완결성', key: 'completeness', desc: '형식·정보의 완성도', icon: '✅' },
  ]

  const scoreItems = isResume ? scoreItemsResume : scoreItemsCoverLetter

  const reportTitle = isResume ? '이력서·경력기술서 정밀 분석 리포트' : '자기소개서 정밀 분석 리포트'
  const mainIssueTitle = isResume ? '가장 시급한 개선 과제' : '가장 시급한 개선 과제'
  const improvementSectionTitle = isResume ? '구체적 개선 제안' : '문장 개선 제안'
  const improvementEmptyText = isResume ? '개선 제안이 없습니다. 서류가 전반적으로 잘 작성되었습니다!' : '개선 제안이 없습니다. 자소서가 전반적으로 잘 작성되었습니다!'
  const originalLabel = isResume ? 'BEFORE — 현재 표현' : 'BEFORE — 현재 문제 문장'
  const suggestionLabel = isResume ? 'AFTER — 이렇게 재구성하세요' : 'AFTER — 이렇게 고치세요'
  const revisionCTA = isResume ? '수정 후 다시 분석하기' : '수정 후 다시 분석하기'
  const usageSteps = isResume
    ? [
        '이 리포트를 참고해 이력서·경력기술서를 수정하세요',
        '수정한 서류를 다시 분석해 점수 변화를 확인하세요',
        '80점 이상이 될 때까지 반복하면 서류 통과율이 크게 높아집니다',
      ]
    : [
        '이 리포트를 참고해 자소서를 수정하세요',
        '수정한 자소서를 다시 분석해 점수 변화를 확인하세요',
        '80점 이상이 될 때까지 반복하면 합격률이 크게 높아집니다',
      ]
  const checklistItems = isResume
    ? [
        '채용담당자가 6초 안에 핵심 정보를 파악할 수 있는가?',
        '핵심 경력에 수치·기간·규모로 증명된 성과가 있는가?',
        '지원 직무와 직결되는 경력이 최상단에 배치되어 있는가?',
        '오탈자와 형식 불일치가 없는가?',
        '경력 공백 기간에 대한 설명이 있는가?',
        '연락처 등 채용담당자가 확인할 정보가 누락되지 않았는가?',
      ]
    : [
        '지원 직무에서 요구하는 핵심 역량이 명확히 드러나는가?',
        '추상적 표현 대신 구체적 수치와 사례를 사용했는가?',
        '각 문단이 하나의 메시지에 집중하고 있는가?',
        '맞춤법·문장 부호 오류가 없는가?',
        '분량이 지원 기업의 권장 분량에 맞는가?',
        '지원 동기가 해당 기업만의 이유로 특화되어 있는가?',
      ]

  const totalScore = result.totalScore || 0
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (totalScore / 100) * circumference

  const handleDownloadPDF = async () => {
    // 버튼이 위/아래 두 곳에 있고 둘 다 같은 숨김 요소(#pdf-all-content)를 공유하므로,
    // 이미 생성 중일 때 다시 누르면 두 호출이 display 토글을 서로 덮어써서
    // 중간에 캡처가 끊기는(내용이 비거나 일부만 담기는) 문제가 생긴다. 그래서 막는다.
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const filenamePrefix = isResume ? '잡통_서류분석' : '잡통_자소서분석'
      const filename = `${filenamePrefix}_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.pdf`
      await downloadElementAsPdf('pdf-all-content', filename)
    } finally {
      setIsDownloading(false)
    }
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
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>{reportTitle}</h2>
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

      {/* PDF 다운로드 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={handleDownloadPDF} disabled={isDownloading}
          style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: isDownloading ? 'default' : 'pointer', opacity: isDownloading ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {isDownloading ? '⏳ 생성 중...' : '📄 PDF 저장'}
        </button>
      </div>

      {/* 자소서 요소 감지 안내 (이력서 분석 시에만) */}
      {isResume && result.hasCoverLetterContent && (
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 16, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>✏️</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#4338ca', margin: '0 0 4px' }}>이 문서에 자기소개서 성격의 내용도 포함되어 있어요</p>
            <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.6 }}>{result.coverLetterHint}</p>
            <p style={{ fontSize: 12, color: '#888', margin: '8px 0 0' }}>자기소개서 부분을 심층 분석받고 싶다면, '자기소개서' 탭에서 별도로 분석을 받아보세요. (크레딧 1회 추가 소모)</p>
          </div>
        </div>
      )}

      {/* ── 종합 분석 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
        <span style={{ fontSize: 18 }}>📋</span>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f2244', margin: 0 }}>종합 분석</h2>
      </div>
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

      {/* ── 문장 개선 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
        <span style={{ fontSize: 18 }}>✏️</span>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f2244', margin: 0 }}>{improvementSectionTitle}</h2>
      </div>
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
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', letterSpacing: 1, marginBottom: 8 }}>{originalLabel}</div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: 10, padding: '14px 16px', fontSize: 14, color: '#7f1d1d', lineHeight: 1.8, fontStyle: 'italic' }}>
                      "{imp.original}"
                    </div>
                  </div>
                )}

                {/* After */}
                <div style={{ marginBottom: imp.addContent ? 16 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: 1, marginBottom: 8 }}>{suggestionLabel}</div>
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
              <p style={{ color: '#aaa', fontSize: 15 }}>{improvementEmptyText}</p>
            </div>
          )}
        </div>

      {/* ── 강점 & 조언 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f2244', margin: 0 }}>강점 & 조언</h2>
      </div>
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
              {checklistItems.map((item, i) => (
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
              {usageSteps.map((step, i) => (
                <li key={i} style={{ fontSize: 14, color: '#92400e', lineHeight: 1.7 }}>{step}</li>
              ))}
            </ol>
          </div>

        </div>

      {/* 하단 버튼 */}
      {/* 하단 버튼 영역 */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button onClick={handleDownloadPDF} disabled={isDownloading}
          style={{ flex: 1, background: '#f7f6f3', color: '#0f2244', border: '1.5px solid #ddd', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: isDownloading ? 'default' : 'pointer', opacity: isDownloading ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {isDownloading ? '⏳ PDF 생성 중...' : '📄 전체 결과 PDF 저장'}
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
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{reportTitle}</h1>
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
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>✏️ {improvementSectionTitle}</h2>
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
            {checklistItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: '#fff', borderRadius: 8, marginBottom: 8 }}>
                <span style={{ color: '#0f2244', fontWeight: 700, flexShrink: 0 }}>☐</span>
                <span style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* 이렇게 활용하세요 */}
          <div style={{ padding: '20px 24px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 12 }}>💡 이렇게 활용하세요</h2>
            {usageSteps.map((step, i) => (
              <p key={i} style={{ fontSize: 13, color: '#92400e', margin: '0 0 8px', lineHeight: 1.7 }}>{i + 1}. {step}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
