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

interface NaraNotice {
  idx: string
  title: string
  insttname: string
  pblanc_ty: string
  enddate: string
  regdate: string | null
}

type Tab = 'company' | 'public'

interface DisplayNotice {
  key: string
  title: string
  badgeLabel: string | null
  emphasize: boolean
  isNew: boolean
  endDate: string
  kind: Tab
  raw: JobNotice | NaraNotice
}

const PBLANC_TY_LABEL: Record<string, string> = {
  e01: '신입',
  e02: '경력',
  e03: '계약직',
  e04: '행정지원',
  e06: '공모직위',
}

function getDday(endDate: string) {
  const end = new Date(endDate + 'T23:59:59')
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return null
  if (diff === 0) return 'D-day'
  return `D-${diff}`
}

function naraDetailLink(idx: string) {
  return `https://www.gojobs.go.kr/apmView.do?empmnsn=${idx}&selMenuNo=400&menuNo=401&upperMenuNo=`
}

export default function JobNoticeBar() {
  const [companyNotices, setCompanyNotices] = useState<JobNotice[]>([])
  const [publicNotices, setPublicNotices] = useState<NaraNotice[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [selected, setSelected] = useState<DisplayNotice | null>(null)
  const [showListModal, setShowListModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      const todayStr = new Date().toISOString().slice(0, 10)

      const [{ data: company }, { data: pub }] = await Promise.all([
        supabase
          .from('job_notices')
          .select('*')
          .gte('application_end', todayStr)
          .order('application_end', { ascending: true }),
        supabase
          .from('nara_ilteo_notices')
          .select('*')
          .gte('enddate', todayStr)
          .order('enddate', { ascending: true }),
      ])

      if (company) setCompanyNotices(company)
      if (pub) setPublicNotices(pub)
    }
    load()
  }, [])

  if (companyNotices.length === 0 && publicNotices.length === 0) return null

  const toDisplay = (n: JobNotice | NaraNotice, kind: Tab): DisplayNotice => {
    if (kind === 'company') {
      const c = n as JobNotice
      return {
        key: c.id,
        title: c.title,
        badgeLabel: c.employment_type,
        emphasize: false,
        isNew: (Date.now() - new Date(c.created_at).getTime()) < 48 * 60 * 60 * 1000,
        endDate: c.application_end,
        kind,
        raw: c,
      }
    }
    const p = n as NaraNotice
    const regDaysAgo = p.regdate ? Math.floor((Date.now() - new Date(p.regdate + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) : 999
    return {
      key: p.idx,
      title: p.title,
      badgeLabel: PBLANC_TY_LABEL[p.pblanc_ty] || p.pblanc_ty,
      emphasize: p.pblanc_ty === 'e01',
      isNew: regDaysAgo <= 1,
      endDate: p.enddate,
      kind,
      raw: p,
    }
  }

  const activeList = (activeTab === 'company' ? companyNotices : publicNotices).map(n => toDisplay(n, activeTab))
  const visibleNotices = activeList.slice(0, 5)

  const renderRow = (n: DisplayNotice, big?: boolean) => {
    const dday = getDday(n.endDate)
    return (
      <button
        key={n.key}
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
          {n.isNew && (
            <span style={{ background: '#e6a800', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>NEW</span>
          )}
          {n.badgeLabel && (
            n.emphasize ? (
              <span style={{ fontSize: 11.5, color: '#fff', flexShrink: 0, background: '#0f2244', padding: '3px 10px', borderRadius: 20, fontWeight: 800 }}>{n.badgeLabel}</span>
            ) : (
              <span style={{ fontSize: 11.5, color: '#777', flexShrink: 0, background: '#f7f6f3', padding: '3px 9px', borderRadius: 20, fontWeight: 600 }}>{n.badgeLabel}</span>
            )
          )}
          {dday && <span style={{ fontSize: 12, fontWeight: 800, color: '#e6a800', flexShrink: 0, marginLeft: 'auto' }}>{dday}</span>}
        </div>
        <span style={{
          fontSize: big ? 16 : 15, color: '#1a1a1a', fontWeight: n.emphasize ? 800 : 700, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
        }}>{n.title}</span>
      </button>
    )
  }

  const TabSwitcher = () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
      <button
        onClick={() => setActiveTab('company')}
        style={{
          flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 700,
          background: activeTab === 'company' ? '#0f2244' : '#f7f6f3',
          color: activeTab === 'company' ? '#fff' : '#888',
        }}
      >
        일반 기업 {companyNotices.length > 0 && `(${companyNotices.length})`}
      </button>
      <button
        onClick={() => setActiveTab('public')}
        style={{
          flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 700,
          background: activeTab === 'public' ? '#0f2244' : '#f7f6f3',
          color: activeTab === 'public' ? '#fff' : '#888',
        }}
      >
        공공기관 {publicNotices.length > 0 && `(${publicNotices.length})`}
      </button>
    </div>
  )

  return (
    <>
      <div style={{ background: '#f7f6f3', padding: '40px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', boxShadow: '0 4px 20px rgba(15,34,68,0.05)', padding: '26px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
            <span style={{ fontSize: 19 }}>📢</span>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#0f2244', letterSpacing: '-0.3px' }}>채용 소식</span>
          </div>

          <TabSwitcher />

          {activeList.length === 0 ? (
            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0', margin: 0 }}>
              {activeTab === 'company' ? '등록된 기업 공고가 없어요.' : '모집중인 공공기관 공고가 없어요.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleNotices.map(n => renderRow(n))}
            </div>
          )}

          {activeList.length > 5 && (
            <button onClick={() => setShowListModal(true)} style={{ marginTop: 14, width: '100%', background: '#f7f6f3', border: 'none', borderRadius: 12, color: '#0f2244', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '12px' }}>
              모집중인 공고 전체 보기 ({activeList.length}건) ▾
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
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f2244', margin: 0 }}>📢 모집중인 공고 ({activeList.length}건)</h3>
              <button onClick={() => setShowListModal(false)} style={{ background: 'none', border: 'none', color: '#999', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px 0' }}>
              <TabSwitcher />
            </div>
            <div style={{ padding: '0 20px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeList.map(n => renderRow(n, true))}
            </div>
          </div>
        </div>
      )}

      {selected && selected.kind === 'company' && (() => {
        const c = selected.raw as JobNotice
        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,34,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, maxWidth: 460, width: '100%', maxHeight: '85vh', overflowY: 'auto', fontFamily: "'Pretendard', -apple-system, sans-serif", boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
            >
              <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: '24px 24px 0 0', padding: '28px 26px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {c.employment_type && (
                    <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 11px', borderRadius: 20 }}>{c.employment_type}</span>
                  )}
                  {getDday(c.application_end) && (
                    <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 20 }}>{getDday(c.application_end)}</span>
                  )}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.5 }}>{c.title}</h3>
              </div>

              <div style={{ padding: '24px 26px 26px' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <div style={{ flex: 1, background: '#f7f6f3', borderRadius: 14, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px', fontWeight: 700 }}>접수 기간</p>
                    <p style={{ fontSize: 13, color: '#222', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                      {c.application_start ? (
                        <>{c.application_start.slice(5).replace('-', '.')}<br />~ {c.application_end.slice(5).replace('-', '.')}</>
                      ) : (
                        <>~ {c.application_end.slice(5).replace('-', '.')} 마감</>
                      )}
                    </p>
                  </div>
                  {c.employment_type && (
                    <div style={{ flex: 1, background: '#f7f6f3', borderRadius: 14, padding: '14px 16px' }}>
                      <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px', fontWeight: 700 }}>고용 형태</p>
                      <p style={{ fontSize: 13, color: '#222', fontWeight: 700, margin: 0 }}>{c.employment_type}</p>
                    </div>
                  )}
                </div>

                {c.link && (
                  <a
                    href={c.link} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#0f2244', color: '#fff', borderRadius: 14, padding: '15px', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 20 }}
                  >
                    채용공고 원문 보기 <span style={{ fontSize: 13 }}>↗</span>
                  </a>
                )}

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
        )
      })()}

      {selected && selected.kind === 'public' && (() => {
        const p = selected.raw as NaraNotice
        const label = PBLANC_TY_LABEL[p.pblanc_ty] || p.pblanc_ty
        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,34,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 24, maxWidth: 460, width: '100%', maxHeight: '85vh', overflowY: 'auto', fontFamily: "'Pretendard', -apple-system, sans-serif", boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
            >
              <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: '24px 24px 0 0', padding: '28px 26px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <span style={{ background: p.pblanc_ty === 'e01' ? '#e6a800' : 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 20 }}>{label}</span>
                  {getDday(p.enddate) && (
                    <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 20 }}>{getDday(p.enddate)}</span>
                  )}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.5 }}>{p.title}</h3>
              </div>

              <div style={{ padding: '24px 26px 26px' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <div style={{ flex: 1, background: '#f7f6f3', borderRadius: 14, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px', fontWeight: 700 }}>접수 마감</p>
                    <p style={{ fontSize: 13, color: '#222', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>~ {p.enddate.slice(5).replace('-', '.')} 마감</p>
                  </div>
                  <div style={{ flex: 1, background: '#f7f6f3', borderRadius: 14, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px', fontWeight: 700 }}>모집 기관</p>
                    <p style={{ fontSize: 13, color: '#222', fontWeight: 700, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{p.insttname}</p>
                  </div>
                </div>

                <a
                  href={naraDetailLink(p.idx)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#0f2244', color: '#fff', borderRadius: 14, padding: '15px', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginBottom: 20 }}
                >
                  나라일터에서 원문 보기 <span style={{ fontSize: 13 }}>↗</span>
                </a>

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
        )
      })()}
    </>
  )
}
