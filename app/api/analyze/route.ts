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

    // 자소서 내용에서 JSON 파싱을 방해하는 특수문자 이스케이프
    const safeContent = content
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')

    const prompt = `당신은 10년 경력의 한국 대기업 인사담당자이자 자소서 전문 컨설턴트입니다.
아래 자기소개서를 분석하고, 구체적인 개선 방향을 제시해주세요.

${company ? `지원 회사: ${company}` : ''}
${position ? `지원 직무: ${position}` : ''}

자기소개서 내용:
<자소서>
${content}
</자소서>

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
모든 피드백은 한국어로 작성하세요.
문자열 값에 큰따옴표(")가 포함될 경우 반드시 이스케이프(\")해주세요.

{
  "totalScore": 종합점수(0-100 사이 정수),
  "summary": "자소서 전체에 대한 총평. 3-4문장. 강점과 약점을 균형있게 서술.",
  "mainIssue": "가장 심각한 문제점 1가지. 왜 문제인지 + 어떻게 개선해야 하는지 2-3문장으로 구체적으로.",
  "scores": {
    "logic": 논리성점수(0-100 정수),
    "specific": 구체성점수(0-100 정수),
    "fit": 직무적합성점수(0-100 정수),
    "expression": 표현력점수(0-100 정수)
  },
  "improvements": [
    {
      "category": "카테고리명(예: 지원동기, 성장과정, 직무역량 등)",
      "issue": "이 부분의 문제점을 1-2문장으로 설명",
      "original": "원문에서 문제가 되는 실제 문장이나 표현 (30자 이내로 발췌)",
      "suggestion": "구체적으로 어떻게 고쳐야 하는지 개선된 방향 제시 (2-3문장)",
      "addContent": "추가하면 좋을 내용이나 소재 제안 (있을 경우에만, 없으면 빈 문자열)"
    }
  ],
  "strongPoints": [
    "잘 된 점 1 (1문장)",
    "잘 된 점 2 (1문장)"
  ],
  "finalAdvice": "마지막 종합 조언. 가장 우선적으로 해야 할 것 1가지를 강조해서 2-3문장."
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // JSON 추출 — 여러 방법으로 시도
    let analysisResult = null

    // 방법 1: 직접 파싱
    try {
      const trimmed = responseText.trim()
      analysisResult = JSON.parse(trimmed)
    } catch (e) {}

    // 방법 2: 정규식으로 JSON 블록 추출
    if (!analysisResult) {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0])
        }
      } catch (e) {}
    }

    // 방법 3: 코드블록 안에서 추출
    if (!analysisResult) {
      try {
        const codeMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (codeMatch) {
          analysisResult = JSON.parse(codeMatch[1])
        }
      } catch (e) {}
    }

    if (!analysisResult) {
      throw new Error('AI 응답 파싱 오류가 발생했습니다. 다시 시도해주세요.')
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
