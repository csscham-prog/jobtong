import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ──────────────────────────────────────────
// 테스트 키 (사업자 등록 후 실제 키로 교체)
// 실제 키로 교체 시 아래 두 줄만 바꾸면 됩니다
const TOSS_SECRET_KEY = 'test_sk_nRQoOaPz8LNwAxqok0D5Vy47BMw6' // 잡통 MID(vjobton225) 전용 테스트 키
const IS_TEST_MODE = true // 실서비스 시 false로 변경
// ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 })
    }

    // 2. 결제 정보 수신
    const { paymentKey, orderId, amount, planType } = await req.json()

    if (!paymentKey || !orderId || !amount || !planType) {
      return NextResponse.json({ error: '결제 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    // 3. 플랜별 금액 검증
    const planConfig: Record<string, { amount: number; credits: number; name: string }> = {
      'plan_1': { amount: 2900, credits: 1, name: '1회권' },
      'plan_5': { amount: 9900, credits: 5, name: '5회권' },
    }
    const plan = planConfig[planType]
    if (!plan) {
      return NextResponse.json({ error: '올바르지 않은 플랜입니다.' }, { status: 400 })
    }
    if (plan.amount !== amount) {
      return NextResponse.json({ error: '결제 금액이 올바르지 않습니다.' }, { status: 400 })
    }

    // 4. 토스페이먼츠 결제 승인 요청
    const basicToken = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')
    const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error('토스 승인 실패:', tossData)
      return NextResponse.json(
        { error: tossData.message || '결제 승인에 실패했습니다.' },
        { status: 400 }
      )
    }

    // 5. 크레딧 충전 (service role로 RLS 우회)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 현재 크레딧 조회
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('paid_credits')
      .eq('id', user.id)
      .single()

    const currentCredits = profile?.paid_credits || 0
    const newCredits = currentCredits + plan.credits

    // 크레딧 업데이트
    await adminSupabase
      .from('profiles')
      .update({ paid_credits: newCredits })
      .eq('id', user.id)

    // 결제 내역 저장
    await adminSupabase.from('payments').insert({
      user_id: user.id,
      amount: plan.amount,
      credits: plan.credits,
      payment_key: paymentKey,
      order_id: orderId,
      status: 'success',
      plan_type: planType,
      plan_name: plan.name,
      is_test: IS_TEST_MODE,
    })

    return NextResponse.json({
      success: true,
      credits: newCredits,
      message: `${plan.name} 결제가 완료되었습니다. ${plan.credits}회가 충전되었습니다.`,
    })

  } catch (error: any) {
    console.error('결제 처리 오류:', error)
    return NextResponse.json(
      { error: error.message || '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
