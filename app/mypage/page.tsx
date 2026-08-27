'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { downloadElementAsPdf } from '@/lib/downloadPdf'

export default function MyPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'coverletter' | 'resume' | 'consistency'>('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    setUser(session.user)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (p) setProfile(p)

    const { data: a } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (a) setAnalyses(a)
    setLoading(false)
  }

  const handleWithdraw = async () => {
    setWithdrawLoading(true); setWithdrawError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }

    const res = await fetch('/api/user/withdraw', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    const data = await res.json()

    if (res.ok && data.success) {
      await supabase.auth.signOut()
      window.location.href = '/?withdrawn=true'
    } else {
      setWithdrawError(data.error || '탈퇴 처리 중 오류가 발생했습니다.')
    }
    setWithdrawLoading(false)
  }

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreLabel = (s: number) => s >= 80 ? '우수' : s >= 60 ? '보통' : '미흡'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTxt = (s: number) => s >= 80 ? '#065f46' : s >= 60 ? '#92400e' : '#991b1b'

  const scoreItemsCoverLetter = [
    { label: '논리성', key: 'logic', icon: '🔗' },
    { label: '구체성', key: 'specific', icon: '📌' },
    { label: '직무 적합성', key: 'fit', icon: '🎯' },
    { label: '표현력', key: 'expression', icon: '✍️' },
  ]
  const scoreItemsResume = [
    { label: '구조·가독성', key: 'structure', icon: '🗂️' },
    { label: '성과 정량화', key: 'achievement', icon: '📈' },
    { label: '직무 연관성', key: 'relevance', icon: '🎯' },
    { label: '완결성', key: 'completeness', icon: '✅' },
  ]
  const getDocTypeLabel = (docType: string) => docType === 'resume' ? '이력서·경력기술서' : docType === 'consistency' ? '잡통 플러스' : '자기소개서'

  // PDF에는 실제 결과 화면(PaidResult)과 같은 안내 문구를 담아 일관성을 맞춘다.
  const getUsageSteps = (isResume: boolean) => isResume
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
  const getChecklistItems = (isResume: boolean) => isResume
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

  const handleDownloadHistoryPdf = async (analysis: any) => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const docType = analysis.doc_type || 'coverletter'
      const filenamePrefix = docType === 'resume' ? '잡통_서류분석' : '잡통_자소서분석'
      const dateLabel = new Date(analysis.created_at).toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')
      await downloadElementAsPdf('mypage-pdf-content', `${filenamePrefix}_${dateLabel}.pdf`)
    } finally {
      setIsDownloading(false)
    }
  }

  // PDF 인쇄용 템플릿(#mypage-pdf-content)에서 쓸 값들 — 현재 펼쳐진(selected) 기록 기준
  const selectedDocType = selected?.doc_type || 'coverletter'
  const selectedIsResume = selectedDocType === 'resume'
  const selectedScoreItems = selectedIsResume ? scoreItemsResume : scoreItemsCoverLetter
  const selectedReportTitle = selectedIsResume ? '이력서·경력기술서 정밀 분석 리포트' : '자기소개서 정밀 분석 리포트'
  const selectedImprovementTitle = selectedIsResume ? '구체적 개선 제안' : '문장 개선 제안'

  const filteredAnalyses = analyses.filter(a => {
    if (docTypeFilter === 'all') return true
    const dt = a.doc_type || 'coverletter' // 기존 데이터는 doc_type이 없으므로 자소서로 간주
    return dt === docTypeFilter
  })

  const Emblem = () => (
    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#e6a800', borderRadius: '50%' }} />
      <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>J</span>
    </div>
  )

  if (loading) return (
    <div style={{ fontFamily: "'Pretendard', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f6f3' }}>
      <p style={{ color: '#888' }}>로딩 중...</p>
    </div>
  )

  return (
    <main style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#f7f6f3', minHeight: '100vh' }}>

      {/* 헤더 */}
      <header style={{ background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: 0 }}>
            <Emblem />
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0f2244' }}>잡통</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#888' }}>{profile?.email}</span>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
              style={{ background: 'none', color: '#aaa', border: '1px solid #ddd', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* 프로필 카드 */}
        <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '28px 32px', marginBottom: 28, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>내 계정</p>
            <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{profile?.email}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              가입일: {new Date(profile?.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 20px' }}>
              <p style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: profile?.free_trial_used ? '#aaa' : '#f0c040' }}>
                {profile?.free_trial_used ? '0' : '1'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>무료 잔여</p>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 20px' }}>
              <p style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: '#f0c040' }}>
                {profile?.paid_credits || 0}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>유료 잔여</p>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 20px' }}>
              <p style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px' }}>
                {profile?.total_analyses || 0}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>총 분석</p>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 20px' }}>
              <p style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: (profile?.consistency_credits || 0) > 0 ? '#f0c040' : '#aaa' }}>
                {profile?.consistency_credits || 0}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>잡통 플러스</p>
            </div>
          </div>
        </div>

        {/* 잡통 플러스 크레딧 안내 배너 */}
        {(profile?.consistency_credits || 0) > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 16, padding: '18px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>🎁 잡통 플러스 {profile.consistency_credits}회 사용 가능</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>이력서와 자소서가 하나의 스토리로 읽히는지 무료로 대조 분석해드려요.</p>
            </div>
            <button onClick={() => window.location.href = '/consistency-check'} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              지금 검증하기 →
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f2244', margin: 0 }}>📋 분석 히스토리</h2>
          <button onClick={() => window.location.href = '/'}
            style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            새 분석 시작
          </button>
        </div>

        {/* 문서 유형 필터 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'all', label: '전체' },
            { key: 'coverletter', label: '✏️ 자기소개서' },
            { key: 'resume', label: '📋 이력서·경력기술서' },
            { key: 'consistency', label: '✨ 잡통 플러스' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setDocTypeFilter(tab.key as any)}
              style={{
                padding: '9px 16px', borderRadius: 20,
                border: `1.5px solid ${docTypeFilter === tab.key ? '#0f2244' : '#e5e3dc'}`,
                background: docTypeFilter === tab.key ? '#0f2244' : '#fff',
                color: docTypeFilter === tab.key ? '#fff' : '#555',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredAnalyses.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '60px', textAlign: 'center', border: '1px solid #ece9e1' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>
              {docTypeFilter === 'all' ? '아직 분석 기록이 없어요' : `아직 ${getDocTypeLabel(docTypeFilter)} 분석 기록이 없어요`}
            </p>
            <p style={{ fontSize: 14, color: '#aaa', marginBottom: 24 }}>서류를 분석하면 여기에 기록이 저장됩니다</p>
            <button onClick={() => window.location.href = '/'}
              style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              첫 분석 시작하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredAnalyses.map((analysis) => (
              <div key={analysis.id}
                onClick={() => setSelected(selected?.id === analysis.id ? null : analysis)}
                style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: selected?.id === analysis.id ? '2px solid #0f2244' : '1px solid #ece9e1', cursor: 'pointer', transition: 'all 0.2s' }}>

                {/* 히스토리 카드 헤더 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: selected?.id === analysis.id ? 16 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: getScoreColor(analysis.total_score) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: getScoreColor(analysis.total_score) }}>{analysis.total_score}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f2244', margin: '0 0 3px' }}>
                        {analysis.company || '회사 미입력'}{analysis.position ? ` · ${analysis.position}` : ''}
                      </p>
                      <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>
                        {new Date(analysis.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#eef2ff', color: '#4338ca', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                      {getDocTypeLabel(analysis.doc_type || 'coverletter')}
                    </span>
                    {analysis.doc_type === 'consistency' ? (
                      <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        무료 검증
                      </span>
                    ) : (
                      <span style={{ background: analysis.analyze_type === 'paid' ? '#0f2244' : '#f7f6f3', color: analysis.analyze_type === 'paid' ? '#fff' : '#888', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        {analysis.analyze_type === 'paid' ? '전체 분석' : '무료 분석'}
                      </span>
                    )}
                    <span style={{ background: getScoreColor(analysis.total_score) + '20', color: getScoreColor(analysis.total_score), fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                      {getScoreLabel(analysis.total_score)}
                    </span>
                    <span style={{ fontSize: 18, color: '#aaa', transition: 'transform 0.2s', transform: selected?.id === analysis.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▾
                    </span>
                  </div>
                </div>

                {/* 펼쳐진 결과 */}
                {selected?.id === analysis.id && analysis.result_json && analysis.doc_type === 'consistency' ? (
                  <div style={{ borderTop: '1px solid #f0ede6', paddingTop: 16 }}>
                    {/* 종합 총평 */}
                    <div style={{ marginBottom: 16, padding: '16px', background: '#f7f6f3', borderRadius: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>📋 종합 총평</p>
                      <p style={{ fontSize: 14, color: '#333', lineHeight: 1.8, margin: 0 }}>{analysis.result_json.summary}</p>
                    </div>

                    {/* 잘 연결된 부분 */}
                    {analysis.result_json.strongAlignments?.length > 0 && (
                      <div style={{ marginBottom: 16, padding: '14px 16px', background: '#ecfdf5', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>⭐ 일관되게 잘 연결된 부분</p>
                        {analysis.result_json.strongAlignments.map((p: string, i: number) => (
                          <p key={i} style={{ fontSize: 13, color: '#065f46', margin: '0 0 4px' }}>✓ {p}</p>
                        ))}
                      </div>
                    )}

                    {/* 보완 필요한 부분 */}
                    {analysis.result_json.gaps?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 10 }}>⚠️ 보완이 필요한 부분</p>
                        {analysis.result_json.gaps.map((gap: any, i: number) => (
                          <div key={i} style={{ padding: '14px 16px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #ece9e1' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#0f2244', margin: '0 0 6px' }}>#{i + 1} {gap.category} ({gap.missingIn} 보완 필요)</p>
                            <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.7 }}>{gap.issue}</p>
                            <div style={{ background: '#ecfdf5', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#064e3b' }}>{gap.suggestion}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 최종 조언 */}
                    {analysis.result_json.finalAdvice && (
                      <div style={{ padding: '14px 16px', background: '#0f2244', borderRadius: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#e6a800', marginBottom: 8 }}>🎯 최종 조언</p>
                        <p style={{ fontSize: 13, color: '#b8d9ee', lineHeight: 1.8, margin: 0 }}>{analysis.result_json.finalAdvice}</p>
                      </div>
                    )}
                  </div>
                ) : selected?.id === analysis.id && analysis.result_json && (
                  <div style={{ borderTop: '1px solid #f0ede6', paddingTop: 16 }}>

                    {/* 총평 */}
                    <div style={{ marginBottom: 16, padding: '16px', background: '#f7f6f3', borderRadius: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>🔍 총평</p>
                      <p style={{ fontSize: 14, color: '#333', lineHeight: 1.8, margin: 0 }}>{analysis.result_json.summary}</p>
                    </div>

                    {/* 핵심 문제 */}
                    <div style={{ marginBottom: 16, padding: '16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>⚠️ 핵심 문제</p>
                      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0 }}>{analysis.result_json.mainIssue}</p>
                    </div>

                    {/* 유료 분석 전체 결과 */}
                    {analysis.analyze_type === 'paid' && analysis.result_json.scores && (
                      <>
                        {/* PDF 저장 */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadHistoryPdf(analysis) }}
                            disabled={isDownloading}
                            style={{ background: '#fff', color: '#0f2244', border: '1.5px solid #0f2244', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: isDownloading ? 'default' : 'pointer', opacity: isDownloading ? 0.6 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isDownloading ? '⏳ 생성 중...' : '📄 PDF 저장'}
                          </button>
                        </div>

                        {/* 점수 */}
                        <div style={{ marginBottom: 16, padding: '16px', background: '#f7f6f3', borderRadius: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 12 }}>📊 항목별 점수</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {(analysis.doc_type === 'resume' ? scoreItemsResume : scoreItemsCoverLetter).map(item => {
                              const score = analysis.result_json.scores[item.key] || 0
                              return (
                                <div key={item.key}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                    <span style={{ color: '#555', fontWeight: 600 }}>{item.label}</span>
                                    <span style={{ fontWeight: 700, color: getScoreColor(score) }}>{score}점</span>
                                  </div>
                                  <div style={{ height: 6, background: '#e8e5dc', borderRadius: 3 }}>
                                    <div style={{ height: '100%', width: `${score}%`, background: getScoreColor(score), borderRadius: 3 }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* 개선 제안 */}
                        {analysis.result_json.improvements?.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 10 }}>✏️ {analysis.doc_type === 'resume' ? '구체적 개선 제안' : '문장 개선 제안'}</p>
                            {analysis.result_json.improvements.map((imp: any, i: number) => (
                              <div key={i} style={{ padding: '14px 16px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #ece9e1' }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#0f2244', margin: '0 0 6px' }}>#{i + 1} {imp.category}</p>
                                <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.7 }}>{imp.issue}</p>
                                {imp.original && <div style={{ background: '#fef2f2', borderRadius: 6, padding: '8px 10px', marginBottom: 6, fontSize: 12, color: '#7f1d1d' }}>BEFORE: "{imp.original}"</div>}
                                <div style={{ background: '#ecfdf5', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#064e3b' }}>AFTER: {imp.suggestion}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 잘 된 점 */}
                        {analysis.result_json.strongPoints?.length > 0 && (
                          <div style={{ marginBottom: 16, padding: '14px 16px', background: '#ecfdf5', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 8 }}>⭐ 잘 된 점</p>
                            {analysis.result_json.strongPoints.map((p: string, i: number) => (
                              <p key={i} style={{ fontSize: 13, color: '#065f46', margin: '0 0 4px' }}>✓ {p}</p>
                            ))}
                          </div>
                        )}

                        {/* 최종 조언 */}
                        {analysis.result_json.finalAdvice && (
                          <div style={{ padding: '14px 16px', background: '#0f2244', borderRadius: 12 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#e6a800', marginBottom: 8 }}>🎯 최종 조언</p>
                            <p style={{ fontSize: 13, color: '#b8d9ee', lineHeight: 1.8, margin: 0 }}>{analysis.result_json.finalAdvice}</p>
                          </div>
                        )}
                      </>
                    )}

                    {analysis.doc_type !== 'consistency' && (
                      <p style={{ fontSize: 12, color: '#bbb', textAlign: 'right', marginTop: 12, marginBottom: 0 }}>
                        {analysis.doc_type === 'resume' ? '첨부 문서' : '자소서'} {analysis.content_length?.toLocaleString()}자
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 인쇄용 — 마이페이지 히스토리에서 PDF 저장 시 사용 (화면에는 안 보임).
          PaidResult.tsx의 인쇄용 템플릿과 같은 구성으로 맞춰서, 방금 분석한
          결과를 받든 히스토리에서 다시 받든 같은 리포트가 나오도록 함. */}
      {selected && selected.result_json && (
        <div id="mypage-pdf-content" style={{ display: 'none' }}>
          <div style={{ fontFamily: "'Pretendard', sans-serif", padding: 20 }}>
            {/* 헤더 */}
            <div style={{ background: '#0f2244', color: '#fff', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e6a800', marginBottom: 8 }}>
                PREMIUM REPORT · {new Date(selected.created_at).toLocaleDateString('ko-KR')}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>{selectedReportTitle}</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {selected.company && selected.position ? `${selected.company} · ${selected.position}` : selected.company || selected.position || '지원 직무 전반'}
              </p>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>{selected.total_score}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>/ 100점 · {getScoreLabel(selected.total_score)}</span>
              </div>
            </div>

            {/* 총평 */}
            <div style={{ marginBottom: 20, padding: '20px 24px', background: '#f7f6f3', borderRadius: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 10 }}>📋 전문가 총평</h2>
              <p style={{ fontSize: 13, color: '#333', lineHeight: 1.8, margin: 0 }}>{selected.result_json.summary}</p>
            </div>

            {/* 핵심 문제 */}
            <div style={{ marginBottom: 20, padding: '20px 24px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 10 }}>⚠️ 가장 시급한 개선 과제</h2>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8, margin: 0 }}>{selected.result_json.mainIssue}</p>
            </div>

            {/* 점수 */}
            {selected.result_json.scores && (
              <div style={{ marginBottom: 20, padding: '20px 24px', background: '#f7f6f3', borderRadius: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>📊 역량 진단 점수</h2>
                {selectedScoreItems.map(item => {
                  const score = selected.result_json.scores[item.key] || 0
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

            {/* 개선 제안 */}
            {selected.result_json.improvements?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>✏️ {selectedImprovementTitle}</h2>
                {selected.result_json.improvements.map((imp: any, i: number) => (
                  <div key={i} style={{ padding: '18px 20px', background: '#fff', borderRadius: 12, marginBottom: 12, border: '1px solid #ece9e1' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2244', marginBottom: 8 }}>#{i + 1} {imp.category}</div>
                    <p style={{ fontSize: 12, color: '#555', marginBottom: 10, lineHeight: 1.7 }}>{imp.issue}</p>
                    {imp.original && <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#7f1d1d' }}>BEFORE: "{imp.original}"</div>}
                    <div style={{ background: '#ecfdf5', borderRadius: 8, padding: '8px 12px', marginBottom: imp.addContent ? 8 : 0, fontSize: 12, color: '#064e3b' }}>AFTER: {imp.suggestion}</div>
                    {imp.addContent && <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#1e40af' }}>추가: {imp.addContent}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* 잘 된 점 */}
            {selected.result_json.strongPoints?.length > 0 && (
              <div style={{ marginBottom: 20, padding: '20px 24px', background: '#ecfdf5', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#065f46', marginBottom: 12 }}>⭐ 잘 된 점</h2>
                {selected.result_json.strongPoints.map((p: string, i: number) => (
                  <p key={i} style={{ fontSize: 13, color: '#065f46', margin: '0 0 8px', lineHeight: 1.7 }}>✓ {p}</p>
                ))}
              </div>
            )}

            {/* 최종 조언 */}
            {selected.result_json.finalAdvice && (
              <div style={{ marginBottom: 20, padding: '20px 24px', background: '#0f2244', borderRadius: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 10 }}>🎯 전문가 최종 조언</h2>
                <p style={{ fontSize: 13, color: '#b8d9ee', lineHeight: 1.8, margin: 0 }}>{selected.result_json.finalAdvice}</p>
              </div>
            )}

            {/* 최종 제출 전 체크리스트 */}
            <div style={{ marginBottom: 20, padding: '20px 24px', background: '#f7f6f3', borderRadius: 12, border: '1px solid #ece9e1' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f2244', marginBottom: 14 }}>📝 최종 제출 전 체크리스트</h2>
              {getChecklistItems(selectedIsResume).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', background: '#fff', borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ color: '#0f2244', fontWeight: 700, flexShrink: 0 }}>☐</span>
                  <span style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* 이렇게 활용하세요 */}
            <div style={{ padding: '20px 24px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a' }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 12 }}>💡 이렇게 활용하세요</h2>
              {getUsageSteps(selectedIsResume).map((step, i) => (
                <p key={i} style={{ fontSize: 13, color: '#92400e', margin: '0 0 8px', lineHeight: 1.7 }}>{i + 1}. {step}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 버튼 */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px', textAlign: 'center' }}>
        <button
          onClick={() => { setShowWithdrawModal(true); setWithdrawError('') }}
          style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
        >
          회원 탈퇴
        </button>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f2244', marginBottom: 12 }}>정말 탈퇴하시겠습니까?</h3>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
              탈퇴 시 아래 모든 데이터가 즉시 삭제되며<br />
              <strong style={{ color: '#ef4444' }}>복구가 불가능합니다.</strong>
            </p>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 16px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: '#991b1b', margin: 0, lineHeight: 2 }}>
                ✕ 모든 서류 분석 기록<br />
                ✕ 잔여 분석 크레딧<br />
                ✕ 결제 내역<br />
                ✕ 계정 정보
              </p>
            </div>

            {withdrawError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                {withdrawError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{ flex: 1, background: '#f7f6f3', color: '#555', border: '1px solid #ddd', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 15, cursor: withdrawLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: withdrawLoading ? 0.7 : 1 }}
              >
                {withdrawLoading ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
