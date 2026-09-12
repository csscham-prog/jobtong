import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'csscham@naver.com'

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 양쪽 모두 읽음 처리된 지 7일 지난 쪽지는 목록 조회 시점에 정리 (별도 크론 없이)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabaseAdmin
      .from('support_messages')
      .delete()
      .eq('is_read_by_user', true)
      .eq('is_read_by_admin', true)
      .lt('created_at', sevenDaysAgo)

    // 전체 메시지를 가져와서 유저별로 묶기 (건수가 아주 많아지면 추후 페이지네이션 고려)
    const { data: messages, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
    }

    const userIds = Array.from(new Set((messages || []).map(m => m.user_id)))
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map(p => [p.id, p.email]))

    const threads = userIds.map(uid => {
      const userMessages = (messages || []).filter(m => m.user_id === uid)
      const lastMessage = userMessages[0] // 이미 최신순 정렬됨
      const unreadCount = userMessages.filter(m => m.sender === 'user' && !m.is_read_by_admin).length
      return {
        userId: uid,
        email: profileMap.get(uid) || '(알 수 없음)',
        lastMessage: lastMessage?.content || '',
        lastMessageAt: lastMessage?.created_at || '',
        unreadCount,
      }
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

    return NextResponse.json(threads)
  } catch (e: any) {
    console.error('support GET 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
