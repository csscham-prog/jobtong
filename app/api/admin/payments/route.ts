import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
// 조회 결과를 캐시하지 않음 (항상 최신 결제 명단)
export const fetchCache = 'force-no-store'
export const revalidate = 0

const noStoreFetch = (url: RequestInfo | URL, options: RequestInit = {}) => fetch(url, { ...options, cache: 'no-store' })

// 관리자 결제 명단 — 결제자 이메일(profiles)은 본인 것만 읽을 수 있도록 막혀 있으므로 서버(service role)에서 조회
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { fetch: noStoreFetch } }
    )

    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: '인증 실패' }, { status: 401 })

    // 관리자 확인은 service role로
    const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const pageSize = 1000
    let from = 0
    const rows: any[] = []
    while (true) {
      const { data, error } = await admin
        .from('payments')
        .select('*, profiles(email)')
        .in('status', ['success', 'refunded', 'partial_refunded'])
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1)
      if (error) throw error
      rows.push(...(data || []))
      if (!data || data.length < pageSize) break
      from += pageSize
    }

    return NextResponse.json({ payments: rows })
  } catch (e: any) {
    console.error('admin payments error:', e)
    return NextResponse.json({ error: '결제 명단 조회 실패' }, { status: 500 })
  }
}
