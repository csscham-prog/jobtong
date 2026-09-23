'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import NoticeEditor from '@/components/NoticeEditor'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

interface Notice {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export default function AdminNoticesPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)
  const [accessToken, setAccessToken] = useState('')

  const [notices, setNotices] = useState<Notice[]>([])
  const [listLoading, setListLoading] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [isPublished, setIsPublished] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role !== 'admin') {
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
    const res = await fetch('/api/admin/notices', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) setNotices(await res.json())
    setListLoading(false)
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setIsPinned(false)
    setIsPublished(true)
    setError('')
    setShowForm(false)
  }

  const openNewForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (n: Notice) => {
    setEditingId(n.id)
    setTitle(n.title)
    setContent(n.content)
    setIsPinned(n.is_pinned)
    setIsPublished(n.is_published)
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }
    setError('')
    setSaving(true)

    const isEdit = !!editingId
    const url = isEdit ? `/api/admin/notices/${editingId}` : '/api/admin/notices'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ title: title.trim(), content, isPinned, isPublished }),
    })

    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || '저장 중 오류가 발생했습니다.')
      return
    }
    resetForm()
    loadNotices(accessToken)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 공지를 완전히 삭제할까요? 복구할 수 없어요.')) return
    const res = await fetch(`/api/admin/notices/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) loadNotices(accessToken)
  }

  const handleTogglePinned = async (n: Notice) => {
    const res = await fetch(`/api/admin/notices/${n.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ isPinned: !n.is_pinned }),
    })
    if (res.ok) loadNotices(accessToken)
  }

  const handleTogglePublished = async (n: Notice) => {
    const res = await fetch(`/api/admin/notices/${n.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ isPublished: !n.is_published }),
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

  return (
    <main style={base}>
      <header style={headerStyle}>
        <div style={headerInner}>
          <button onClick={() => window.location.href = '/admin'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
            잡통
          </button>
          <span style={{ fontSize: 13, color: '#666' }}>공지사항 관리</span>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f2244', margin: 0 }}>📢 공지사항 관리</h1>
          {!showForm && (
            <button onClick={openNewForm} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              + 새 공지 작성
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '22px', marginBottom: 28 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>제목 *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="공지 제목을 입력해주세요"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>내용 *</label>
              <NoticeEditor value={content} onChange={setContent} />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#333', cursor: 'pointer' }}>
                <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} />
                📌 상단 고정
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#333', cursor: 'pointer' }}>
                <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                즉시 발행 (해제 시 임시저장)
              </label>
            </div>

            {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
                {saving ? '저장 중...' : editingId ? '수정 완료' : '등록하기'}
              </button>
              <button onClick={resetForm} style={{ flex: 1, background: '#f7f6f3', color: '#555', border: '1px solid #ddd', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
            </div>
          </div>
        )}

        {listLoading ? (
          <p style={{ fontSize: 13, color: '#999' }}>불러오는 중...</p>
        ) : notices.length === 0 ? (
          <p style={{ fontSize: 13, color: '#999' }}>등록된 공지사항이 없어요.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notices.map(n => (
              <div key={n.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #ece9e1', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {n.is_pinned && <span style={{ background: '#e6a800', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>📌 고정</span>}
                    {!n.is_published && <span style={{ background: '#f3f4f6', color: '#888', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>임시저장</span>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#999', margin: 0 }}>{new Date(n.created_at).toLocaleString('ko-KR')}</p>
                </div>
                <button onClick={() => handleTogglePinned(n)} style={{ background: n.is_pinned ? '#fffbeb' : '#f7f6f3', color: n.is_pinned ? '#92400e' : '#666', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {n.is_pinned ? '고정 해제' : '상단 고정'}
                </button>
                <button onClick={() => handleTogglePublished(n)} style={{ background: n.is_published ? '#ecfdf5' : '#f7f6f3', color: n.is_published ? '#065f46' : '#666', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {n.is_published ? '숨기기' : '발행하기'}
                </button>
                <button onClick={() => openEditForm(n)} style={{ background: '#eef2ff', color: '#3730a3', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  수정
                </button>
                <button onClick={() => handleDelete(n.id)} style={{ background: '#fef2f2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
