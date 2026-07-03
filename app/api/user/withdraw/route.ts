import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
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

    // 2. service role로 데이터 삭제 (RLS 우회)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. analyses 삭제
    await adminSupabase.from('analyses').delete().eq('user_id', user.id)

    // 4. payments 삭제
    await adminSupabase.from('payments').delete().eq('user_id', user.id)

    // 5. profiles 삭제
    await adminSupabase.from('profiles').delete().eq('id', user.id)

    // 6. Supabase Auth 계정 삭제 (service role 필요)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('Auth 계정 삭제 오류:', deleteError)
      return NextResponse.json({ error: '계정 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('회원 탈퇴 오류:', error)
    return NextResponse.json({ error: error.message || '탈퇴 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
