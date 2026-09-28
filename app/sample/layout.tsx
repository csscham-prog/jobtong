import type { Metadata } from 'next'

const TITLE = '잡통 분석 결과 샘플'
const DESCRIPTION = '종합 점수, 총평, 핵심 문제, 문장별 BEFORE→AFTER까지 — 실제 분석 결과가 어떤 모습인지 샘플로 확인해보세요.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://jobtong.vercel.app/sample',
    siteName: '잡통',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
