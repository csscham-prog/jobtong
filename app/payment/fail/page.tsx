'use client'

import { useEffect, useState } from 'react'

export default function PaymentFailPage() {
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setErrorMsg(params.get('message') || '결제가 취소되었거나 오류가 발생했습니다.')
  }, [])

  const Emblem = () => (
    <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 5, right: 5, width: 9, height: 9, background: '#e6a800', borderRadius: '50%' }} />
      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>J</span>
    </div>
  )

  return (
    <main style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#f7f6f3', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <Emblem />
        <span style={{ fontSize: 24, fontWeight: 800, color: '#0f2244' }}>잡통</span>
      </div>
      <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', border: '1px solid #ece9e1', width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>😕</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2244', marginBottom: 12 }}>결제가 완료되지 않았습니다</h2>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>{errorMsg}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.location.href = '/payment'}
            style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{ flex: 1, background: '#f7f6f3', color: '#555', border: '1px solid #ddd', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            메인으로
          </button>
        </div>
      </div>
    </main>
  )
}
