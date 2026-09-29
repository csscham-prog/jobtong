import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const UPLOAD_BUCKET = 'temp-uploads'
const MAX_AGE_MS = 60 * 60 * 1000 // 1시간

export async function GET(req: NextRequest) {
  try {
    // Vercel Cron(또는 그 외 호출자)이 정해진 비밀값을 갖고 있는지 확인
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 버킷은 유저 id 폴더로 나뉘어 있으므로, 최상위 폴더 목록부터 조회
    const { data: userFolders, error: listUsersError } = await supabaseAdmin
      .storage
      .from(UPLOAD_BUCKET)
      .list('', { limit: 1000 })

    if (listUsersError) {
      console.error('[cleanup-uploads] 폴더 목록 조회 실패:', listUsersError)
      return NextResponse.json({ error: '목록 조회 실패' }, { status: 500 })
    }

    const now = Date.now()
    let deletedCount = 0
    let checkedCount = 0
    const errors: string[] = []

    for (const folder of userFolders || []) {
      // list()는 실제 파일에도 폴더처럼 항목을 반환하므로, id가 없는 것(진짜 폴더)만 하위 탐색
      if (folder.id) continue

      const { data: files, error: listFilesError } = await supabaseAdmin
        .storage
        .from(UPLOAD_BUCKET)
        .list(folder.name, { limit: 1000 })

      if (listFilesError) {
        errors.push(`${folder.name}: ${listFilesError.message}`)
        continue
      }

      const staleNames: string[] = []
      for (const file of files || []) {
        checkedCount++
        const createdAt = file.created_at ? new Date(file.created_at).getTime() : 0
        if (createdAt && now - createdAt > MAX_AGE_MS) {
          staleNames.push(`${folder.name}/${file.name}`)
        }
      }

      if (staleNames.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage.from(UPLOAD_BUCKET).remove(staleNames)
        if (removeError) {
          errors.push(`${folder.name}: ${removeError.message}`)
        } else {
          deletedCount += staleNames.length
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: checkedCount,
      deleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e: any) {
    console.error('[cleanup-uploads] 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
