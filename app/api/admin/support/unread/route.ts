import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'csscham@naver.com'

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
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
    if (error || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error: fetchError } = await supabaseAdmin
      .from('support_messages')
      .select('id, content, created_at')
      .eq('sender', 'user')
      .eq('is_read_by_admin', false)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ messages: data || [] })
  } catch (e: any) {
    console.error('admin support unread GET 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
