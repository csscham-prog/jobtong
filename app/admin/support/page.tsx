'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'csscham@naver.com'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

interface Thread {
  userId: string
  email: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

interface Message {
  id: string
  sender: 'user' | 'admin'
  content: string
  created_at: string
}

export default function AdminSupportPage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)
  const [accessToken, setAccessToken] = useState('')

  const [threads, setThreads] = useState<Thread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
      loadThreads(session.access_token)
    }
    init()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const loadThreads = async (token: string) => {
    setThreadsLoading(true)
    const res = await fetch('/api/admin/support', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setThreads(data)
    }
    setThreadsLoading(false)
  }

  const openThread = async (userId: string) => {
    setSelectedUserId(userId)
    setMessagesLoading(true)
    const res = await fetch(`/api/admin/support/${userId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
    setMessagesLoading(false)
    // 읽음 처리됐으니 목록의 안 읽음 배지도 갱신
    setThreads(prev => prev.map(t => t.userId === userId ? { ...t, unreadCount: 0 } : t))
  }

  const handleReply = async () => {
    if (!reply.trim() || sending || !selectedUserId) return
    setSending(true)
    const res = await fetch(`/api/admin/support/${selectedUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ content: reply.trim() }),
    })
    setSending(false)
    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, data])
      setReply('')
      loadThreads(accessToken)
    }
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
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
            잡통
          </button>
          <span style={{ fontSize: 13, color: '#666' }}>문의 관리</span>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

        {/* 유저 목록 */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #ece9e1' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', margin: 0 }}>문의한 유저 ({threads.length})</p>
          </div>
          {threadsLoading ? (
            <p style={{ fontSize: 13, color: '#999', padding: '20px' }}>불러오는 중...</p>
          ) : threads.length === 0 ? (
            <p style={{ fontSize: 13, color: '#999', padding: '20px' }}>아직 문의가 없어요.</p>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {threads.map(t => (
                <button
                  key={t.userId}
                  onClick={() => openThread(t.userId)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '14px 18px', border: 'none',
                    borderBottom: '1px solid #f3f1eb', background: selectedUserId === t.userId ? '#eef2ff' : '#fff',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {t.unreadCount > 0 && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />}
                    <span style={{ fontSize: 13, fontWeight: t.unreadCount > 0 ? 800 : 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.lastMessage}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 스레드 */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', display: 'flex', flexDirection: 'column', height: 680 }}>
          {!selectedUserId ? (
            <div style={{ margin: 'auto', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#999' }}>왼쪽에서 유저를 선택해주세요.</p>
            </div>
          ) : (
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, background: '#f7f6f3' }}>
                {messagesLoading ? (
                  <p style={{ fontSize: 13, color: '#999', margin: 'auto' }}>불러오는 중...</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{
                          background: m.sender === 'admin' ? '#0f2244' : '#fff',
                          color: m.sender === 'admin' ? '#fff' : '#222',
                          border: m.sender === 'user' ? '1px solid #ece9e1' : 'none',
                          borderRadius: m.sender === 'admin' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          padding: '11px 15px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {m.content}
                        </div>
                        <p style={{ fontSize: 10, color: '#bbb', margin: '4px 4px 0', textAlign: m.sender === 'admin' ? 'right' : 'left' }}>
                          {new Date(m.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '16px 20px', borderTop: '1px solid #ece9e1' }}>
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleReply() }}
                  placeholder="답장을 입력해주세요"
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 20, border: '1.5px solid #e5e3dc', fontSize: 14, fontFamily: 'inherit', color: '#222' }}
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 20, padding: '0 22px', fontWeight: 700, fontSize: 14, cursor: sending ? 'default' : 'pointer', opacity: (sending || !reply.trim()) ? 0.5 : 1, fontFamily: 'inherit' }}
                >
                  전송
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
