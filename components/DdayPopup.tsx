'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TodayEvent {
  id: string
  title: string
  time: string | null
  category: string
  memo: string | null
}

const CATEGORY_COLOR: Record<string, string> = {
  '지원마감': '#ef4444',
  '면접': '#8b5cf6',
  '서류제출': '#f97316',
  '기타': '#6b7280',
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 오늘 일정을 불러와서 개수를 알려주는 훅. 네비게이션 배지("오늘 N개") 등에 사용.
export function useTodayScheduleCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('schedule_events')
        .select('id')
        .eq('date', todayKey())
      setCount(data?.length || 0)
    }
    load()
  }, [])

  return count
}

// 로그인 후 페이지에 한 번만 마운트하면 되는 D-day 알림 팝업.
// 오늘 하루 이미 봤으면(localStorage 기준) 다시 뜨지 않음.
export default function DdayPopup() {
  const [events, setEvents] = useState<TodayEvent[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const seenKey = `jobtong_dday_seen_${todayKey()}`
      if (localStorage.getItem(seenKey)) return

      const { data } = await supabase
        .from('schedule_events')
        .select('id, title, time, category, memo')
        .eq('date', todayKey())
        .order('time', { ascending: true, nullsFirst: false })

      if (data && data.length > 0) {
        setEvents(data)
        setShow(true)
        localStorage.setItem(seenKey, '1')
      }
    }
    check()
  }, [])

  if (!show) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 380, width: '100%', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>오늘 일정이 있어요</h3>
        </div>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 18px' }}>{todayKey()}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 280, overflowY: 'auto' }}>
          {events.map(ev => {
            const color = CATEGORY_COLOR[ev.category] || CATEGORY_COLOR['기타']
            return (
              <div key={ev.id} style={{ background: '#f7f6f3', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{ev.category}</span>
                  {ev.time && <span style={{ fontSize: 11, color: '#666' }}>{ev.time.slice(0, 5)}</span>}
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#222', margin: '0 0 4px' }}>{ev.title}</p>
                {ev.memo && <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.6 }}>{ev.memo}</p>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShow(false)} style={{ flex: 1, background: '#f7f6f3', color: '#444', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            닫기
          </button>
          <button onClick={() => window.location.href = '/schedule'} style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            일정 관리로 이동
          </button>
        </div>
      </div>
    </div>
  )
}
