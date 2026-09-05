'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface JobNotice {
  id: string
  title: string
  application_start: string | null
  application_end: string
  employment_type: string | null
  link: string | null
  ad_content: string | null
  created_at: string
}

function getDday(endDate: string) {
  const end = new Date(endDate + 'T23:59:59')
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return null
  if (diff === 0) return 'D-day'
  return `D-${diff}`
}

export default function JobNoticeBar() {
  const [notices, setNotices] = useState<JobNotice[]>([])
  const [selected, setSelected] = useState<JobNotice | null>(null)
  const [showListModal, setShowListModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      const todayStr = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('job_notices')
        .select('*')
        .gte('application_end', todayStr)
        .order('application_end', { ascending: true })
      if (data) setNotices(data)
    }
    load()
  }, [])

  if (notices.length === 0) return null

  const visibleNotices = notices.slice(0, 5)

  const renderRow = (n: JobNotice, big?: boolean) => {
    const isNew = (Date.now() - new Date(n.created_at).getTime()) < 48 * 60 * 60 * 1000
    const dday = getDday(n.application_end)
    return (
      <button
        key={n.id}
        onClick={() => { setSelected(n); setShowListModal(false) }}
        style={{
          display: 'flex', flexDirection: 'column', gap: 6, background: '#fff', border: '1px solid #ece9e1',
          padding: big ? '14px 16px' : '12px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
          borderRadius: 12, transition: 'border-color 0.15s, background 0.15s', boxSizing: 'border-box',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f7f6f3'; e.currentTarget.style.borderColor = '#d5d2c8' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ece9e1' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isNew && (
            <span style={{ background: '#e6a800', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>NEW</span>
          )}
          {n.employment_type && (
            <span style={{ fontSize: 11.5, color: '#777', flexShrink: 0, background: '#f7f6f3', padding: '3px 9px', borderRadius: 20, fontWeight: 600 }}>{n.employment_type}</span>
          )}
          {dday && <span style={{ fontSize: 12, fontWeight: 800, color: '#e6a800', flexShrink: 0, marginLeft: 'auto' }}>{dday}</span>}
        </div>
        <span style={{
          fontSize: big ? 16 : 15, color: '#1a1a1a', fontWeight: 700, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
        }}>{n.title}</span>
      </button>
    )
  }

  return (
    <>
      <div style={{ background: '#f7f6f3', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', boxShadow: '0 4px 20px rgba(15,34,68,0.05)', padding: '26px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
            <span style={{ fontSize: 19 }}>📢</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#0f2244', letterSpacing: '-0.3px' }}>채용 소식</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleNotices.map(n => renderRow(n))}
          </div>
          {notices.length > 5 && (
            <button onClick={() => setShowListModal(true)} style={{ marginTop: 14, width: '100%', background: '#f7f6f3', border: 'none', borderRadius: 12, color: '#0f2244', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '12px' }}>
              모집중인 공고 전체 보기 ({notices.length}건) ▾
            </button>
          )}
        </div>
      </div>

      {showListModal && (
        <div onClick={() => setShowListModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,34,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 24, maxWidth: 520, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard', -apple-system, sans-serif", boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
          >
            <div style={{ padding: '22px 26px', borderBottom: '1px solid #ece9e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f2244', margin: 0 }}>📢 모집중인 공고 ({notices.length}건)</h3>
              <button onClick={() => setShowListModal(false)} style={{ background: 'none', border: 'none', color: '#999', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notices.map(n => renderRow(n, true))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,34,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 24, maxWidth: 460, width: '100%', maxHeight: '85vh', overflowY: 'auto', fontFamily: "'Pretendard', -apple-system, sans-serif", boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
          >
            {/* 헤더 */}
            <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: '24px 24px 0 0', padding: '28px 26px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {selected.employment_type && (
                  <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20 }}>{selected.employment_type}</span>
                )}
                {getDday(selected.application_end) && (
                  <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 20 }}>{getDday(selected.application_end)}</span>
                )}
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.5 }}>{selected.title}</h3>
            </div>

            <div style={{ padding: '24px 26px 26px' }}>
              {/* 접수 정보 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, background: '#f7f6f3', borderRadius: 14, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px', fontWeight: 700 }}>접수 기간</p>
                  <p style={{ fontSize: 13, color: '#222', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                    {selected.application_start ? (
                      <>{selected.application_start.slice(5).replace('-', '.')}<br />~ {selected.application_end.slice(5).replace('-', '.')}</>
                    ) : (
                      <>~ {selected.application_end.slice(5).replace('-', '.')} 마감</>
                    )}
                  </p>
                </div>
                {selected.employment_type && (
                  <div style={{ flex: 1, background: '#f7f6f3', borderRadius: 14, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px', fontWeight: 700 }}>고용 형태</p>
                    <p style={{ fontSize: 13, color: '#222', fontWeight: 700, margin: 0 }}>{selected.employment_type}</p>
                  </div>
                )}
              </div>

              {/* 채용공고 링크 */}
              {selected.link && (
                <a
                  href={selected.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#0f2244', color: '#fff', borderRadius: 14, padding: '15px', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 20 }}
                >
                  채용공고 원문 보기 <span style={{ fontSize: 13 }}>↗</span>
                </a>
              )}

              {/* 광고 영역 — 잡통 기능 소개 (모든 공고 공통 고정) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 12px' }}>
                  <div style={{ flex: 1, height: 1, background: '#ece9e1' }} />
                  <span style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>이 공고, 잡통과 함께 준비하세요</span>
                  <div style={{ flex: 1, height: 1, background: '#ece9e1' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '📝', title: '취업 서류 정밀 분석', desc: '자소서·이력서를 논리성·구체성까지 냉정하게 진단', link: '/?start=analyze' },
                    { icon: '🎤', title: '모의 면접', desc: '서류 기반 맞춤 질문에 답하고 AI 피드백 받기', link: '/mock-interview' },
                    { icon: '🧭', title: '취업 준비도 자가진단', desc: '2분이면 끝, 지금 내 준비 상태 점검하기', link: '/readiness-check' },
                  ].map((f, i) => (
                    <a
                      key={i} href={f.link}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fdf9f0', border: '1px solid #f5e6bf', borderRadius: 14, padding: '13px 15px', textDecoration: 'none' }}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#8a6a12', margin: '0 0 2px' }}>{f.title}</p>
                        <p style={{ fontSize: 11.5, color: '#a5854a', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                      </div>
                      <span style={{ fontSize: 14, color: '#c9a227', flexShrink: 0 }}>→</span>
                    </a>
                  ))}
                </div>
              </div>

              <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 20, background: '#f7f6f3', color: '#666', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
