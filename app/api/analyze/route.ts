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

    // ── 2. Supabase 토큰 검증 ──
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

    // ── 5. AI 분석 (tool_use로 JSON 100% 보장) ──
    const systemPrompt = isPaid
      ? `당신은 15년 경력의 대기업 인사팀장이자 자소서 전문 컨설턴트입니다. 반드시 analyze_resume 함수를 호출하여 분석 결과를 반환해야 합니다.`
      : `당신은 10년 경력의 한국 대기업 인사담당자입니다. 반드시 analyze_resume_free 함수를 호출하여 분석 결과를 반환해야 합니다.`

    const userMessage = `아래 자기소개서를 분석해주세요.
${company ? `\n지원 회사: ${company}` : ''}${position ? `\n지원 직무: ${position}` : ''}

자기소개서:
${content}`

    const freeTools: Anthropic.Tool[] = [{
      name: 'analyze_resume_free',
      description: '자소서를 분석하여 총평과 핵심 문제를 반환합니다.',
      input_schema: {
        type: 'object' as const,
        properties: {
          totalScore: { type: 'number', description: '종합 점수 0-100' },
          summary: { type: 'string', description: '전체 총평 3-4문장' },
          mainIssue: { type: 'string', description: '가장 심각한 문제점과 개선방향 2-3문장' },
        },
        required: ['totalScore', 'summary', 'mainIssue'],
      },
    }]

    const paidTools: Anthropic.Tool[] = [{
      name: 'analyze_resume',
      description: '자소서를 심층 분석하여 전문가 수준의 상세 피드백을 반환합니다.',
      input_schema: {
        type: 'object' as const,
        properties: {
          totalScore: { type: 'number', description: '종합 점수 0-100' },
          summary: { type: 'string', description: '전체 총평 4-5문장. 강점과 약점을 균형있게 상세히.' },
          mainIssue: { type: 'string', description: '합격을 가장 크게 방해하는 핵심 문제 2-3문장' },
          scores: {
            type: 'object',
            description: '항목별 점수',
            properties: {
              logic: { type: 'number', description: '논리성 0-100' },
              specific: { type: 'number', description: '구체성 0-100' },
              fit: { type: 'number', description: '직무적합성 0-100' },
              expression: { type: 'number', description: '표현력 0-100' },
            },
            required: ['logic', 'specific', 'fit', 'expression'],
          },
          improvements: {
            type: 'array',
            description: '문장 개선 제안 — 반드시 5개 이상',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', description: '카테고리 (지원동기, 성장과정, 직무역량 등)' },
                issue: { type: 'string', description: '문제점 2-3문장. 면접관 입장에서 구체적으로.' },
                original: { type: 'string', description: '자소서에서 문제가 되는 실제 문장 발췌 50자 이내' },
                suggestion: { type: 'string', description: '구체적 수정 방향 3-4문장. 실질적인 내용으로.' },
                addContent: { type: 'string', description: '추가하면 합격률이 올라가는 구체적 소재 제안' },
              },
              required: ['category', 'issue', 'original', 'suggestion', 'addContent'],
            },
            minItems: 5,
          },
          strongPoints: {
            type: 'array',
            description: '면접관이 긍정적으로 볼 강점 3-4개. 왜 강점인지 설명 포함.',
            items: { type: 'string' },
            minItems: 3,
          },
          finalAdvice: { type: 'string', description: '합격을 위한 핵심 전략과 우선 개선사항 3-4문장' },
        },
        required: ['totalScore', 'summary', 'mainIssue', 'scores', 'improvements', 'strongPoints', 'finalAdvice'],
      },
    }]

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isPaid ? 4096 : 1024,
      system: systemPrompt,
      tools: isPaid ? paidTools : freeTools,
      tool_choice: { type: 'required' },
      messages: [{ role: 'user', content: userMessage }],
    })

    // tool_use 결과 추출
    const toolUse = message.content.find((c: any) => c.type === 'tool_use')
    if (!toolUse || !('input' in toolUse)) {
      return NextResponse.json({ error: 'AI 분석 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    const analysisResult = toolUse.input as any

    // ── 6. 분석 결과 DB 저장 ──
    try {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await adminSupabase.from('analyses').insert({
        user_id: user.id,
        company: company || null,
        position: position || null,
        content_length: content.trim().length,
        total_score: analysisResult.totalScore,
        is_free_trial: !isPaid,
        analyze_type: type,
        result_json: analysisResult,
      })
    } catch (e) {
      console.error('분석 결과 저장 실패:', e)
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
