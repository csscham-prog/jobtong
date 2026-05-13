import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

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

    // txt 파일
    if (fileName.endsWith('.txt')) {
      const text = buffer.toString('utf-8')
      return NextResponse.json({ text })
    }

    // doc / docx 파일
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value?.trim() || ''

      if (!text) {
        return NextResponse.json(
          { error: '파일에서 텍스트를 추출할 수 없습니다. TXT 파일로 변환 후 업로드해주세요.' },
          { status: 400 }
        )
      }

      return NextResponse.json({ text })
    }

    return NextResponse.json(
      { error: '지원하지 않는 파일 형식입니다. TXT, DOC, DOCX 파일만 가능합니다.' },
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
