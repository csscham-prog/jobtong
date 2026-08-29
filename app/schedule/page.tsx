'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

const CATEGORIES = [
  { key: '지원마감', color: '#ef4444', bg: '#fef2f2' },
  { key: '면접', color: '#8b5cf6', bg: '#f5f3ff' },
  { key: '서류제출', color: '#f97316', bg: '#fff7ed' },
  { key: '기타', color: '#6b7280', bg: '#f3f4f6' },
]

interface ScheduleEvent {
  id: string
  date: string
  title: string
  time: string | null
  category: string
  memo: string | null
}

function getCategoryStyle(category: string) {
  return CATEGORIES.find(c => c.key === category) || CATEGORIES[3]
}

function formatDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SchedulePage() {
  const [authLoading, setAuthLoading] = useState(true)
  const [userId, setUserId] = useState('')

  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()))
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [category, setCategory] = useState('기타')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUserId(session.user.id)
      setAuthLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!userId) return
    loadEvents()
  }, [userId, viewDate])

  const loadEvents = async () => {
    setLoading(true)
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const rangeStart = formatDateKey(new Date(year, month, 1))
    const rangeEnd = formatDateKey(new Date(year, month + 1, 0))

    const { data, error: fetchError } = await supabase
      .from('schedule_events')
      .select('*')
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: false })

    if (!fetchError && data) setEvents(data)
    setLoading(false)
  }

  const changeMonth = (delta: number) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1)
    setViewDate(next)
  }

  const handleAddEvent = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    setError('')
    setSaving(true)
    const { error: insertError } = await supabase.from('schedule_events').insert({
      user_id: userId,
      date: selectedDate,
      title: title.trim(),
      time: time || null,
      category,
      memo: memo.trim() || null,
    })
    setSaving(false)
    if (insertError) {
      setError('일정 저장 중 오류가 발생했습니다.')
      return
    }
    setTitle(''); setTime(''); setCategory('기타'); setMemo('')
    setShowAddForm(false)
    loadEvents()
  }

  const handleDeleteEvent = async (id: string) => {
    await supabase.from('schedule_events').delete().eq('id', id)
    loadEvents()
  }

  if (authLoading) {
    return (
      <main style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontSize: 14 }}>불러오는 중...</p>
      </main>
    )
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const startWeekday = firstDayOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = formatDateKey(new Date())

  const calendarCells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

  const eventsByDate: Record<string, ScheduleEvent[]> = {}
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = []
    eventsByDate[ev.date].push(ev)
  })

  const selectedEvents = eventsByDate[selectedDate] || []
  const monthEvents = [...events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <main style={base}>
      <header style={headerStyle}>
        <div style={headerInner}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
            잡통
          </button>
          <span style={{ fontSize: 13, color: '#666' }}>일정 관리</span>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f2244', margin: '0 0 6px' }}>📅 일정 관리</h1>
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>지원 마감, 면접, 서류 제출 일정을 한눈에 관리하세요.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

          {/* 좌측: 월간 캘린더 */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => changeMonth(-1)} style={{ background: '#f7f6f3', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#333' }}>‹</button>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: 0 }}>{year}년 {month + 1}월</h2>
              <button onClick={() => changeMonth(1)} style={{ background: '#f7f6f3', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#333' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#888', padding: '6px 0' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={i} />
                const dateKey = formatDateKey(new Date(year, month, day))
                const dayEvents = eventsByDate[dateKey] || []
                const isToday = dateKey === todayKey
                const isSelected = dateKey === selectedDate
                const weekday = (startWeekday + day - 1) % 7

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateKey)}
                    style={{
                      aspectRatio: '1', borderRadius: 12, border: isSelected ? '2px solid #0f2244' : isToday ? '2px solid #e6a800' : '1px solid transparent',
                      background: isSelected ? '#eef2ff' : '#fff', cursor: 'pointer', padding: 4,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 3, fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, color: weekday === 0 ? '#ef4444' : weekday === 6 ? '#3b82f6' : '#222' }}>{day}</span>
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {dayEvents.slice(0, 3).map((ev, ei) => (
                        <span key={ei} style={{ width: 5, height: 5, borderRadius: '50%', background: getCategoryStyle(ev.category).color }} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                  <span style={{ fontSize: 11, color: '#666' }}>{c.key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 우측: 선택 날짜 일정 + 이번 달 전체 일정 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', margin: 0 }}>{selectedDate.slice(5).replace('-', '월 ')}일 일정</p>
                <button onClick={() => setShowAddForm(true)} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ 일정 추가</button>
              </div>

              {selectedEvents.length === 0 ? (
                <p style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '20px 0' }}>등록된 일정이 없어요.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedEvents.map(ev => {
                    const cs = getCategoryStyle(ev.category)
                    return (
                      <div key={ev.id} style={{ background: cs.bg, borderRadius: 12, padding: '12px 14px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ background: cs.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{ev.category}</span>
                          {ev.time && <span style={{ fontSize: 11, color: '#666' }}>{ev.time.slice(0, 5)}</span>}
                          <button onClick={() => handleDeleteEvent(ev.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13 }}>✕</button>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#222', margin: '0 0 4px' }}>{ev.title}</p>
                        {ev.memo && <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.6 }}>{ev.memo}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', padding: '20px' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', margin: '0 0 14px' }}>이번 달 전체 일정</p>
              {loading ? (
                <p style={{ fontSize: 13, color: '#999' }}>불러오는 중...</p>
              ) : monthEvents.length === 0 ? (
                <p style={{ fontSize: 13, color: '#999' }}>이번 달 등록된 일정이 없어요.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                  {monthEvents.map(ev => {
                    const cs = getCategoryStyle(ev.category)
                    return (
                      <div key={ev.id} onClick={() => setSelectedDate(ev.date)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', background: ev.date === selectedDate ? '#f7f6f3' : 'transparent' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cs.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>{ev.date.slice(5).replace('-', '/')}</span>
                        <span style={{ fontSize: 13, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 26px', maxWidth: 380, width: '100%' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', margin: '0 0 4px' }}>일정 추가</h3>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 18px' }}>{selectedDate}</p>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목 (예: 카카오 서류 마감)"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', marginBottom: 10, boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222' }}
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', background: '#fff' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.key}</option>
                ))}
              </select>
            </div>

            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="메모 (선택)"
              style={{ width: '100%', minHeight: 70, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
            />

            {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowAddForm(false); setError('') }} style={{ flex: 1, background: '#f7f6f3', color: '#444', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
              <button onClick={handleAddEvent} disabled={saving} style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
                {saving ? '저장 중...' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
