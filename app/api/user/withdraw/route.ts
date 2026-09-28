import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ──────────────────────────────────────────
// 사용자 데이터가 들어있는 테이블 목록.
// ※ 사용자 데이터가 있는 새 테이블을 만들면 반드시 여기에도 추가하세요.
//    (auth.users를 참조하는 테이블이 여기 없으면 계정 삭제가 막혀 탈퇴가 실패합니다)
// profiles는 마지막에 둡니다.
// ──────────────────────────────────────────
const USER_TABLES: { table: string; column: string }[] = [
  { table: 'support_messages', column: 'user_id' },
  { table: 'mock_interview_sessions', column: 'user_id' },
  { table: 'schedule_events', column: 'user_id' },
  { table: 'analyses', column: 'user_id' },
  { table: 'payments', column: 'user_id' },
  { table: 'profiles', column: 'id' },
]

const FAIL_MESSAGE = '탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 계속되면 문의해주세요.'

export async function POST(req: NextRequest) {
  try {
    // 1. 요청자 인증 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    // 2. 유저 확인 (토큰 검증 용도로만 공개키 클라이언트 사용)
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 })
    }

    const userId = user.id

    // 3. 삭제 작업은 service role 키로 수행
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 공지사항은 삭제하지 않고 작성자 표시만 비움 (관리자 계정 탈퇴 시 공개 공지가 사라지지 않도록)
    const { error: noticeError } = await supabaseAdmin
      .from('notices')
      .update({ author_id: null })
      .eq('author_id', userId)
    if (noticeError) {
      console.error('[withdraw] notices 작성자 해제 실패:', noticeError)
      return NextResponse.json({ error: FAIL_MESSAGE }, { status: 500 })
    }

    // 4. 사용자 데이터 삭제
    //    - 오류가 나면 어느 테이블인지 로그를 남기고 중단
    //    - 참조 제약(23503)으로 막힌 테이블은 뒤로 미뤘다가 다른 테이블을 지운 뒤 재시도
    let pending = [...USER_TABLES]
    while (pending.length > 0) {
      const deferred: typeof pending = []

      for (const { table, column } of pending) {
        const { error } = await supabaseAdmin.from(table).delete().eq(column, userId)
        if (!error) continue

        if (error.code === '23503') {
          deferred.push({ table, column })
          continue
        }

        console.error(`[withdraw] ${table} 삭제 실패:`, error)
        return NextResponse.json({ error: FAIL_MESSAGE }, { status: 500 })
      }

      // 한 바퀴 돌았는데 하나도 진전이 없으면 (서로 막고 있음) 중단
      if (deferred.length === pending.length) {
        console.error('[withdraw] 참조 제약으로 삭제 불가:', deferred.map(d => d.table))
        return NextResponse.json({ error: FAIL_MESSAGE }, { status: 500 })
      }
      pending = deferred
    }

    // 5. Auth 계정 삭제
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('[withdraw] Auth 계정 삭제 실패:', deleteError)
      return NextResponse.json({ error: FAIL_MESSAGE }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[withdraw] 회원 탈퇴 오류:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
