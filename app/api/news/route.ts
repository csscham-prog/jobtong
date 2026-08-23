import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 바른하우스 프로젝트에서 검증된 RSS 소스 (연합뉴스/뉴시스/매경 economy)
const RSS_FEEDS = [
  'https://www.yna.co.kr/rss/economy.xml',
  'https://www.newsis.com/RSS/economy.xml',
  'https://www.mk.co.kr/rss/30100041/',
]

// 채용/취업 관련 키워드 필터
const JOB_KEYWORDS = [
  '채용', '공채', '신입사원', '신입', '인턴', '취업', '일자리', '구인',
  '고용', '취준', '입사', '면접', '자소서', '자기소개서',
]

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

function parseRSS(text: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || []

  for (const item of itemMatches) {
    const title = (item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim() || ''
    const link = (item.match(/<link>(.*?)<\/link>/) || [])[1]?.trim()
      || (item.match(/<guid[^>]*>(.*?)<\/guid>/) || [])[1]?.trim() || '#'
    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1]?.trim() || ''
    const source = (item.match(/<source[^>]*>(.*?)<\/source>/) || [])[1]?.trim() || ''

    if (title) items.push({ title, link, pubDate, source })
  }
  return items
}

function getSourceName(url: string, parsedSource: string): string {
  if (parsedSource) return parsedSource
  if (url.includes('yna.co.kr')) return '연합뉴스'
  if (url.includes('newsis.com')) return '뉴시스'
  if (url.includes('mk.co.kr')) return '매일경제'
  return '뉴스'
}

export async function GET(req: NextRequest) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  }

  try {
    let allItems: NewsItem[] = []

    const results = await Promise.allSettled(
      RSS_FEEDS.map(url => fetch(url, { headers }).then(r => r.text()).then(text => ({ url, text })))
    )

    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const { url, text } = result.value
      const items = parseRSS(text)
      const filtered = items
        .filter(i => JOB_KEYWORDS.some(kw => i.title.includes(kw)))
        .map(i => ({ ...i, source: getSourceName(url, i.source) }))
      allItems.push(...filtered)
    }

    // 중복 제거 (제목 기준)
    const seen = new Set<string>()
    allItems = allItems.filter(i => {
      if (seen.has(i.title)) return false
      seen.add(i.title)
      return true
    })

    // 최신순 정렬
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    const finalItems = allItems.slice(0, 8)

    return NextResponse.json(
      { items: finalItems },
      { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' } }
    )

  } catch (error: any) {
    console.error('채용 뉴스 조회 오류:', error)
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}
