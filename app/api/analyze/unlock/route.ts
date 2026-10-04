import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// 무료 분석 결과 "바로 열기"
// - 무료 분석 때 잠금 보관해 둔 전체 결과(analysis_locked_results)를 분석권 1회로 열어줌
// - AI를 다시 호출하지 않음 (추가 API 비용 없음)
// - 분석권 차감은 반드시 서버에서만 처리
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const analysisId = typeof body.analysisId === 'string' ? body.analysisId.trim() : ''
    if (!analysisId || analysisId.length > 64) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    // 1. 본인 분석 기록인지 확인
    const { data: analysis } = await admin
      .from('analyses')
      .select('id, user_id, analyze_type, doc_type, company, position, result_json')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!analysis) return NextResponse.json({ error: '분석 기록을 찾을 수 없습니다.' }, { status: 404 })

    const meta = {
      docType: analysis.doc_type === 'resume' ? 'resume' : 'coverletter',
      company: analysis.company || '',
      position: analysis.position || '',
    }

    // 이미 열린 결과면 차감 없이 그대로 반환 (새로고침·중복 클릭 대비)
    if (analysis.analyze_type === 'paid') {
      return NextResponse.json({ ok: true, alreadyUnlocked: true, result: analysis.result_json, ...meta })
    }
    if (analysis.analyze_type !== 'free') {
      return NextResponse.json({ error: '열 수 없는 분석 기록입니다.' }, { status: 400 })
    }

    // 2. 잠금 보관된 전체 결과 확인
    const { data: locked } = await admin
      .from('analysis_locked_results')
      .select('result_json')
      .eq('analysis_id', analysisId)
      .maybeSingle()

    if (!locked?.result_json) {
      return NextResponse.json({ error: '전체 결과를 찾을 수 없습니다. 새로 분석해주세요.' }, { status: 404 })
    }

    // 3. 분석권 확인 (관리자는 차감 없음)
    const { data: profile } = await admin
      .from('profiles')
      .select('paid_credits, role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    if (!isAdmin && (profile?.paid_credits || 0) < 1) {
      return NextResponse.json({ error: '분석권이 없습니다.', needPayment: true }, { status: 402 })
    }

    // 4. 먼저 "열림" 상태로 선점 (동시에 두 번 요청돼도 한 번만 처리되도록)
    const { data: claimed } = await admin
      .from('analyses')
      .update({ analyze_type: 'paid', result_json: locked.result_json })
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .eq('analyze_type', 'free')
      .select('id')

    if (!claimed || claimed.length === 0) {
      // 다른 요청이 먼저 열었음 → 차감 없이 결과 반환
      return NextResponse.json({ ok: true, alreadyUnlocked: true, result: locked.result_json, ...meta })
    }

    // 5. 분석권 1회 차감 (읽은 값이 그대로일 때만 차감 — 동시 요청 시 이중 차감 방지)
    if (!isAdmin) {
      let deducted = false
      for (let attempt = 0; attempt < 3 && !deducted; attempt++) {
        const { data: cur } = await admin.from('profiles').select('paid_credits').eq('id', user.id).single()
        const credits = cur?.paid_credits || 0
        if (credits < 1) break
        const { data: updated } = await admin
          .from('profiles')
          .update({ paid_credits: credits - 1 })
          .eq('id', user.id)
          .eq('paid_credits', credits)
          .select('id')
        if (updated && updated.length > 0) deducted = true
      }

      if (!deducted) {
        // 차감 실패 → 열림 상태 되돌리기
        await admin
          .from('analyses')
          .update({
            analyze_type: 'free',
            result_json: {
              totalScore: locked.result_json.totalScore,
              summary: locked.result_json.summary,
              mainIssue: locked.result_json.mainIssue,
            },
          })
          .eq('id', analysisId)
          .eq('user_id', user.id)
        return NextResponse.json({ error: '분석권이 없습니다.', needPayment: true }, { status: 402 })
      }
    }

    // 6. 잠금 보관본 정리 (전체 결과는 이제 analyses에 저장됨)
    await admin.from('analysis_locked_results').delete().eq('analysis_id', analysisId)

    return NextResponse.json({ ok: true, result: locked.result_json, ...meta })
  } catch (e: any) {
    console.error('unlock error:', e)
    return NextResponse.json({ error: '결과를 여는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
