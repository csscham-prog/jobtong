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

    const prompt = `당신은 10년 경력의 한국 대기업 인사담당자이자 자소서 전문 컨설턴트입니다.
아래 자기소개서를 분석해주세요.

${company ? `지원 회사: ${company}` : ''}
${position ? `지원 직무: ${position}` : ''}

자기소개서:
${content}

아래 JSON 형식으로만 응답하세요. 문자열 안에 큰따옴표가 있으면 반드시 작은따옴표로 대체하세요.

{"totalScore":숫자,"summary":"총평 3-4문장","mainIssue":"핵심문제 2-3문장"}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // JSON 파싱 시도
    let analysisResult = null

    // 시도 1: 직접 파싱
    try { analysisResult = JSON.parse(responseText.trim()) } catch (e) {}

    // 시도 2: 중괄호 추출
    if (!analysisResult) {
      try {
        const match = responseText.match(/\{[^{}]*\}/)
        if (match) analysisResult = JSON.parse(match[0])
      } catch (e) {}
    }

    // 시도 3: 수동 추출
    if (!analysisResult) {
      try {
        const scoreMatch = responseText.match(/"totalScore"\s*:\s*(\d+)/)
        const summaryMatch = responseText.match(/"summary"\s*:\s*"([^"]*)"/)
        const issueMatch = responseText.match(/"mainIssue"\s*:\s*"([^"]*)"/)

        if (scoreMatch) {
          analysisResult = {
            totalScore: parseInt(scoreMatch[1]),
            summary: summaryMatch ? summaryMatch[1] : '분석이 완료되었습니다.',
            mainIssue: issueMatch ? issueMatch[1] : '전체적인 개선이 필요합니다.',
          }
        }
      } catch (e) {}
    }

    if (!analysisResult) {
      return NextResponse.json(
        { error: 'AI 응답 오류가 발생했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json(analysisResult)
  } catch (error: any) {
    console.error('분석 오류:', error)
    return NextResponse.json(
      { error: error.message || '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
