import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { company, position, content } = await req.json()

    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { error: '자소서를 100자 이상 입력해주세요.' },
        { status: 400 }
      )
    }

    const prompt = `당신은 10년 경력의 한국 대기업 인사담당자입니다. 아래 자기소개서를 분석해주세요.

${company ? `지원 회사: ${company}` : ''}
${position ? `지원 직무: ${position}` : ''}

자기소개서:
${content}

아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:

{
  "totalScore": 종합점수(0-100 사이 숫자),
  "summary": "자소서 전체에 대한 총평 (3-4문장, 구체적으로)",
  "mainIssue": "가장 심각한 문제점 1가지와 개선 방향 (2-3문장, 매우 구체적으로)"
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : ''

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI 응답 파싱 오류')
    }

    const analysisResult = JSON.parse(jsonMatch[0])

    return NextResponse.json(analysisResult)

  } catch (error: any) {
    console.error('분석 오류:', error)
    return NextResponse.json(
      { error: error.message || '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
