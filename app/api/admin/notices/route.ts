import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')

  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await anonSupabase.auth.getUser(token)
  if (error || !user) return null

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // 관리자 화면에서는 발행 여부와 무관하게 전체 조회
    const { data, error } = await adminSupabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('notices GET 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { title, content, isPinned, isPublished } = body

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await adminSupabase
      .from('notices')
      .insert({
        title,
        content,
        is_pinned: !!isPinned,
        is_published: isPublished !== false,
        author_id: admin.id,
      })
      .select()
      .single()

    if (error) {
      console.error('notices 등록 실패:', error)
      return NextResponse.json({ error: '등록 중 오류가 발생했습니다.' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('notices POST 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
