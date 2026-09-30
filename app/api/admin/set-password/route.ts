import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'csscham@naver.com'

export async function POST(req: NextRequest) {
  try {
    // 1. 요청자 인증 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    // 2. 대상 유저 + 새 비밀번호
    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }

    // 3. service role로 비밀번호 강제 변경 (기존 비밀번호 확인 불필요)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await adminSupabase.auth.admin.updateUserById(userId, { password: newPassword })

    if (error) {
      console.error('[admin/set-password] 비밀번호 변경 실패:', error)
      return NextResponse.json({ error: error.message || '비밀번호 변경에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[admin/set-password] 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
