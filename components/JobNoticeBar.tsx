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

interface AdBlock {
  lines: string[]
  urls: string[]
}

// 광고 영역 텍스트를 빈 줄 기준으로 블록화하고, 각 블록에서 URL을 따로 추출해서
// 카드형 UI로 깔끔하게 표시하기 위한 파서 (raw text + 밑줄 링크 나열 방식을 피하기 위함)
function parseAdContent(raw: string): AdBlock[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return raw
    .split(/\n\s*\n/)
    .map(block => {
      const urls = block.match(urlRegex) || []
      const lines = block
        .replace(urlRegex, '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
      return { lines, urls }
    })
    .filter(b => b.lines.length > 0 || b.urls.length > 0)
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
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const load = async () => {
      const todayStr = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('job_notices')
        .select('*')
        .gte('application_end', todayStr)
        .order('created_at', { ascending: false })
      if (data) setNotices(data)
    }
    load()
  }, [])

  if (notices.length === 0) return null

  const visibleNotices = showAll ? notices : notices.slice(0, 4)

  return (
    <>
      <div style={{ background: '#fff', borderBottom: '1px solid #ece9e1' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 15 }}>📢</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', letterSpacing: '-0.2px' }}>채용 소식</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {visibleNotices.map(n => {
              const isNew = (Date.now() - new Date(n.created_at).getTime()) < 48 * 60 * 60 * 1000
              const dday = getDday(n.application_end)
              return (
                <button
                  key={n.id}
                  onClick={() => setSelected(n)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none',
                    padding: '10px 8px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
                    borderRadius: 10, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7f6f3')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {isNew ? (
                    <span style={{ background: '#e6a800', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>NEW</span>
                  ) : (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d5d2c8', flexShrink: 0, marginLeft: 4, marginRight: 2 }} />
                  )}
                  <span style={{ fontSize: 14, color: '#222', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{n.title}</span>
                  {n.employment_type && (
                    <span style={{ fontSize: 11, color: '#888', flexShrink: 0, background: '#f7f6f3', padding: '3px 9px', borderRadius: 20 }}>{n.employment_type}</span>
                  )}
                  {dday && <span style={{ fontSize: 12, fontWeight: 800, color: '#e6a800', flexShrink: 0, minWidth: 44, textAlign: 'right' }}>{dday}</span>}
                </button>
              )
            })}
          </div>
          {notices.length > 4 && !showAll && (
            <button onClick={() => setShowAll(true)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#0f2244', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}>
              공고 {notices.length - 4}개 더보기 ▾
            </button>
          )}
        </div>
      </div>

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

              {/* 광고 영역 — 블록별 카드 UI */}
              {selected.ad_content && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 12px' }}>
                    <div style={{ flex: 1, height: 1, background: '#ece9e1' }} />
                    <span style={{ fontSize: 11, color: '#aaa', fontWeight: 700 }}>함께 보면 좋은 정보</span>
                    <div style={{ flex: 1, height: 1, background: '#ece9e1' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {parseAdContent(selected.ad_content).map((block, i) => (
                      <div key={i} style={{ background: '#fdf9f0', border: '1px solid #f5e6bf', borderRadius: 14, padding: '14px 16px' }}>
                        {block.lines.map((line, li) => (
                          <p key={li} style={{
                            fontSize: li === 0 ? 13.5 : 12.5,
                            fontWeight: li === 0 ? 700 : 500,
                            color: li === 0 ? '#8a6a12' : '#a5854a',
                            margin: li === 0 ? '0 0 4px' : '0 0 2px',
                            lineHeight: 1.6,
                          }}>
                            {line}
                          </p>
                        ))}
                        {block.urls.map((url, ui) => (
                          <a
                            key={ui} href={url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, background: '#fff', border: '1px solid #f0dca0', color: '#8a6a12', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 20, textDecoration: 'none' }}
                          >
                            바로가기 ↗
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
