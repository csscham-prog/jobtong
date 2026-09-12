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

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    // 유저가 보낸, 관리자가 아직 안 읽은 메시지 읽음 처리
    const unreadIds = (data || []).filter(m => m.sender === 'user' && !m.is_read_by_admin).map(m => m.id)
    if (unreadIds.length > 0) {
      await supabaseAdmin.from('support_messages').update({ is_read_by_admin: true }).in('id', unreadIds)
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('support thread GET 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const { content } = await req.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: '메시지 내용을 입력해주세요.' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .insert({
        user_id: params.userId,
        sender: 'admin',
        content: content.trim(),
        is_read_by_user: false,
        is_read_by_admin: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '답장 전송 실패' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('support reply POST 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('support_messages')
      .delete()
      .eq('user_id', params.userId)

    if (error) {
      return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('support thread DELETE 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
