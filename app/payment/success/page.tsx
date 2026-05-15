'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = params.get('amount')
    const planType = params.get('planType')

    if (!paymentKey || !orderId || !amount || !planType) {
      setStatus('error'); setMessage('결제 정보가 올바르지 않습니다.'); return
    }

    const confirmPayment = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount),
          planType,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        setMessage(data.message)
        setCredits(data.credits)
      } else {
        setStatus('error')
        setMessage(data.error || '결제 처리 중 오류가 발생했습니다.')
      }
    }

    confirmPayment()
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

        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2244', marginBottom: 8 }}>결제 확인 중...</h2>
            <p style={{ color: '#888', fontSize: 14 }}>잠시만 기다려주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f2244', marginBottom: 12 }}>결제 완료!</h2>
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>{message}</p>
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 12, padding: '16px', marginBottom: 28 }}>
              <p style={{ fontSize: 13, color: '#065f46', margin: 0, fontWeight: 600 }}>
                현재 잔여 분석권: <strong style={{ fontSize: 18 }}>{credits}회</strong>
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              자소서 분석 시작하기 →
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#991b1b', marginBottom: 12 }}>결제 실패</h2>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>{message}</p>
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
          </>
        )}
      </div>
    </main>
  )
}
