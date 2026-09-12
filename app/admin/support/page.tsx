'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'csscham@naver.com'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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
  const [selectedEmail, setSelectedEmail] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

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

  const openThread = async (userId: string, email: string) => {
    setSelectedUserId(userId)
    setSelectedEmail(email)
    setShowReplyBox(false)
    setTab('received')
    setMessagesLoading(true)
    const res = await fetch(`/api/admin/support/${userId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
    setMessagesLoading(false)
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
      setShowReplyBox(false)
      setTab('sent')
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

  const receivedMessages = messages.filter(m => m.sender === 'user')
  const sentMessages = messages.filter(m => m.sender === 'admin')
  const list = tab === 'received' ? receivedMessages : sentMessages

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
                  onClick={() => openThread(t.userId, t.email)}
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

        {/* 선택된 유저의 쪽지함 */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', display: 'flex', flexDirection: 'column' }}>
          {!selectedUserId ? (
            <div style={{ padding: '80px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#999' }}>왼쪽에서 유저를 선택해주세요.</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #ece9e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f2244' }}>{selectedEmail}</span>
                <button
                  onClick={() => setShowReplyBox(v => !v)}
                  style={{ background: showReplyBox ? '#f7f6f3' : '#0f2244', color: showReplyBox ? '#666' : '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {showReplyBox ? '취소' : '✉️ 답장하기'}
                </button>
              </div>

              {showReplyBox && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #ece9e1', background: '#f7f6f3' }}>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="답장을 입력해주세요"
                    style={{ width: '100%', minHeight: 90, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e3dc', fontSize: 14, fontFamily: 'inherit', color: '#222', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending || !reply.trim()}
                    style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 14, cursor: sending ? 'default' : 'pointer', opacity: (sending || !reply.trim()) ? 0.5 : 1, fontFamily: 'inherit' }}
                  >
                    {sending ? '보내는 중...' : '답장 보내기'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', borderBottom: '1px solid #ece9e1' }}>
                <button
                  onClick={() => setTab('received')}
                  style={{ flex: 1, padding: '11px', background: 'none', border: 'none', borderBottom: tab === 'received' ? '2px solid #0f2244' : '2px solid transparent', color: tab === 'received' ? '#0f2244' : '#999', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  받은 쪽지 {receivedMessages.length > 0 && `(${receivedMessages.length})`}
                </button>
                <button
                  onClick={() => setTab('sent')}
                  style={{ flex: 1, padding: '11px', background: 'none', border: 'none', borderBottom: tab === 'sent' ? '2px solid #0f2244' : '2px solid transparent', color: tab === 'sent' ? '#0f2244' : '#999', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  보낸 쪽지 {sentMessages.length > 0 && `(${sentMessages.length})`}
                </button>
              </div>

              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {messagesLoading ? (
                  <p style={{ fontSize: 13, color: '#999', padding: '20px' }}>불러오는 중...</p>
                ) : list.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#999', padding: '32px 20px', textAlign: 'center' }}>
                    {tab === 'received' ? '받은 쪽지가 없어요.' : '보낸 쪽지가 없어요.'}
                  </p>
                ) : (
                  list.map(m => (
                    <div key={m.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f3f1eb' }}>
                      <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 6px' }}>{formatDate(m.created_at)}</p>
                      <p style={{ fontSize: 14, color: '#222', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
