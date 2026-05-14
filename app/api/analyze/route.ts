import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    // ── 1. 인증 토큰 확인 ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // ── 2. Supabase로 토큰 검증 ──
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다. 다시 로그인해주세요.' }, { status: 401 })
    }

    // ── 3. 크레딧 확인 ──
    const { company, position, content, type = 'free' } = await req.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('free_trial_used, paid_credits, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 403 })
    }

    // 어드민은 무제한
    const isAdmin = profile.role === 'admin'

    if (!isAdmin) {
      if (type === 'free' && profile.free_trial_used) {
        return NextResponse.json({ error: '무료 체험을 이미 사용하셨습니다.' }, { status: 403 })
      }
      if (type === 'paid' && (profile.paid_credits || 0) <= 0) {
        return NextResponse.json({ error: '분석 크레딧이 없습니다. 구매 후 이용해주세요.' }, { status: 403 })
      }
    }

    // ── 4. 자소서 내용 검증 ──
    if (!content || content.trim().length < 100) {
      return NextResponse.json({ error: '자소서를 100자 이상 입력해주세요.' }, { status: 400 })
    }

    const isPaid = type === 'paid'

    const freePrompt = `당신은 10년 경력의 한국 대기업 인사담당자입니다.
아래 자기소개서를 분석해주세요.

${company ? `지원 회사: ${company}` : ''}
${position ? `지원 직무: ${position}` : ''}

자기소개서:
${content}

아래 JSON 형식으로만 응답하세요. 문자열 안에 큰따옴표가 있으면 반드시 작은따옴표로 대체하세요.

{"totalScore":숫자,"summary":"총평 3-4문장","mainIssue":"핵심문제 2-3문장"}`

    const paidPrompt = `당신은 10년 경력의 한국 대기업 인사담당자이자 자소서 전문 컨설턴트입니다.
아래 자기소개서를 심층 분석하고, 구체적인 개선 방향을 제시해주세요.

${company ? `지원 회사: ${company}` : ''}
${position ? `지원 직무: ${position}` : ''}

자기소개서:
${content}

아래 JSON 형식으로만 응답하세요. 문자열 안에 큰따옴표가 있으면 반드시 작은따옴표로 대체하세요.

{
  "totalScore": 숫자,
  "summary": "총평 3-4문장",
  "mainIssue": "핵심문제 2-3문장",
  "scores": {
    "logic": 숫자,
    "specific": 숫자,
    "fit": 숫자,
    "expression": 숫자
  },
  "improvements": [
    {
      "category": "카테고리",
      "issue": "문제점 1-2문장",
      "original": "원문 발췌 30자 이내",
      "suggestion": "개선방향 2-3문장",
      "addContent": "추가내용 제안 또는 빈문자열"
    }
  ],
  "strongPoints": ["잘된점1", "잘된점2"],
  "finalAdvice": "최종조언 2-3문장"
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isPaid ? 2048 : 1024,
      messages: [{ role: 'user', content: isPaid ? paidPrompt : freePrompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let analysisResult = null

    try { analysisResult = JSON.parse(responseText.trim()) } catch (e) {}

    if (!analysisResult) {
      try {
        const match = responseText.match(/\{[\s\S]*\}/)
        if (match) analysisResult = JSON.parse(match[0])
      } catch (e) {}
    }

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
      return NextResponse.json({ error: 'AI 응답 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    return NextResponse.json(analysisResult)

  } catch (error: any) {
    console.error('분석 오류:', error)
    return NextResponse.json({ error: error.message || '분석 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
