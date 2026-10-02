import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 회원가입 직후 1회: 브라우저에 저장된 유입 경로를 profiles에 기록 (service_role로만 쓰기)
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) return NextResponse.json({ error: '인증 실패' }, { status: 401 })

    // 가입 직후 계정만 기록 (기존 회원이 나중에 호출해도 "기록 이전" 상태 유지)
    const createdAgo = Date.now() - new Date(user.created_at).getTime()
    if (createdAgo > 30 * 60 * 1000) {
      return NextResponse.json({ ok: true, skipped: 'not_new_user' })
    }

    const body = await req.json().catch(() => ({}))
    const source = typeof body.source === 'string' && body.source.trim()
      ? body.source.trim().toLowerCase().slice(0, 50) : null
    const referrer = typeof body.referrer === 'string' && body.referrer.trim()
      ? body.referrer.trim().toLowerCase().slice(0, 100) : null

    // 방문 시각: 유효하지 않거나 미래 시각이면 지금 시각으로
    let landingAt = new Date()
    if (typeof body.landingAt === 'string') {
      const d = new Date(body.landingAt)
      if (!isNaN(d.getTime()) && d.getTime() <= Date.now()) landingAt = d
    }

    const fields = {
      signup_source: source,
      signup_referrer: referrer,
      signup_landing_at: landingAt.toISOString(),
    }

    const { data: existing } = await admin
      .from('profiles')
      .select('id, signup_landing_at')
      .eq('id', user.id)
      .maybeSingle()

    // 멱등 처리: 이미 기록돼 있으면 건너뜀
    if (existing?.signup_landing_at) {
      return NextResponse.json({ ok: true, skipped: 'already_recorded' })
    }

    if (existing) {
      const { error } = await admin.from('profiles').update(fields).eq('id', user.id)
      if (error) throw error
    } else {
      const { error } = await admin.from('profiles').insert({ id: user.id, email: user.email, ...fields })
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('signup-source error:', e)
    return NextResponse.json({ error: '저장 실패' }, { status: 500 })
  }
}
