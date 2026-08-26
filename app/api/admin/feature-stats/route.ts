import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 })
    }
    const { data: profile } = await supabaseAuth
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }) } }
    )

    // 기간 필터를 붙인 count 쿼리 헬퍼
    const countRows = async (table: string, extraFilter?: (q: any) => any) => {
      let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
      if (from) q = q.gte('created_at', from)
      if (to) q = q.lte('created_at', to)
      if (extraFilter) q = extraFilter(q)
      const { count, error } = await q
      if (error) { console.error(`[feature-stats] ${table} 조회 실패:`, error); return 0 }
      return count || 0
    }

    // 잡통은 정밀 분석(유료)만 집계 대상 — 문서 유형별로 세부 구분
    const [
      analysisCoverletter,
      analysisResume,
      consistencyCheck,
    ] = await Promise.all([
      countRows('analyses', q => q.eq('analyze_type', 'paid').eq('doc_type', 'coverletter')),
      countRows('analyses', q => q.eq('analyze_type', 'paid').eq('doc_type', 'resume')),
      countRows('analyses', q => q.eq('analyze_type', 'consistency').eq('doc_type', 'consistency')),
    ])

    return NextResponse.json({
      rows: [
        { group: '정밀 분석', label: '자기소개서', count: analysisCoverletter },
        { group: '정밀 분석', label: '이력서·경력기술서', count: analysisResume },
        { group: '정합성 검증', label: '자소서↔이력서 대조', count: consistencyCheck },
      ],
    })
  } catch (e) {
    console.error('feature-stats API 오류:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
