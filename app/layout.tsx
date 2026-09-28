import type { Metadata } from 'next'
import './globals.css'

const TITLE = '잡통 - 자소서·이력서 AI 분석, 모의 면접까지'
const DESCRIPTION = '채용담당자 시선으로 자소서·이력서·경력기술서를 진단하고, 서류 기반 모의 면접까지. 가입하면 무료 체험 1회.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: '잡통',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
