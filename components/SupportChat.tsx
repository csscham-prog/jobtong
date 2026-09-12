'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender: 'user' | 'admin'
  content: string
  is_read_by_user: boolean
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sent' | 'received'>('sent')
  const [showCompose, setShowCompose] = useState(false)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sentDone, setSentDone] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setMessages(data)
      const unreadIds = data.filter(m => m.sender === 'admin' && !m.is_read_by_user).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('support_messages').update({ is_read_by_user: true }).in('id', unreadIds)
      }
    }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!content.trim() || sending) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setSending(true)
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: session.user.id,
        sender: 'user',
        content: content.trim(),
        is_read_by_admin: false,
      })
      .select()
      .single()

    setSending(false)
    if (!error && data) {
      setMessages(prev => [data, ...prev])
      setContent('')
      setShowCompose(false)
      setSentDone(true)
      setTab('sent')
      setTimeout(() => setSentDone(false), 3000)
    }
  }

  const sentMessages = messages.filter(m => m.sender === 'user')
  const receivedMessages = messages.filter(m => m.sender === 'admin')
  const unreadReceivedCount = receivedMessages.filter(m => !m.is_read_by_user).length
  const list = tab === 'sent' ? sentMessages : receivedMessages

  if (loading) {
    return <p style={{ fontSize: 13, color: '#999', padding: '20px 0' }}>불러오는 중...</p>
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #ece9e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>✉️</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2244' }}>운영자에게 문의하기</span>
          </div>
          <button
            onClick={() => setShowCompose(v => !v)}
            style={{ background: showCompose ? '#f7f6f3' : '#0f2244', color: showCompose ? '#666' : '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {showCompose ? '취소' : '+ 새 메시지'}
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: '#999', margin: 0 }}>실시간 채팅이 아니라 쪽지 방식이에요. 운영자가 확인 후 1~2일 내로 답변드려요.</p>
      </div>

      {showCompose && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #ece9e1', background: '#f7f6f3' }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="궁금한 점이나 불편한 점을 남겨주세요."
            style={{ width: '100%', minHeight: 90, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e3dc', fontSize: 13.5, fontFamily: 'inherit', color: '#222', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13.5, cursor: sending ? 'default' : 'pointer', opacity: (sending || !content.trim()) ? 0.5 : 1, fontFamily: 'inherit' }}
          >
            {sending ? '보내는 중...' : '메시지 보내기'}
          </button>
        </div>
      )}

      {sentDone && (
        <div style={{ padding: '10px 20px', background: '#ecfdf5', fontSize: 12.5, color: '#065f46', fontWeight: 600 }}>
          ✓ 메시지를 보냈어요. 운영자 확인 후 답변드릴게요.
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid #ece9e1' }}>
        <button
          onClick={() => setTab('sent')}
          style={{ flex: 1, padding: '11px', background: 'none', border: 'none', borderBottom: tab === 'sent' ? '2px solid #0f2244' : '2px solid transparent', color: tab === 'sent' ? '#0f2244' : '#999', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          보낸 메시지 {sentMessages.length > 0 && `(${sentMessages.length})`}
        </button>
        <button
          onClick={() => setTab('received')}
          style={{ flex: 1, padding: '11px', background: 'none', border: 'none', borderBottom: tab === 'received' ? '2px solid #0f2244' : '2px solid transparent', color: tab === 'received' ? '#0f2244' : '#999', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}
        >
          받은 메시지 {receivedMessages.length > 0 && `(${receivedMessages.length})`}
          {unreadReceivedCount > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 'calc(50% - 34px)', width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
          )}
        </button>
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {list.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#999', margin: 0 }}>
              {tab === 'sent' ? '보낸 메시지가 없어요.' : '아직 받은 답변이 없어요.'}
            </p>
          </div>
        ) : (
          list.map(m => (
            <div key={m.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f3f1eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#aaa' }}>{formatDate(m.created_at)}</span>
              </div>
              <p style={{ fontSize: 13.5, color: '#222', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
