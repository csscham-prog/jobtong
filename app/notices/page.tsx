'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Notice {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('notices')
        .select('id, title, content, is_pinned, created_at')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (data) setNotices(data)
      setLoading(false)
    }
    load()
  }, [])

  const dark = '#0a0f1e'
  const darkCard = 'rgba(255,255,255,0.06)'
  const darkBorder = 'rgba(255,255,255,0.12)'
  const textMain = '#ffffff'
  const textSub = 'rgba(255,255,255,0.75)'
  const textMuted = 'rgba(255,255,255,0.45)'
  const point = '#e6a800'

  return (
    <div style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: dark, minHeight: '100vh', color: textMain }}>
      <header style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${darkBorder}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => window.location.href = '/'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: '#e6a800', borderRadius: '50%' }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>J</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: textMain, letterSpacing: '-0.5px' }}>잡통</span>
        </button>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(230,168,0,0.12)', border: '1px solid rgba(230,168,0,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: point, marginBottom: 16 }}>
            📢 공지사항
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: textMain, letterSpacing: '-1px' }}>
            잡통 소식
          </h1>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: textMuted, fontSize: 14 }}>불러오는 중...</p>
        ) : notices.length === 0 ? (
          <p style={{ textAlign: 'center', color: textMuted, fontSize: 14 }}>등록된 공지사항이 없어요.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notices.map(n => {
              const isOpen = openId === n.id
              return (
                <div key={n.id} style={{ background: darkCard, border: `1px solid ${darkBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : n.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  >
                    {n.is_pinned && (
                      <span style={{ background: point, color: '#0a0f1e', fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20, flexShrink: 0 }}>📌 고정</span>
                    )}
                    <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: textMain }}>{n.title}</span>
                    <span style={{ fontSize: 12, color: textMuted, flexShrink: 0 }}>
                      {new Date(n.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span style={{ fontSize: 14, color: textMuted, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
                  </button>
                  {isOpen && (
                    <div
                      style={{ padding: '0 24px 24px', fontSize: 14.5, color: textSub, lineHeight: 1.9, wordBreak: 'keep-all' }}
                      dangerouslySetInnerHTML={{ __html: n.content }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer style={{ background: '#050b14', padding: '28px 24px', borderTop: `1px solid ${darkBorder}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© 2026 바른어플리케이션. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
