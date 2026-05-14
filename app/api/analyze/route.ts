import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 토큰 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    // 2. Supabase 토큰 검증
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다. 다시 로그인해주세요.' }, { status: 401 })
    }

    // 3. 요청 데이터
    const body = await req.json()
    const company = body.company || ''
    const position = body.position || ''
    const content = body.content || ''
    const type = body.type || 'free'

    // 4. 크레딧 확인
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

    // 5. 자소서 검증
    if (!content || content.trim().length < 100) {
      return NextResponse.json({ error: '자소서를 100자 이상 입력해주세요.' }, { status: 400 })
    }

    const isPaid = type === 'paid'

    // 6. 자소서 내용 안전 처리 — 큰따옴표 등 JSON 파싱 방해 문자 제거
    const safeContent = content
      .replace(/"/g, "'")
      .replace(/\\/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .trim()

    // 7. 프롬프트 구성
    const companyLine = company ? '지원 회사: ' + company : ''
    const positionLine = position ? '지원 직무: ' + position : ''

    const freePrompt = '당신은 10년 경력의 한국 대기업 인사담당자입니다.\n' +
      '아래 자기소개서를 분석해주세요.\n\n' +
      companyLine + '\n' + positionLine + '\n\n' +
      '자기소개서:\n' + safeContent + '\n\n' +
      '반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.\n' +
      '문자열 내부에 큰따옴표가 있으면 반드시 작은따옴표로 바꾸세요.\n\n' +
      '{"totalScore":숫자,"summary":"총평 3-4문장","mainIssue":"핵심문제 2-3문장"}'

    const paidPrompt = '당신은 15년 경력의 대기업 인사팀장이자 자소서 전문 컨설턴트입니다.\n' +
      '아래 자기소개서를 최고 수준으로 분석하고 전문가 수준의 구체적인 피드백을 제공하세요.\n\n' +
      companyLine + '\n' + positionLine + '\n\n' +
      '자기소개서:\n' + safeContent + '\n\n' +
      '[필수 지침]\n' +
      '1. summary: 4-5문장으로 강점과 약점을 균형있게 상세히 작성\n' +
      '2. mainIssue: 합격을 가장 크게 방해하는 핵심 문제 2-3문장\n' +
      '3. scores: 논리성/구체성/직무적합성/표현력 각각 0-100점으로 정밀 평가\n' +
      '4. improvements: 반드시 5개 이상 작성. 각 항목마다 category/issue/original/suggestion/addContent 포함\n' +
      '   - issue: 면접관 입장에서 2-3문장으로 구체적으로\n' +
      '   - original: 자소서에서 문제 문장 실제 발췌 (50자 이내)\n' +
      '   - suggestion: 구체적 수정 방향 3-4문장\n' +
      '   - addContent: 추가하면 합격률 올라가는 구체적 소재\n' +
      '5. strongPoints: 면접관이 긍정적으로 볼 강점 3-4개. 왜 강점인지 설명 포함\n' +
      '6. finalAdvice: 합격을 위한 핵심 전략 3-4문장\n' +
      '7. 문자열 내 큰따옴표는 작은따옴표로 바꾸세요\n' +
      '8. JSON 외 텍스트 절대 출력 금지\n\n' +
      '{"totalScore":숫자,"summary":"4-5문장상세총평","mainIssue":"핵심문제2-3문장","scores":{"logic":숫자,"specific":숫자,"fit":숫자,"expression":숫자},"improvements":[{"category":"카테고리1","issue":"문제점2-3문장","original":"원문발췌50자이내","suggestion":"개선방향3-4문장","addContent":"추가소재"},{"category":"카테고리2","issue":"문제점2","original":"원문2","suggestion":"개선2","addContent":"추가2"},{"category":"카테고리3","issue":"문제점3","original":"원문3","suggestion":"개선3","addContent":"추가3"},{"category":"카테고리4","issue":"문제점4","original":"원문4","suggestion":"개선4","addContent":"추가4"},{"category":"카테고리5","issue":"문제점5","original":"원문5","suggestion":"개선5","addContent":"추가5"}],"strongPoints":["강점1-이유포함","강점2-이유포함","강점3-이유포함"],"finalAdvice":"합격전략3-4문장"}'

    // 7. AI 분석
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isPaid ? 8192 : 1024,
      messages: [{ role: 'user', content: isPaid ? paidPrompt : freePrompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('=== AI 응답 전체 길이:', responseText.length, '===')
    console.log('=== AI 응답 앞부분 ===')
    console.log(responseText.substring(0, 1000))
    console.log('=== AI 응답 뒷부분 ===')
    console.log(responseText.substring(responseText.length - 500))
    console.log('=== 끝 ===')

    let analysisResult: any = null

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

    console.log('=== 파싱결과 improvements수:', analysisResult.improvements?.length || 0, '===')

    if (isPaid && (!analysisResult.improvements || analysisResult.improvements.length === 0)) {
      analysisResult.improvements = [{
        category: '전반적 개선',
        issue: '자소서 전체적으로 더 구체적인 사례와 수치가 필요합니다.',
        original: '',
        suggestion: '각 문단에서 추상적인 표현 대신 실제 경험과 구체적인 성과 수치를 활용하여 신뢰도를 높이세요.',
        addContent: '지원 직무와 관련된 구체적인 프로젝트 경험이나 수치화된 성과를 추가하면 좋습니다.',
      }]
    }

    // 8. DB 저장
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
      console.error('저장 실패:', e)
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
