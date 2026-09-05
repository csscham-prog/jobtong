'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'csscham@naver.com'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 800, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

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

export default function JobNoticesAdminPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)
  const [accessToken, setAccessToken] = useState('')

  const [notices, setNotices] = useState<JobNotice[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'expired'>('active')

  const [title, setTitle] = useState('')
  const [applicationStart, setApplicationStart] = useState('')
  const [applicationEnd, setApplicationEnd] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [link, setLink] = useState('')
  const [adContent, setAdContent] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      if (session.user.email !== ADMIN_EMAIL) {
        setIsAllowed(false)
        setAuthLoading(false)
        return
      }
      setAccessToken(session.access_token)
      setIsAllowed(true)
      setAuthLoading(false)
      loadNotices(session.access_token)
    }
    init()
  }, [])

  const loadNotices = async (token: string) => {
    setListLoading(true)
    const res = await fetch('/api/admin/job-notices', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setNotices(data)
    }
    setListLoading(false)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const activeNotices = notices.filter(n => n.application_end >= todayStr)
  const expiredNotices = notices.filter(n => n.application_end < todayStr)

  const handleSubmit = async () => {
    if (!title.trim() || !applicationEnd) {
      setError('공고 제목과 접수 종료일은 필수예요.')
      return
    }
    setError('')
    setSaving(true)
    const res = await fetch('/api/admin/job-notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        title: title.trim(),
        applicationStart: applicationStart || null,
        applicationEnd,
        employmentType: employmentType || null,
        link: link.trim() || null,
        adContent: adContent.trim() || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || '등록 중 오류가 발생했습니다.')
      return
    }
    setTitle(''); setApplicationStart(''); setApplicationEnd(''); setEmploymentType(''); setLink(''); setAdContent('')
    loadNotices(accessToken)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 공고를 완전히 삭제할까요? 복구할 수 없어요.')) return
    const res = await fetch(`/api/admin/job-notices/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) loadNotices(accessToken)
  }

  if (authLoading) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontSize: 14 }}>불러오는 중...</p>
      </main>
    )
  }

  if (!isAllowed) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 700 }}>접근 권한이 없습니다.</p>
      </main>
    )
  }

  const list = tab === 'active' ? activeNotices : expiredNotices

  return (
    <main style={base}>
      <header style={headerStyle}>
        <div style={headerInner}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
            잡통
          </button>
          <span style={{ fontSize: 13, color: '#666' }}>채용공고 관리</span>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 60px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f2244', margin: '0 0 20px' }}>📢 채용공고 등록</h1>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '22px', marginBottom: 32 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>공고 제목 *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 삼성전자 2026년 하반기 신입 공채"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>접수 시작일</label>
              <input
                type="date"
                value={applicationStart}
                onChange={e => setApplicationStart(e.target.value)}
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>접수 종료일 *</label>
              <input
                type="date"
                value={applicationEnd}
                onChange={e => setApplicationEnd(e.target.value)}
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>고용 형태</label>
            <select
              value={employmentType}
              onChange={e => setEmploymentType(e.target.value)}
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', background: '#fff', boxSizing: 'border-box' }}
            >
              <option value="">선택 안 함</option>
              <option value="정규직">정규직</option>
              <option value="계약직">계약직</option>
              <option value="인턴">인턴</option>
              <option value="수시채용">수시채용</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>채용공고 링크</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://..."
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>광고 영역 (자유 입력, 줄바꿈 그대로 표시되고 URL은 자동으로 링크 처리돼요)</label>
            <textarea
              value={adContent}
              onChange={e => setAdContent(e.target.value)}
              placeholder={'예)\n🔥이 공고랑 같이 보면 딱 좋은 정보🔥\n\n📣9월 1주 인기 공고 리스트\nhttps://...'}
              style={{ width: '100%', minHeight: 140, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 13, fontFamily: 'inherit', color: '#222', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={saving} style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {saving ? '등록 중...' : '공고 등록하기'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'active' as const, label: `진행중 공고 (${activeNotices.length})` },
            { key: 'expired' as const, label: `마감된 공고 (${expiredNotices.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '9px 16px', borderRadius: 10, border: tab === t.key ? '2px solid #0f2244' : '1px solid #ddd',
                background: tab === t.key ? '#0f2244' : '#fff', color: tab === t.key ? '#fff' : '#555',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {listLoading ? (
          <p style={{ fontSize: 13, color: '#999' }}>불러오는 중...</p>
        ) : list.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>등록된 공고가 없어요.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map(n => {
              const isNew = (Date.now() - new Date(n.created_at).getTime()) < 48 * 60 * 60 * 1000
              return (
                <div key={n.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #ece9e1', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {isNew && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>NEW</span>}
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#222' }}>{n.title}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                      {n.employment_type ? `${n.employment_type} · ` : ''}
                      {n.application_start ? `${n.application_start} ~ ` : ''}{n.application_end} 마감
                    </p>
                  </div>
                  <button onClick={() => handleDelete(n.id)} style={{ background: '#fef2f2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    삭제
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
