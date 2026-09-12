'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = 'csscham@naver.com'
const SEEN_KEY = 'jobtong_admin_support_seen_ids'

function getSeenIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
  } catch {
    return []
  }
}

interface UnreadMessage {
  id: string
  content: string
}

export default function AdminMessageAlert() {
  const [unreadIds, setUnreadIds] = useState<string[]>([])
  const [count, setCount] = useState(0)
  const [preview, setPreview] = useState('')
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== ADMIN_EMAIL) return

      const res = await fetch('/api/admin/support/unread', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      if (!res.ok) return
      const data: { messages: UnreadMessage[] } = await res.json()
      if (!data.messages || data.messages.length === 0) return

      const seenIds = getSeenIds()
      const ids = data.messages.map(m => m.id)
      const newOnes = ids.filter(id => !seenIds.includes(id))
      if (newOnes.length > 0) {
        setUnreadIds(ids)
        setCount(data.messages.length)
        setPreview(data.messages[0].content)
        setShow(true)
      }
    }
    check()
  }, [])

  const handleDismiss = () => {
    const seenIds = getSeenIds()
    const updated = Array.from(new Set([...seenIds, ...unreadIds])).slice(-200)
    localStorage.setItem(SEEN_KEY, JSON.stringify(updated))
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,34,68,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 380, width: '100%', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>✉️</span>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>새 문의가 도착했어요</h3>
        </div>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>{count}개의 안 읽은 쪽지가 있어요.</p>

        <div style={{ background: '#f7f6f3', borderRadius: 12, padding: '14px 16px', marginBottom: 20, maxHeight: 160, overflowY: 'auto' }}>
          <p style={{ fontSize: 13.5, color: '#333', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{preview}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDismiss} style={{ flex: 1, background: '#f7f6f3', color: '#444', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            나중에
          </button>
          <button
            onClick={() => { handleDismiss(); window.location.href = '/admin/support' }}
            style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            확인하러 가기
          </button>
        </div>
      </div>
    </div>
  )
}
