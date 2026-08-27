import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function safeText(text: string): string {
  return text.replace(/"/g, "'").replace(/\\/g, ' ').replace(/\r/g, ' ').trim()
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다. 다시 로그인해주세요.' }, { status: 401 })
    }

    const body = await req.json()
    const sessionId = body.sessionId
    const answers: string[] = Array.isArray(body.answers) ? body.answers : []

    if (!sessionId || answers.length !== 5) {
      return NextResponse.json({ error: '요청 데이터가 올바르지 않습니다.' }, { status: 400 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: session, error: fetchError } = await adminSupabase
      .from('mock_interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 })
    }
    if (session.analyzed) {
      return NextResponse.json({ error: '이미 분석이 완료된 세션입니다.' }, { status: 400 })
    }

    const questions = session.questions as { question: string; evaluationFocus: string }[]
    const qaBlocks = questions.map((q, i) => {
      const ans = safeText((answers[i] || '').slice(0, 2000))
      return '질문 ' + (i + 1) + ': ' + q.question + '\n' +
        '이 질문의 평가 기준: ' + q.evaluationFocus + '\n' +
        '지원자 답변 ' + (i + 1) + ': ' + (ans || '(답변 없음)')
    }).join('\n\n')

    const analysisPrompt = '당신은 대기업 실무 면접관이자 취업 컨설턴트입니다. 방금 진행한 모의 면접의 답변 5개를 정밀하게 채점하고 피드백하세요.\n\n' +
      '[지원자 서류]\n' +
      '이력서/경력기술서:\n' + session.resume_text + '\n\n' +
      '자기소개서:\n' + session.coverletter_text + '\n' +
      (session.job_posting_text ? '\n채용공고:\n' + session.job_posting_text + '\n' : '') + '\n' +
      '[면접 질문과 답변]\n' + qaBlocks + '\n\n' +
      '[답변마다 반드시 아래 6가지 기준으로 평가하세요]\n' +
      '1. 질문 적합성: 실제로 물어본 것에 답했는가, 논점을 벗어나지 않았는가\n' +
      '2. 구체성: 추상적 선언("열심히 하겠습니다")인지, 구체적 사례·수치가 있는지\n' +
      '3. 구조: 상황-행동-결과(STAR) 흐름이 있는지, 두서없이 나열만 하는지\n' +
      '4. 서류와의 일치: 답변 내용이 이력서·자소서에 있는 내용과 일치하는지, 서류에 없던 새로운(검증 안 된) 주장을 하지는 않는지\n' +
      '5. 길이·밀도: 너무 짧아 성의 없어 보이는지, 너무 길어 핵심이 흐려지는지\n' +
      '6. 구어체 필러: "음", "그니까", "일단" 같은 채워넣기 표현이 답변에 많이 남아있는지 (음성 인식 텍스트이므로 실제 말버릇으로 간주해도 됨)\n\n' +
      '[출력 필드별 필수 지침]\n' +
      '- questionFeedback: 질문 5개 순서 그대로, 각 항목마다\n' +
      '  · score: 0-100점, 위 6가지 기준을 종합한 이 답변의 점수\n' +
      '  · strengths: 이 답변에서 실제로 잘한 점 1-2문장 (있는 그대로, 없으면 "이 답변에서는 뚜렷한 강점을 찾기 어렵습니다"라고 솔직하게 쓸 것)\n' +
      '  · issues: 이 답변에서 발견된 문제를 짧은 태그로 배열에 담기 (예: ["구체성 부족","서류와 불일치","장황함","필러 표현 다수"]). 문제가 없으면 빈 배열 []\n' +
      '  · improvement: 다음에 같은 질문을 받으면 어떻게 답하면 더 좋을지 구체적인 방향 2-3문장. 답변에 등장한 실제 표현을 인용해서 어디를 어떻게 바꾸면 되는지 설명할 것\n' +
      '- overallScore: 5개 답변의 종합 점수(0-100). 단순 평균이 아니라, 반복적으로 나타난 약점에 가중치를 둬서 종합 판단\n' +
      '- overallSummary: 4-5문장. 이 지원자가 실제 면접에 들어갔을 때 면접관이 받을 인상을 냉정하게 서술\n' +
      '- repeatedPatterns: 5개 답변에 걸쳐 반복적으로 나타난 습관·패턴 2-4개 (예: "매 답변마다 결과 수치가 빠져 있음", "질문의 핵심보다 배경 설명에 시간을 씀"). 각 항목은 구체적 근거(몇 번 질문에서 나타났는지)를 포함할 것\n' +
      '- finalAdvice: 다음 모의 면접이나 실제 면접 전까지 가장 우선적으로 고쳐야 할 것 3-4문장\n\n' +
      '[톤 가이드]\n' +
      '- 비판의 대상은 언제나 답변의 내용과 구성이지, 지원자라는 사람이 아닙니다\n' +
      '- 냉정함은 평가를 흐리지 않는 정직함이지 사람을 깎아내리는 날카로움이 아닙니다\n' +
      '- 모든 지적 뒤에는 반드시 그래서 어떻게 다르게 답하면 되는지가 함께 제시되어야 합니다\n' +
      '- 답변이 비어있거나 지나치게 짧으면(20자 미만) 정직하게 낮은 점수를 주고 그 사실을 그대로 알려주세요. 없는 내용을 좋게 포장하지 마세요\n\n' +
      '[금지 사항]\n' +
      '- 지원자의 서류나 답변에 없는 내용을 지어내지 마세요\n' +
      '- 문자열 내 큰따옴표는 작은따옴표로 바꾸세요\n' +
      '- JSON 외 텍스트 절대 출력 금지\n\n' +
      '반드시 아래 JSON 형식으로만 응답하세요.\n' +
      '{"overallScore":숫자,"overallSummary":"...","repeatedPatterns":["...","..."],"questionFeedback":[{"question":"...","answer":"...","score":숫자,"strengths":"...","issues":["..."],"improvement":"..."}],"finalAdvice":"..."}'

    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: analysisPrompt }],
    })

    const textBlock = message.content?.find((b: any) => b.type === 'text')
    const responseText = textBlock?.text || ''

    let result: any = null
    try { result = JSON.parse(responseText.trim()) } catch (e) {}
    if (!result) {
      try {
        const m = responseText.match(/\{[\s\S]*\}/)
        if (m) result = JSON.parse(m[0])
      } catch (e) {}
    }
    if (!result) {
      return NextResponse.json({ error: 'AI 응답 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    await adminSupabase
      .from('mock_interview_sessions')
      .update({ answers, result_json: result, analyzed: true })
      .eq('id', sessionId)

    try {
      await adminSupabase.from('analyses').insert({
        user_id: user.id,
        company: session.company,
        position: session.position,
        content_length: session.resume_text.length + session.coverletter_text.length,
        total_score: result.overallScore,
        is_free_trial: false,
        analyze_type: 'mock_interview',
        doc_type: 'mock_interview',
        result_json: result,
      })
    } catch (e) {
      console.error('모의 면접 결과 analyses 저장 실패:', e)
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('모의 면접 분석 오류:', error)
    return NextResponse.json({ error: error.message || '오류가 발생했습니다.' }, { status: 500 })
  }
}
