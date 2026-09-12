'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminMessage {
  id: string
  content: string
  created_at: string
}

const SEEN_KEY = 'jobtong_support_seen_ids'

function getSeenIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
  } catch {
    return []
  }
}

export default function NewMessageAlert() {
  const [unread, setUnread] = useState<AdminMessage[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase
        .from('support_messages')
        .select('id, content, created_at')
        .eq('user_id', session.user.id)
        .eq('sender', 'admin')
        .eq('is_read_by_user', false)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) return

      const seenIds = getSeenIds()
      const newOnes = data.filter(m => !seenIds.includes(m.id))
      if (newOnes.length > 0) {
        setUnread(data)
        setShow(true)
      }
    }
    check()
  }, [])

  const handleDismiss = () => {
    const seenIds = getSeenIds()
    const updated = Array.from(new Set([...seenIds, ...unread.map(m => m.id)])).slice(-100)
    localStorage.setItem(SEEN_KEY, JSON.stringify(updated))
    setShow(false)
  }

  if (!show || unread.length === 0) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,34,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 380, width: '100%', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>✉️</span>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>운영자에게 답장이 왔어요</h3>
        </div>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>{unread.length}개의 새 쪽지가 도착했어요.</p>

        <div style={{ background: '#f7f6f3', borderRadius: 12, padding: '14px 16px', marginBottom: 20, maxHeight: 160, overflowY: 'auto' }}>
          <p style={{ fontSize: 13.5, color: '#333', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{unread[0].content}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDismiss} style={{ flex: 1, background: '#f7f6f3', color: '#444', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            나중에
          </button>
          <button
            onClick={() => { handleDismiss(); window.location.href = '/mypage#support' }}
            style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            확인하러 가기
          </button>
        </div>
      </div>
    </div>
  )
}
