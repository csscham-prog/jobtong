import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 1000건 제한을 넘어도 전부 가져오기
async function fetchAll(admin: SupabaseClient, table: string, columns: string, apply?: (q: any) => any) {
  const pageSize = 1000
  let from = 0
  const rows: any[] = []
  while (true) {
    let q = admin.from(table).select(columns).range(from, from + pageSize - 1)
    if (apply) q = apply(q)
    const { data, error } = await q
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return rows
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: '인증 실패' }, { status: 401 })

    // 관리자 확인은 service_role로
    const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const period = req.nextUrl.searchParams.get('period') || 'all' // '7' | '30' | 'all'
    const days = period === '7' ? 7 : period === '30' ? 30 : null
    const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null

    const profiles = await fetchAll(
      admin, 'profiles', 'id, created_at, signup_source, signup_referrer, signup_landing_at',
      since ? (q) => q.gte('created_at', since) : undefined
    )

    // 결제한 적 있는 회원: 토스 승인 키가 있는 결제 기록 (환불 여부 무관)
    const payments = await fetchAll(admin, 'payments', 'user_id', (q) => q.not('payment_key', 'is', null))
    const paidUserIds = new Set(payments.map((p: any) => p.user_id))

    const map = new Map<string, { label: string; signups: number; paid: number }>()
    for (const p of profiles) {
      let label: string
      if (p.signup_source) label = p.signup_source
      else if (p.signup_referrer) label = `참조: ${p.signup_referrer}`
      else if (p.signup_landing_at) label = '직접 방문'
      else label = '기록 이전'

      const row = map.get(label) || { label, signups: 0, paid: 0 }
      row.signups += 1
      if (paidUserIds.has(p.id)) row.paid += 1
      map.set(label, row)
    }

    const rows = Array.from(map.values()).sort((a, b) => {
      // "기록 이전"은 항상 맨 아래
      if (a.label === '기록 이전') return 1
      if (b.label === '기록 이전') return -1
      return b.signups - a.signups
    })

    return NextResponse.json({ rows, total: profiles.length })
  } catch (e: any) {
    console.error('signup-sources error:', e)
    return NextResponse.json({ error: '집계 실패' }, { status: 500 })
  }
}
