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
아래 자기소개서를 최고 수준으로 철저하게 분석하고, 취업 컨설팅 전문가 수준의 구체적인 피드백을 제공해야 합니다.

${company ? `지원 회사: ${company}` : ''}
${position ? `지원 직무: ${position}` : ''}

자기소개서 전문:
${content}

[필수 분석 지침 — 반드시 준수]
1. summary: 자소서의 전체적인 인상, 강점, 약점을 균형있게 4-5문장으로 상세히 작성하세요.
2. mainIssue: 합격을 가장 크게 방해하는 핵심 문제를 2-3문장으로 구체적으로 작성하세요.
3. scores: 논리성/구체성/직무적합성/표현력 각각을 0-100점으로 정밀하게 평가하세요.
4. improvements: 반드시 5개 이상 작성하세요. 자소서가 아무리 좋아도 개선점은 항상 존재합니다. 각 항목은:
   - category: 해당 문단이나 항목명 (예: 지원동기, 성장과정, 직무역량, 표현방식 등)
   - issue: 왜 문제인지 면접관 입장에서 2-3문장으로 구체적으로 설명
   - original: 자소서에서 문제가 되는 실제 문장 발췌 (반드시 포함, 50자 이내)
   - suggestion: 어떻게 고쳐야 하는지 구체적인 수정 방향 3-4문장 (단순히 '구체적으로 써라'가 아닌 실질적 방향)
   - addContent: 이 부분에 추가하면 합격률이 올라가는 구체적인 소재나 내용 제안
5. strongPoints: 면접관이 긍정적으로 볼 강점을 3-4개 구체적으로 작성하세요. 단순히 '잘 썼다'가 아닌 왜 강점인지 설명 포함.
6. finalAdvice: 이 자소서로 합격하려면 가장 우선적으로 해야 할 것과 핵심 전략을 3-4문장으로 작성하세요.
7. 모든 문자열 내부의 큰따옴표(")는 반드시 작은따옴표(')로 바꾸세요.
8. JSON 외에 다른 텍스트는 절대 출력하지 마세요.

아래 JSON 형식으로만 응답하세요:

{"totalScore":숫자,"summary":"4-5문장 상세 총평","mainIssue":"핵심 문제 2-3문장","scores":{"logic":숫자,"specific":숫자,"fit":숫자,"expression":숫자},"improvements":[{"category":"카테고리1","issue":"문제점 2-3문장","original":"원문 발췌","suggestion":"구체적 개선방향 3-4문장","addContent":"추가 소재 제안"},{"category":"카테고리2","issue":"문제점2","original":"원문2","suggestion":"개선방향2","addContent":"추가내용2"},{"category":"카테고리3","issue":"문제점3","original":"원문3","suggestion":"개선방향3","addContent":"추가내용3"},{"category":"카테고리4","issue":"문제점4","original":"원문4","suggestion":"개선방향4","addContent":"추가내용4"},{"category":"카테고리5","issue":"문제점5","original":"원문5","suggestion":"개선방향5","addContent":"추가내용5"}],"strongPoints":["강점1 — 구체적 설명","강점2 — 구체적 설명","강점3 — 구체적 설명"],"finalAdvice":"합격 전략 3-4문장"}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isPaid ? 4096 : 1024,
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

    // ── 5. 분석 결과 DB 저장 ──
    try {
      await supabase.from('analyses').insert({
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
      // 저장 실패해도 결과는 반환
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
