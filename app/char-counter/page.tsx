'use client'

import { useState, useEffect } from 'react'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 780, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

interface Item {
  id: string
  label: string
  content: string
  limit: number
  countSpaces: boolean
}

function countChars(text: string, countSpaces: boolean) {
  return countSpaces ? text.length : text.replace(/\s/g, '').length
}

export default function CharCounterPage() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', label: '문항 1', content: '', limit: 500, countSpaces: true },
  ])

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now().toString(), label: `문항 ${prev.length + 1}`, content: '', limit: 500, countSpaces: true }])
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }

  return (
    <main style={base}>
      <header style={headerStyle}>
        <div style={headerInner}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
            잡통
          </button>
          <span style={{ fontSize: 13, color: '#666' }}>자소서 글자수 카운터</span>
          <span style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#059669', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>무료 · 무제한</span>
        </div>
      </header>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f2244', margin: '0 0 6px' }}>✏️ 자소서 글자수 카운터</h1>
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>문항별로 나눠서 글자수를 실시간으로 확인하세요. 기업마다 다른 글자수 규정(공백 포함/제외)에 맞춰 조절할 수 있어요.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {items.map((item, idx) => {
            const count = countChars(item.content, item.countSpaces)
            const over = count > item.limit
            const ratio = Math.min(count / item.limit, 1)

            return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input
                    value={item.label}
                    onChange={e => updateItem(item.id, { label: e.target.value })}
                    style={{ fontSize: 14, fontWeight: 700, color: '#0f2244', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', flex: 1, minWidth: 0 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={item.countSpaces} onChange={e => updateItem(item.id, { countSpaces: e.target.checked })} />
                    공백 포함
                  </label>
                  <input
                    type="number"
                    value={item.limit}
                    onChange={e => updateItem(item.id, { limit: Math.max(0, parseInt(e.target.value) || 0) })}
                    style={{ width: 64, padding: '5px 8px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 12, fontFamily: 'inherit', color: '#333', textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 12, color: '#999' }}>자</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                  )}
                </div>

                <textarea
                  value={item.content}
                  onChange={e => updateItem(item.id, { content: e.target.value })}
                  placeholder="이 문항 내용을 입력해주세요"
                  style={{ width: '100%', minHeight: 140, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #e5e3dc', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', color: '#222', lineHeight: 1.7 }}
                />

                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 6, background: '#f0ede6', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${ratio * 100}%`, background: over ? '#ef4444' : ratio > 0.9 ? '#f59e0b' : '#10b981', borderRadius: 3, transition: 'width 0.15s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#999' }}>{item.countSpaces ? '공백 포함' : '공백 제외'}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: over ? '#ef4444' : '#333' }}>
                      {count.toLocaleString()} / {item.limit.toLocaleString()}자
                      {over && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700 }}>({(count - item.limit).toLocaleString()}자 초과)</span>}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={addItem} style={{ width: '100%', background: '#fff', color: '#0f2244', border: '2px dashed #ccc', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 32 }}>
          + 문항 추가
        </button>

        {/* 전체 합계 */}
        <div style={{ background: '#0f2244', borderRadius: 16, padding: '18px 22px', marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>전체 문항 합계</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>
            {items.reduce((sum, it) => sum + countChars(it.content, it.countSpaces), 0).toLocaleString()}자
          </span>
        </div>

        {/* 잡통 유도 배너 */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '20px 22px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>글자수는 다 채웠는데, 내용은 괜찮을까요?</p>
          <p style={{ fontSize: 13, color: '#78350f', margin: '0 0 14px' }}>잡통이 논리성·구체성·직무적합성까지 정밀하게 분석해드려요.</p>
          <button onClick={() => window.location.href = '/'} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            자소서 정밀 분석 받으러 가기 →
          </button>
        </div>
      </div>
    </main>
  )
}
