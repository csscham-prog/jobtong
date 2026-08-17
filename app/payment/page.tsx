'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ──────────────────────────────────────────
// 테스트 클라이언트 키 (사업자 등록 후 실제 키로 교체)
const TOSS_CLIENT_KEY = 'test_ck_DpexMgkW36PnG4JJ4kZNrGbR5ozO'
// ──────────────────────────────────────────

const PLANS = [
  { id: 'plan_1', name: '1회권', price: 2900, credits: 1, desc: '전체 분석 1회', badge: '' },
  { id: 'plan_5', name: '5회권', price: 9900, credits: 5, desc: '1회당 ₩1,980', badge: '32% 할인', popular: true },
]

export default function PaymentPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('plan_5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tossReady, setTossReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
    })

    // URL 파라미터로 플랜 자동 선택
    const params = new URLSearchParams(window.location.search)
    const plan = params.get('plan')
    if (plan === 'plan_1' || plan === 'plan_5') setSelectedPlan(plan)

    // 토스페이먼츠 SDK 로드
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.onload = () => setTossReady(true)
    document.head.appendChild(script)
  }, [])

  const handlePayment = async () => {
    if (!tossReady) { setError('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return }
    if (!user) { window.location.href = '/login'; return }

    setLoading(true); setError('')

    const plan = PLANS.find(p => p.id === selectedPlan)
    if (!plan) return

    const orderId = `jobtong_${Date.now()}_${user.id.slice(0, 8)}`

    try {
      const tossPayments = (window as any).TossPayments(TOSS_CLIENT_KEY)
      await tossPayments.requestPayment('카드', {
        amount: plan.price,
        orderId,
        orderName: `잡통 ${plan.name}`,
        customerName: user.email,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment/success?planType=${plan.id}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (e: any) {
      if (e.code !== 'USER_CANCEL') {
        setError(e.message || '결제 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const Emblem = () => (
    <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 5, right: 5, width: 9, height: 9, background: '#e6a800', borderRadius: '50%' }} />
      <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>J</span>
    </div>
  )

  return (
    <main style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#f7f6f3', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* 로고 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <Emblem />
        <span style={{ fontSize: 24, fontWeight: 800, color: '#0f2244' }}>잡통</span>
      </div>

      <div style={{ width: '100%', maxWidth: 480 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f2244', textAlign: 'center', marginBottom: 8 }}>분석권 구매</h2>
        <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 }}>구매 후 즉시 사용 가능합니다</p>

        {/* 플랜 선택 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                background: selectedPlan === plan.id ? '#fff' : '#faf9f7',
                border: `2px solid ${selectedPlan === plan.id ? '#0f2244' : '#e5e3dc'}`,
                borderRadius: 16, padding: '20px 24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${selectedPlan === plan.id ? '#0f2244' : '#ccc'}`,
                  background: selectedPlan === plan.id ? '#0f2244' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {selectedPlan === plan.id && <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%' }} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f2244' }}>{plan.name}</span>
                    {plan.badge && (
                      <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{plan.badge}</span>
                    )}
                    {plan.popular && (
                      <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>인기</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#888', margin: '2px 0 0' }}>{plan.desc}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f2244' }}>₩{plan.price.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 안내 문구 */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
          💡 구매한 분석권은 결제일로부터 1개월간 사용 가능합니다.
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading || !tossReady}
          style={{ width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '결제창 열는 중...' : `₩${PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()} 결제하기`}
        </button>

        <button
          onClick={() => window.history.back()}
          style={{ width: '100%', marginTop: 12, background: 'none', color: '#aaa', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, padding: '10px' }}
        >
          ← 돌아가기
        </button>

        {/* 사업자 정보 */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e8e5dc', textAlign: 'center', lineHeight: 1.9 }}>
          <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>바른어플리케이션 | 대표: 조신성 | 사업자등록번호: 896-03-03938 · 통신판매업신고: 제2026-경기광명-0710호</p>
          <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>Tel: 070-8064-1382 | barunapplication@gmail.com</p>
          <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>경기도 광명시 소하로 162, 710동 601호</p>
        </div>

      </div>
    </main>
  )
}
