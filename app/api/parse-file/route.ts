import { NextRequest, NextResponse } from 'next/server'

// PDF에서 텍스트 추출 — 순수 버퍼 파싱
function extractPdfText(buffer: Buffer): string {
  const content = buffer.toString('latin1')
  const textChunks: string[] = []

  // PDF 스트림에서 BT...ET 블록 (텍스트 블록) 추출
  const btEtRegex = /BT([\s\S]*?)ET/g
  let match

  while ((match = btEtRegex.exec(content)) !== null) {
    const block = match[1]

    // Tj, TJ, ' 연산자에서 텍스트 추출
    const tjRegex = /\(((?:[^()\\]|\\[\s\S])*)\)\s*(?:Tj|'|")/g
    const tjArrayRegex = /\[((?:[^\[\]])*)\]\s*TJ/g

    let tjMatch
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const raw = tjMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\')
      textChunks.push(raw)
    }

    while ((tjMatch = tjArrayRegex.exec(block)) !== null) {
      const arrayContent = tjMatch[1]
      const innerRegex = /\(((?:[^()\\]|\\[\s\S])*)\)/g
      let innerMatch
      while ((innerMatch = innerRegex.exec(arrayContent)) !== null) {
        const raw = innerMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\')
        textChunks.push(raw)
      }
      textChunks.push(' ')
    }
    textChunks.push('\n')
  }

  // 한글 등 유니코드 처리 — UTF-16BE 인코딩된 텍스트
  const unicodeRegex = /\<([0-9A-Fa-f]+)\>/g
  let uMatch
  const unicodeChunks: string[] = []
  while ((uMatch = unicodeRegex.exec(content)) !== null) {
    const hex = uMatch[1]
    if (hex.length >= 4 && hex.length % 4 === 0) {
      try {
        let decoded = ''
        for (let i = 0; i < hex.length; i += 4) {
          const code = parseInt(hex.slice(i, i + 4), 16)
          if (code > 0) decoded += String.fromCharCode(code)
        }
        if (decoded.trim()) unicodeChunks.push(decoded)
      } catch (e) {}
    }
  }

  // 두 방식 중 더 긴 텍스트 사용
  const latin1Text = textChunks
    .join('')
    .replace(/[^\x20-\x7E\n\r\t가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const unicodeText = unicodeChunks
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return latin1Text.length > unicodeText.length ? latin1Text : unicodeText
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // TXT 파일
    if (fileName.endsWith('.txt')) {
      const text = buffer.toString('utf-8')
      if (!text.trim()) {
        return NextResponse.json({ error: '파일이 비어있습니다.' }, { status: 400 })
      }
      return NextResponse.json({ text: text.trim() })
    }

    // PDF 파일
    if (fileName.endsWith('.pdf')) {
      // PDF 시그니처 확인
      const header = buffer.slice(0, 4).toString('ascii')
      if (header !== '%PDF') {
        return NextResponse.json({ error: '올바른 PDF 파일이 아닙니다.' }, { status: 400 })
      }

      const text = extractPdfText(buffer)

      if (!text || text.length < 20) {
        return NextResponse.json(
          { error: 'PDF에서 텍스트를 추출할 수 없습니다.\n이미지 스캔 PDF이거나 보안이 걸린 파일일 수 있습니다.\nTXT 파일로 저장 후 업로드해주세요.' },
          { status: 400 }
        )
      }

      return NextResponse.json({ text })
    }

    // 지원하지 않는 형식
    return NextResponse.json(
      { error: 'TXT 또는 PDF 파일만 업로드 가능합니다.' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('파일 파싱 오류:', error)
    return NextResponse.json(
      { error: '파일을 읽는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
