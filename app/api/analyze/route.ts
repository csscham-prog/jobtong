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

    const isAdmin = profile.role === 'admin'

    if (!isAdmin) {
      if (type === 'free' && profile.free_trial_used) {
        return NextResponse.json({ error: '무료 체험을 이미 사용하셨습니다.' }, { status: 403 })
      }
      if (type === 'paid' && (profile.paid_credits || 0) <= 0) {
        return NextResponse.json({ error: '분석 크레딧이 없습니다.' }, { status: 403 })
      }
    }

    // ── 4. 자소서 검증 ──
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

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.
문자열 내부에 큰따옴표(")가 있으면 반드시 작은따옴표(')로 바꾸세요.

{"totalScore":숫자,"summary":"총평 3-4문장","mainIssue":"가장 심각한 문제점과 개선방향 2-3문장"}`

    const paidPrompt = `당신은 15년 경력의 대기업 인사팀장이자 자소서 전문 컨설턴트입니다.
아래 자기소개서를 철저하게 분석하고 구체적인 개선안을 반드시 제시해야 합니다.

${company ? `지원 회사: ${company}` : ''}
${position ? `지원 직무: ${position}` : ''}

자기소개서 전문:
${content}

분석 지침:
1. improvements는 반드시 최소 3개 이상 작성하세요. 자소서가 아무리 좋아도 개선점은 항상 존재합니다.
2. original은 자소서에서 실제로 문제가 되는 문장을 그대로 발췌하세요.
3. suggestion은 구체적인 수정 방향을 2-3문장으로 작성하세요.
4. 모든 문자열 내부의 큰따옴표(")는 반드시 작은따옴표(')로 바꾸세요.
5. JSON 외에 다른 텍스트는 절대 출력하지 마세요.

아래 JSON 형식으로만 응답하세요:

{"totalScore":숫자,"summary":"총평 3-4문장. 강점과 개선점을 균형있게.","mainIssue":"가장 시급한 문제점 2-3문장","scores":{"logic":숫자,"specific":숫자,"fit":숫자,"expression":숫자},"improvements":[{"category":"카테고리명","issue":"이 부분의 문제점 설명","original":"원문 발췌 (30자 이내)","suggestion":"구체적 개선 방향 2-3문장","addContent":"추가하면 좋을 내용 제안 (없으면 빈 문자열)"},{"category":"카테고리명2","issue":"문제점2","original":"원문2","suggestion":"개선방향2","addContent":""},{"category":"카테고리명3","issue":"문제점3","original":"원문3","suggestion":"개선방향3","addContent":""}],"strongPoints":["잘된점1","잘된점2"],"finalAdvice":"최우선 개선사항과 합격을 위한 핵심 조언 2-3문장"}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isPaid ? 3000 : 1024,
      messages: [{ role: 'user', content: isPaid ? paidPrompt : freePrompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let analysisResult = null

    // 시도 1: 직접 파싱
    try { analysisResult = JSON.parse(responseText.trim()) } catch (e) {}

    // 시도 2: 정규식으로 JSON 추출
    if (!analysisResult) {
      try {
        const match = responseText.match(/\{[\s\S]*\}/)
        if (match) analysisResult = JSON.parse(match[0])
      } catch (e) {}
    }

    // 시도 3: 핵심 필드만 수동 추출
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

    // improvements가 없거나 비어있으면 기본값 추가
    if (isPaid && (!analysisResult.improvements || analysisResult.improvements.length === 0)) {
      analysisResult.improvements = [{
        category: '전반적 개선',
        issue: '자소서 전체적으로 더 구체적인 사례와 수치가 필요합니다.',
        original: '',
        suggestion: '각 문단에서 추상적인 표현 대신 실제 경험과 구체적인 성과 수치를 활용하여 신뢰도를 높이세요.',
        addContent: '지원 직무와 관련된 구체적인 프로젝트 경험이나 수치화된 성과를 추가하면 좋습니다.'
      }]
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
