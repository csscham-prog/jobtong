import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    // 1. 어드민 인증 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 })
    }

    // 2. 어드민 권한 확인
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '어드민 권한이 필요합니다.' }, { status: 403 })
    }

    // 3. 환불 정보 수신
    const { paymentId, refundAmount } = await req.json()

    if (!paymentId || !refundAmount || refundAmount <= 0) {
      return NextResponse.json({ error: '환불 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    // 4. 기존 결제 정보 확인
    const { data: payment } = await adminSupabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (!payment) {
      return NextResponse.json({ error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (payment.status === 'refunded') {
      return NextResponse.json({ error: '이미 환불된 건입니다.' }, { status: 400 })
    }

    if (refundAmount > payment.amount) {
      return NextResponse.json({ error: `환불액이 결제 금액(₩${payment.amount.toLocaleString()})을 초과할 수 없습니다.` }, { status: 400 })
    }

    // 5. payments 테이블 업데이트 (RLS 우회 - service role key 사용)
    const isFullRefund = refundAmount === payment.amount
    const { error: updateError } = await adminSupabase
      .from('payments')
      .update({
        refund_amount: refundAmount,
        refund_at: new Date().toISOString(),
        status: isFullRefund ? 'refunded' : 'partial_refunded',
      })
      .eq('id', paymentId)

    if (updateError) {
      console.error('환불 업데이트 오류:', updateError)
      return NextResponse.json({ error: '환불 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      refundAmount,
      status: isFullRefund ? 'refunded' : 'partial_refunded',
      message: `₩${refundAmount.toLocaleString()} 환불 처리가 완료되었습니다.`,
    })

  } catch (error: any) {
    console.error('환불 API 오류:', error)
    return NextResponse.json({ error: error.message || '환불 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
