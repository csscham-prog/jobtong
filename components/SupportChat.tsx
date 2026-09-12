'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender: 'user' | 'admin'
  content: string
  created_at: string
}

export default function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const loadMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      // 관리자가 보낸 메시지 중 안 읽은 것을 읽음 처리
      const unreadIds = data.filter(m => m.sender === 'admin' && !m.is_read_by_user).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('support_messages').update({ is_read_by_user: true }).in('id', unreadIds)
      }
    }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    setSending(true)
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: session.user.id,
        sender: 'user',
        content: input.trim(),
        is_read_by_admin: false,
      })
      .select()
      .single()

    setSending(false)
    if (!error && data) {
      setMessages(prev => [...prev, data])
      setInput('')
    }
  }

  if (loading) {
    return <p style={{ fontSize: 13, color: '#999', padding: '20px 0' }}>불러오는 중...</p>
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #ece9e1', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2244' }}>운영자에게 문의하기</span>
      </div>

      <div ref={scrollRef} style={{ height: 320, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f7f6f3' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#999', margin: 0 }}>궁금한 점이나 불편한 점을 편하게 남겨주세요.</p>
            <p style={{ fontSize: 12, color: '#bbb', margin: '4px 0 0' }}>운영자가 직접 확인하고 답변드려요.</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%' }}>
                {m.sender === 'admin' && (
                  <p style={{ fontSize: 11, color: '#999', margin: '0 0 3px', fontWeight: 700 }}>운영자</p>
                )}
                <div style={{
                  background: m.sender === 'user' ? '#0f2244' : '#fff',
                  color: m.sender === 'user' ? '#fff' : '#222',
                  border: m.sender === 'admin' ? '1px solid #ece9e1' : 'none',
                  borderRadius: m.sender === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 14px', fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
                <p style={{ fontSize: 10, color: '#bbb', margin: '4px 4px 0', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                  {new Date(m.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '14px 16px', borderTop: '1px solid #ece9e1' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder="메시지를 입력해주세요"
          style={{ flex: 1, padding: '11px 14px', borderRadius: 20, border: '1.5px solid #e5e3dc', fontSize: 13.5, fontFamily: 'inherit', color: '#222' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 20, padding: '0 20px', fontWeight: 700, fontSize: 13, cursor: sending ? 'default' : 'pointer', opacity: (sending || !input.trim()) ? 0.5 : 1, fontFamily: 'inherit' }}
        >
          전송
        </button>
      </div>
    </div>
  )
}
