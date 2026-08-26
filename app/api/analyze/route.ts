import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 채용공고 PDF 업로드 제한 (유료 분석 전용)
const JOB_POSTING_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const JOB_POSTING_MAX_TEXT_LENGTH = 6000 // 추출 텍스트가 너무 길면 토큰 절약을 위해 자름

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
    const jobPostingBase64 = body.jobPostingBase64 || '' // 채용공고 PDF (유료 전용, 선택)
    const companyInfo = (body.companyInfo || '').slice(0, 1000) // 기업 문화/인재상 정보 (무료/유료 공통, 선택)

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
    if (content.trim().length > 5000) {
      return NextResponse.json({ error: '자소서는 5,000자 이하로 입력해주세요.' }, { status: 400 })
    }

    const isPaid = type === 'paid'

    // 6-1. 채용공고 PDF 처리 (유료 분석 전용, 선택 사항)
    let jobPostingText = ''
    let jobPostingError = ''
    if (jobPostingBase64 && isPaid) {
      try {
        const buffer = Buffer.from(jobPostingBase64, 'base64')

        if (buffer.length > JOB_POSTING_MAX_SIZE) {
          jobPostingError = '채용공고 파일이 5MB를 초과하여 분석에 반영되지 않았습니다.'
        } else {
          const parsed = await pdfParse(buffer)
          const extracted = (parsed.text || '').trim()

          if (extracted.length < 30) {
            // 이미지 기반 PDF 등 텍스트 추출이 거의 안 된 경우
            jobPostingError = '채용공고 PDF에서 텍스트를 추출하지 못해 분석에 반영되지 않았습니다. (이미지로 저장된 PDF는 지원하지 않습니다)'
          } else {
            jobPostingText = extracted
              .replace(/"/g, "'")
              .replace(/\\/g, ' ')
              .slice(0, JOB_POSTING_MAX_TEXT_LENGTH)
          }
        }
      } catch (e) {
        console.error('채용공고 PDF 파싱 실패:', e)
        jobPostingError = '채용공고 PDF를 읽는 중 오류가 발생하여 분석에 반영되지 않았습니다.'
      }
    }

    // 6-2. 자소서 내용 안전 처리 — 큰따옴표 등 JSON 파싱 방해 문자 제거
    const safeContent = content
      .replace(/"/g, "'")
      .replace(/\\/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .trim()

    // 6-3. 기업 문화/인재상 정보 안전 처리 (무료/유료 공통, 선택)
    const safeCompanyInfo = companyInfo
      .replace(/"/g, "'")
      .replace(/\\/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .trim()

    // 7. 프롬프트 구성
    // 무료/유료 모두 동일한 고품질 전체 분석 프롬프트를 사용합니다.
    // 무료는 응답 시 일부 필드만 노출하여, 퀄리티는 동일하되 공개 범위만 다르게 처리합니다.
    const companyLine = company ? '지원 회사: ' + company : '지원 회사: 명시되지 않음 (일반적인 대기업 채용 기준으로 판단)'
    const positionLine = position ? '지원 직무: ' + position : '지원 직무: 명시되지 않음 (자소서 내용 기반으로 직무 추정 후 판단)'
    const companyInfoLine = safeCompanyInfo ? '기업 문화/인재상 정보: ' + safeCompanyInfo : ''

    const companyInfoSection = safeCompanyInfo
      ? '\n[기업 정보 반영 지침 - 기업 문화/인재상 정보가 제공된 경우에만 적용]\n' +
        '- 자소서에 사용된 표현과 강조하는 가치가 이 회사의 인재상·핵심가치와 얼마나 일치하는지 판단하세요\n' +
        '- 일치하는 부분이 있다면 strongPoints에서 "이 회사의 [가치명]과 부합한다"고 구체적으로 짚어주세요\n' +
        '- 반대로 회사가 중요시하는 가치인데 자소서에 전혀 드러나지 않은 부분이 있다면 mainIssue 또는 improvements에서 지적하고, addContent에 그 가치를 보여줄 수 있는 소재를 제안하세요\n'
      : ''

    const jobPostingSection = jobPostingText
      ? '\n[채용공고 원문 - 반드시 이 내용을 기준으로 직무적합성을 판단하세요]\n' + jobPostingText + '\n' +
        '위 채용공고에 명시된 자격요건, 우대사항, 주요 업무를 자소서 내용과 직접 대조하여 분석하세요. ' +
        '채용공고에서 요구하는 역량 중 자소서에 누락된 부분이 있다면 mainIssue 또는 improvements에서 구체적으로 지적하고, ' +
        'addContent에는 이 채용공고 맥락에서 특히 효과적일 소재를 우선적으로 제시하세요.\n'
      : ''

    const fullPrompt = '당신은 삼성전자, LG, 현대자동차, SK 등 국내 주요 대기업에서 15년간 서류 전형을 담당해온 인사팀장이자 자소서 전문 컨설턴트입니다. 당신의 피드백을 받은 지원자들의 서류 통과율은 업계 평균 대비 2배 이상입니다.\n\n' +
      '당신의 목표는 이 자소서가 "서류에서 합격할 수 있는 수준"이 되도록 구체적이고 실행 가능한 개선안을 제시하는 것입니다. 막연한 조언이 아니라, 그대로 적용하면 합격률이 실제로 올라가는 피드백을 작성하세요.\n\n' +
      '[분석 대상]\n' + companyLine + '\n' + positionLine + (companyInfoLine ? '\n' + companyInfoLine : '') + '\n' + jobPostingSection + companyInfoSection + '\n' +
      '자기소개서:\n' + safeContent + '\n\n' +
      '[분석 순서 - 반드시 이 순서로 사고하세요]\n' +
      '1단계: 자소서를 문단/항목 단위로 나누어 각각의 문제점을 먼저 파악하세요\n' +
      '2단계: 파악한 문제를 근거로 4개 항목의 점수를 매기세요\n' +
      '3단계: 가장 치명적인 문제부터 우선순위를 정해 개선안을 작성하세요\n' +
      '4단계: 전체를 종합해 총평과 최종 전략을 작성하세요\n\n' +
      '[역량 채점 기준 - 반드시 아래 기준에 따라 채점하세요]\n' +
      '- 논리성(logic): 90점대는 지원동기-경험-직무를 하나의 스토리로 관통하며 자연스럽게 연결됨. 80점대는 전체 흐름은 있으나 한두 문단의 연결이 다소 매끄럽지 않음. 70점대는 각 문단의 내용은 괜찮으나 문단 간 연결이 약해 스토리보다는 나열에 가까움. 60점대는 지원동기와 경험, 직무 사이의 인과관계가 불명확해 왜 이 이야기를 하는지 이해하기 어려움. 50점 미만은 문단들이 서로 무관하게 따로 놀아 하나의 메시지로 읽히지 않음\n' +
      '- 구체성(specific): 90점대는 대부분의 경험에 수치·기간·규모가 명시된 성과가 포함됨. 80점대는 주요 경험에는 구체적 근거가 있으나 일부는 서술이 다소 추상적임. 70점대는 구체적 사례가 부분적으로만 있고 나머지는 일반적인 설명에 그침. 60점대는 구체적 수치나 사례가 드물고 "노력했다", "배웠다" 같은 표현이 자주 등장함. 50점 미만은 "노력했다", "성장했다" 같은 추상적 서술로만 채워져 있어 실제 경험의 크기를 가늠할 수 없음\n' +
      '- 직무적합성(fit): 90점대는 지원 직무의 실제 업무를 정확히 이해하고 그에 맞는 경험을 배치함. 80점대는 직무 이해는 드러나나 경험과 직무의 연결이 한 번 더 설명되면 좋을 수준. 70점대는 직무 관련 경험은 있으나 왜 그 경험이 이 직무에 도움이 되는지 명시적으로 연결되지 않음. 60점대는 직무와의 관련성이 약한 경험 위주로 구성되어 이 직무를 위해 준비했다는 인상이 약함. 50점 미만은 범용적인 자기소개로 채워져 있어 다른 직무·다른 회사에도 그대로 제출할 수 있는 수준. 기업 문화/인재상 정보가 제공된 경우, 자소서의 가치관·표현이 그 회사와 얼마나 부합하는지도 함께 반영\n' +
      '- 표현력(expression): 90점대는 문장이 간결하고 핵심이 먼저 나오며 읽는 흐름이 매끄러움. 80점대는 전반적으로 좋으나 일부 문장이 다소 길거나 어순이 아쉬움. 70점대는 의미 전달에는 문제없으나 상투적 표현이 종종 등장함. 60점대는 만연체나 같은 표현의 반복이 눈에 띄어 가독성이 떨어짐. 50점 미만은 문장이 지나치게 길거나 상투적 표현이 반복되어 읽기 피로도가 높음\n\n' +
      '[출력 필드별 필수 지침]\n' +
      '- totalScore: 100점 만점 중 실제 서류 합격 가능성을 반영한 점수 (80점 이상: 합격권 / 60-79점: 보완 시 합격 가능 / 60점 미만: 대폭 수정 필요)\n' +
      '- summary: 4-5문장. 이 자소서가 "현재 상태로 서류를 통과할 수 있는지"를 명확히 판단하는 문장을 반드시 포함. 완곡하게 포장하지 말되, 지원자를 평가하지 말고 자소서의 상태만 평가할 것\n' +
      '- mainIssue: 서류 탈락 확률을 가장 높이는 단 하나의 치명적 문제를 2-3문장으로 지적. 일반론이 아니라 이 자소서에서만 발견되는 구체적 문제여야 하며, 문제 지적과 함께 개선 방향을 암시할 것\n' +
      '- scores: 위 채점 기준에 따라 0-100점 정밀 평가\n' +
      '- improvements: 반드시 5개 이상. 우선순위가 높은 순서로 배열. 각 항목:\n' +
      '  · category: 문제 유형을 한 단어로\n' +
      '  · issue: 면접관이 이 부분을 읽을 때 드는 실제 의문을 2-3문장으로\n' +
      '  · original: 자소서 원문에서 실제로 발췌 (50자 이내). 절대 지어내지 말 것\n' +
      '  · suggestion: "이렇게 바꾸면 합격 가능성이 올라간다"는 구체적 방향을 3-4문장으로. 막연한 조언 금지. 실제 적용 가능한 문장 구조나 소재를 제시\n' +
      '  · addContent: 이 지원자가 실제로 겪었을 법한 경험 중, 언급 안 됐지만 추가하면 직무 적합성이 크게 올라갈 구체적 소재\n' +
      '- strongPoints: 실제 채용 담당자가 눈여겨볼 강점 3-4개. 단순 칭찬이 아니라 "이 부분이 왜 다른 지원자와 차별화되는지" 설명 포함\n' +
      '- finalAdvice: 이 자소서를 서류 합격 수준으로 끌어올리기 위한 최우선 실행 전략 3-4문장. 가장 효과가 큰 수정 포인트부터 순서대로 제시\n\n' +
      '[톤 가이드 - 반드시 지키세요]\n' +
      '- 비판의 대상은 언제나 "자소서의 문장과 구성"이지, "지원자라는 사람"이 아닙니다\n' +
      '- "무능해 보인다", "자격이 없다", "~라고 자백하는 것과 같다" 처럼 지원자의 인격·능력을 규정하거나\n' +
      '  판정하는 표현은 사용하지 마세요. 대신 "이 문장이 ~라는 인상을 줄 수 있습니다",\n' +
      '  "~로 읽혀 채용담당자의 의문을 살 수 있습니다"처럼 문장이 만드는 인상을 지적하세요\n' +
      '- 냉정함은 "평가를 흐리지 않는 정직함"이지 "사람을 깎아내리는 날카로움"이 아닙니다.\n' +
      '  점수와 지적은 엄격하게 하되, 표현은 담담하고 전문가답게 유지하세요\n' +
      '- 모든 지적 뒤에는 반드시 "그래서 어떻게 고치면 되는지"가 함께 제시되어야 합니다.\n' +
      '  문제 지적으로 끝나는 문장을 만들지 마세요\n\n' +
      '[금지 사항]\n' +
      '- original 필드에 자소서에 없는 문장을 지어내지 마세요\n' +
      '- "구체적으로 쓰세요", "노력을 어필하세요" 같은 뻔하고 일반적인 조언 금지\n' +
      '- 근거 없이 좋게 포장하지 말고, 실제 서류 탈락 가능성은 냉정하게 전달하되, 지원자 개인을 비하하거나 인격을 평가하는 표현은 금지\n' +
      '- 문자열 내 큰따옴표는 작은따옴표로 바꾸세요\n' +
      '- JSON 외 텍스트 절대 출력 금지\n\n' +
      '반드시 아래 JSON 형식으로만 응답하세요.\n' +
      '{"totalScore":숫자,"summary":"...","mainIssue":"...","scores":{"logic":숫자,"specific":숫자,"fit":숫자,"expression":숫자},"improvements":[{"category":"...","issue":"...","original":"...","suggestion":"...","addContent":"..."}],"strongPoints":["...","...","..."],"finalAdvice":"..."}'

    // 8. AI 분석 — 무료/유료 모두 동일한 전체 분석 프롬프트 사용 (퀄리티 동일)
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 30000,
      messages: [{ role: 'user', content: fullPrompt }],
    })

    // thinking 사용 시 content[0]이 thinking 블록일 수 있으므로 type이 'text'인 블록을 찾음
    const textBlock = message.content?.find((b: any) => b.type === 'text')
    const responseText = textBlock?.text || ''

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

    if (isPaid && (!analysisResult.improvements || analysisResult.improvements.length === 0)) {
      analysisResult.improvements = [{
        category: '전반적 개선',
        issue: '자소서 전체적으로 더 구체적인 사례와 수치가 필요합니다.',
        original: '',
        suggestion: '각 문단에서 추상적인 표현 대신 실제 경험과 구체적인 성과 수치를 활용하여 신뢰도를 높이세요.',
        addContent: '지원 직무와 관련된 구체적인 프로젝트 경험이나 수치화된 성과를 추가하면 좋습니다.',
      }]
    }

    // 9. DB 저장 — 내부적으로는 무료 분석도 전체 결과를 저장 (추후 업셀에 활용 가능)
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

    // 10. 응답 반환 — 무료는 일부 필드만 노출 (퀄리티는 유료와 동일, 공개 범위만 다름)
    if (!isPaid) {
      return NextResponse.json({
        totalScore: analysisResult.totalScore,
        summary: analysisResult.summary,
        mainIssue: analysisResult.mainIssue,
      })
    }

    if (jobPostingError) {
      analysisResult.jobPostingWarning = jobPostingError
    } else if (jobPostingText) {
      analysisResult.jobPostingApplied = true
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
