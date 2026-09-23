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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { title, content, isPinned, isPublished } = body

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updatePayload.title = title
    if (content !== undefined) updatePayload.content = content
    if (isPinned !== undefined) updatePayload.is_pinned = isPinned
    if (isPublished !== undefined) updatePayload.is_published = isPublished

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await adminSupabase
      .from('notices')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '수정 중 오류가 발생했습니다.' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('notices PATCH 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: '관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await adminSupabase
      .from('notices')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('notices DELETE 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
