import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SITE_ORIGIN = 'https://jobtong.vercel.app'

// 집통이 관리하는 공유 테이블(short_links)을 읽기 전용으로 조회해서 리다이렉트만 처리함.
// 생성·수정·삭제는 전부 집통 관리자 페이지에서만 함 — 여기선 절대 쓰기 작업 안 함.
// 반드시 집통의 공개키(anon key)만 사용할 것 — service_role 키 사용 금지.
export default async function ShortLinkRedirectPage({ params }: { params: { slug: string } }) {
  const url = process.env.JIPTONG_SUPABASE_URL
  const anonKey = process.env.JIPTONG_SUPABASE_ANON_KEY
  if (!url || !anonKey) redirect('/?debug=no-env')

  const visitedUrl = `${SITE_ORIGIN}/${params.slug}`

  const supabase = createClient(url, anonKey)

  const { data, error } = await supabase
    .from('short_links')
    .select('target_url')
    .eq('short_url', visitedUrl)
    .maybeSingle()

  const target = data?.target_url
  // http/https 주소로만 이동 (잘못 등록된 값 방어)
  console.log('[short-link] lookup:', { visitedUrl, data, error })
  if (!target || !/^https?:\/\//i.test(target)) redirect('/?debug=no-match')
  redirect(target)
}
