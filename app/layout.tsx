import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '잡통 - AI 자소서 분석 서비스',
  description: '취업 컨설턴트 대신 AI가 자소서를 분석해드립니다. 지금 바로 무료로 체험해보세요.',
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
