import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 이력서 파일 업로드 제한 (기존 analyze API와 동일한 기준)
const RESUME_FILE_MAX_SIZE = 10 * 1024 * 1024 // 파일당 10MB
const RESUME_FILE_MAX_COUNT = 3 // 최대 3개 파일
const RESUME_TOTAL_TEXT_MAX_LENGTH = 12000

const COVERLETTER_MAX_LENGTH = 5000
const JOB_POSTING_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const JOB_POSTING_MAX_TEXT_LENGTH = 4000

interface UploadedFile {
  base64: string
  fileName: string
}

async function extractTextFromFile(file: UploadedFile): Promise<{ text: string; error: string }> {
  try {
    const buffer = Buffer.from(file.base64, 'base64')

    if (buffer.length > RESUME_FILE_MAX_SIZE) {
      return { text: '', error: file.fileName + ': 파일 용량이 10MB를 초과하여 처리하지 못했습니다.' }
    }

    const lowerName = file.fileName.toLowerCase()

    if (lowerName.endsWith('.pdf')) {
      const parsed = await pdfParse(buffer)
      const extracted = (parsed.text || '').trim()
      if (extracted.length < 20) {
        return { text: '', error: file.fileName + ': 텍스트를 추출하지 못했습니다. (이미지로 저장된 PDF는 지원하지 않습니다)' }
      }
      return { text: extracted, error: '' }
    }

    if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer })
      const extracted = (result.value || '').trim()
      if (extracted.length < 20) {
        return { text: '', error: file.fileName + ': 텍스트를 추출하지 못했습니다.' }
      }
      return { text: extracted, error: '' }
    }

    return { text: '', error: file.fileName + ': 지원하지 않는 파일 형식입니다. (PDF, DOCX만 지원)' }

  } catch (e) {
    console.error('파일 파싱 실패 (' + file.fileName + '):', e)
    return { text: '', error: file.fileName + ': 파일을 읽는 중 오류가 발생했습니다.' }
  }
}

function safeText(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/\\/g, ' ')
    .replace(/\r/g, ' ')
    .trim()
}

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

    // 3. 정합성 검증 크레딧 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('consistency_credits, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 403 })
    }

    const isAdmin = profile.role === 'admin'
    if (!isAdmin && (profile.consistency_credits || 0) <= 0) {
      return NextResponse.json({ error: '잡통 플러스 크레딧이 없습니다. 5회권을 결제하시면 무료로 1회 지급됩니다.' }, { status: 403 })
    }

    // 4. 요청 데이터
    const body = await req.json()
    const company = body.company || ''
    const position = body.position || ''
    const companyVision = (body.companyVision || '').trim().slice(0, 1000)
    const jobPostingFile = body.jobPostingFile || null
    const coverLetterContent = (body.coverLetterContent || '').trim()
    const resumeFiles: UploadedFile[] = Array.isArray(body.resumeFiles) ? body.resumeFiles.slice(0, RESUME_FILE_MAX_COUNT) : []

    // 5. 입력 검증
    if (!coverLetterContent || coverLetterContent.length < 100) {
      return NextResponse.json({ error: '자소서를 100자 이상 입력해주세요.' }, { status: 400 })
    }
    if (coverLetterContent.length > COVERLETTER_MAX_LENGTH) {
      return NextResponse.json({ error: '자소서는 5,000자 이하로 입력해주세요.' }, { status: 400 })
    }
    if (resumeFiles.length === 0) {
      return NextResponse.json({ error: '이력서 또는 경력기술서 파일을 1개 이상 업로드해주세요.' }, { status: 400 })
    }

    const extractedParts: string[] = []
    const resumeFileErrors: string[] = []
    for (const file of resumeFiles) {
      const { text, error } = await extractTextFromFile(file)
      if (error) resumeFileErrors.push(error)
      if (text) extractedParts.push('[파일: ' + file.fileName + ']\n' + text)
    }

    if (extractedParts.length === 0) {
      return NextResponse.json({
        error: resumeFileErrors.length > 0 ? resumeFileErrors.join(' ') : '파일에서 텍스트를 추출하지 못했습니다.'
      }, { status: 400 })
    }

    const resumeText = extractedParts.join('\n\n').slice(0, RESUME_TOTAL_TEXT_MAX_LENGTH)
    const safeResume = safeText(resumeText)
    const safeCoverLetter = safeText(coverLetterContent)

    // 채용공고 PDF 처리 (선택 사항)
    let jobPostingText = ''
    let jobPostingError = ''
    if (jobPostingFile && jobPostingFile.base64) {
      try {
        const buffer = Buffer.from(jobPostingFile.base64, 'base64')
        if (buffer.length > JOB_POSTING_MAX_SIZE) {
          jobPostingError = '채용공고 파일이 5MB를 초과하여 분석에 반영되지 않았습니다.'
        } else {
          const parsed = await pdfParse(buffer)
          const extracted = (parsed.text || '').trim()
          if (extracted.length < 30) {
            jobPostingError = '채용공고 PDF에서 텍스트를 추출하지 못해 분석에 반영되지 않았습니다. (이미지로 저장된 PDF는 지원하지 않습니다)'
          } else {
            jobPostingText = extracted.slice(0, JOB_POSTING_MAX_TEXT_LENGTH)
          }
        }
      } catch (e) {
        console.error('채용공고 PDF 파싱 실패:', e)
        jobPostingError = '채용공고 PDF를 읽는 중 오류가 발생하여 분석에 반영되지 않았습니다.'
      }
    }

    const safeJobPosting = jobPostingText ? safeText(jobPostingText) : ''
    const safeCompanyVision = companyVision ? safeText(companyVision) : ''

    const companyLine = company ? '지원 회사: ' + company : '지원 회사: 명시되지 않음'
    const positionLine = position ? '지원 직무: ' + position : '지원 직무: 명시되지 않음'
    const jobPostingSection = safeJobPosting
      ? '\n채용공고 원문:\n' + safeJobPosting + '\n'
      : ''
    const visionSection = safeCompanyVision
      ? '\n회사의 비전·인재상:\n' + safeCompanyVision + '\n'
      : ''

    // 6. 프롬프트 구성
    const fullPrompt = '당신은 삼성전자, LG, 현대자동차, SK 등 국내 주요 대기업에서 10년 이상 서류 전형을 담당해온 인사 전문가입니다. ' +
      '채용담당자는 이력서와 자기소개서를 따로 읽지 않고, 한 지원자의 두 문서를 이어서 읽으며 "이 사람이 말하는 강점이 실제 경력에서도 증명되는가"를 판단합니다. ' +
      '두 문서가 서로 다른 이야기를 하고 있으면, 아무리 개별 문서가 잘 써졌어도 신뢰도가 떨어집니다.\n\n' +
      '당신의 목표는 이 지원자의 이력서(경력기술서)와 자기소개서가 하나의 일관된 지원자 스토리로 읽히는지 정밀하게 대조 진단하는 것입니다.\n\n' +
      '[분석 대상]\n' + companyLine + '\n' + positionLine + '\n\n' +
      '이력서/경력기술서 원문:\n' + safeResume + '\n\n' +
      '자기소개서 원문:\n' + safeCoverLetter + '\n' + jobPostingSection + visionSection + '\n' +
      '[분석 순서 - 반드시 이 순서로 사고하세요]\n' +
      '1단계: 자기소개서에서 지원자가 강조하는 핵심 경험·강점·역량을 모두 추출하세요\n' +
      '2단계: 이력서/경력기술서에서 실제 경력·성과 항목을 모두 추출하세요\n' +
      '3단계: 두 목록을 서로 대조하여, 자소서에서 언급됐지만 이력서에 구체적으로 뒷받침되지 않는 부분을 찾으세요\n' +
      '4단계: 반대로 이력서에는 있지만 자소서에서 전혀 활용되지 않은 강력한 경력이 있는지 찾으세요\n' +
      '5단계: 두 문서에서 일관되게 잘 연결되어 신뢰도를 높이는 부분도 함께 파악하세요\n' +
      '6단계: 종합하여 정합성 점수와 최종 개선 전략을 작성하세요\n\n' +
      '[출력 필드별 필수 지침]\n' +
      '- matchScore: 100점 만점. 두 문서가 하나의 지원자 스토리로 얼마나 일관되게 읽히는지의 점수 (80점 이상: 매우 일관됨 / 60-79점: 부분적 보완 필요 / 60점 미만: 서로 다른 지원자처럼 읽힘)\n' +
      '- summary: 4-5문장. 채용담당자가 두 문서를 이어 읽을 때 느낄 인상을 명확히 판단하는 문장을 반드시 포함\n' +
      '- strongAlignments: 두 문서에서 서로 일관되게 뒷받침되어 신뢰도를 높이는 부분 2-4개. 각각 "자소서의 A라는 주장이 이력서의 B 경력으로 실제 증명된다"는 식으로 구체적으로 서술\n' +
      '- gaps: 반드시 3개 이상. 우선순위 높은 순서로 배열. 각 항목:\n' +
      '  · category: 문제 유형을 한 단어로 (예: "경험 미반영", "강점 근거 부족")\n' +
      '  · missingIn: "이력서" 또는 "자소서" 중 보완이 필요한 문서\n' +
      '  · issue: 채용담당자가 두 문서를 이어 읽을 때 드는 실제 의문을 2-3문장으로. 자소서/이력서 원문에서 실제로 발췌한 표현을 포함할 것(지어내지 말 것)\n' +
      '  · suggestion: missingIn으로 지목한 문서에 구체적으로 무엇을 어떻게 추가·수정하면 정합성이 올라가는지 2-3문장으로. 막연한 조언 금지\n' +
      '- finalAdvice: 이 두 문서를 하나의 일관된 스토리로 만들기 위한 최우선 실행 전략 3-4문장. 가장 효과가 큰 수정 포인트부터 순서대로 제시\n\n' +
      '[면접 예상 질문 - 잡통 플러스]\n' +
      '이력서와 자기소개서(제공된 경우 채용공고 포함)를 종합해서, 이 지원자가 실제 면접에서 받을 가능성이 높은 질문 정확히 5개를 만드세요.\n' +
      '반드시 지켜야 할 규칙:\n' +
      '- "지원 동기가 무엇인가요", "장단점을 말해보세요", "왜 우리 회사인가요" 같이 어떤 지원자에게나 통용되는 뻔한 일반 질문은 절대 만들지 마세요. 이런 질문은 0점 처리됩니다\n' +
      '- 모든 질문은 반드시 이력서나 자기소개서에 실제로 적힌 특정 문장·경험·수치·경력 공백·직무 미스매치 등에서 파생되어야 합니다. 그 문서가 없었다면 나올 수 없는 질문이어야 합니다\n' +
      '- 채용공고가 제공된 경우, 공고의 요구 역량과 지원자 서류 사이의 간극에서도 질문을 뽑아내세요\n' +
      '- 각 질문마다 basis(이 질문이 왜 나오는지, 서류의 어느 부분 때문인지 1-2문장. 실제 원문 표현을 포함해 구체적으로)와 tip(답변할 때 무엇을 강조하면 좋은지 1-2문장)을 반드시 함께 제공하세요\n' +
      '- 5개 질문은 서로 다른 관점(경력 검증형, 직무 역량형, 공백·리스크 해명형, 성장 가능성형 등)을 골고루 다루도록 배분하세요\n\n' +
      '[1분 자기소개 스크립트 - 잡통 플러스]\n' +
      '이 지원자가 실제 면접장에서 1분(약 280~320자) 동안 말할 자기소개 스크립트를 작성하세요.\n' +
      '반드시 지켜야 할 규칙:\n' +
      '- 이력서·자기소개서에 실제로 있는 경험·성과·수치만 사용하세요. 지어내지 마세요\n' +
      '- 이 지원자만의 가장 강력한 차별화 포인트(다른 지원자와 겹치지 않는, 서류에 드러난 구체적 강점) 하나를 중심으로 구성하세요. 여러 강점을 나열하지 말고 하나에 집중하세요\n' +
      '- 채용공고가 제공된 경우, 그 회사·직무가 요구하는 역량과 이 강점을 명시적으로 연결하세요\n' +
      '- 회사의 비전·인재상이 제공된 경우, 그 가치와 이 지원자의 강점이 어떻게 맞닿는지 자연스럽게 녹여내세요\n' +
      '- 구어체로, 실제로 말하듯 자연스럽게 작성하세요. 문어체·격식체(~하였습니다 남발) 금지\n' +
      '- selfIntroBasis 필드에 왜 이 강점을 중심으로 구성했는지 1-2문장으로 설명하세요 (예: "이력서의 A 경력과 자소서의 B 서술이 겹치는 지점이라 가장 설득력이 높습니다")\n\n' +
      '[톤 가이드 - 반드시 지키세요]\n' +
      '- 비판의 대상은 언제나 문서 간의 연결이지, 지원자라는 사람이 아닙니다\n' +
      '- 냉정함은 평가를 흐리지 않는 정직함이지 사람을 깎아내리는 날카로움이 아닙니다\n' +
      '- 모든 지적 뒤에는 반드시 그래서 어떻게 고치면 되는지가 함께 제시되어야 합니다\n\n' +
      '[금지 사항]\n' +
      '- issue/strongAlignments/interviewQuestions/selfIntroScript에 문서에 없는 내용을 지어내지 마세요\n' +
      '- 근거 없이 좋게 포장하지 말고, 실제 정합성 문제는 냉정하게 전달하되, 지원자 개인을 비하하는 표현은 금지\n' +
      '- 면접 질문에 "자기소개를 해보세요", "지원 동기는", "마지막으로 하고 싶은 말" 같은 뻔한 질문 절대 금지\n' +
      '- 문자열 내 큰따옴표는 작은따옴표로 바꾸세요\n' +
      '- JSON 외 텍스트 절대 출력 금지\n\n' +
      '반드시 아래 JSON 형식으로만 응답하세요.\n' +
      '{"matchScore":숫자,"summary":"...","strongAlignments":["...","..."],"gaps":[{"category":"...","missingIn":"이력서 또는 자소서","issue":"...","suggestion":"..."}],"finalAdvice":"...","interviewQuestions":[{"question":"...","basis":"...","tip":"..."}],"selfIntroScript":"...","selfIntroBasis":"..."}'

    // 7. AI 분석
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 20000,
      messages: [{ role: 'user', content: fullPrompt }],
    })

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
      return NextResponse.json({ error: 'AI 응답 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    // 8. 크레딧 차감 + DB 저장 (관리자는 차감하지 않음)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (!isAdmin) {
      await adminSupabase
        .from('profiles')
        .update({ consistency_credits: Math.max((profile.consistency_credits || 0) - 1, 0) })
        .eq('id', user.id)
    }

    try {
      await adminSupabase.from('analyses').insert({
        user_id: user.id,
        company: company || null,
        position: position || null,
        content_length: safeResume.length + safeCoverLetter.length,
        total_score: analysisResult.matchScore,
        is_free_trial: false,
        analyze_type: 'consistency',
        doc_type: 'consistency',
        result_json: analysisResult,
      })
    } catch (e) {
      console.error('정합성 검증 저장 실패:', e)
    }

    if (resumeFileErrors.length > 0) {
      analysisResult.resumeFileWarning = resumeFileErrors.join(' ')
    }

    if (jobPostingError) {
      analysisResult.jobPostingWarning = jobPostingError
    }

    return NextResponse.json(analysisResult)

  } catch (error: any) {
    console.error('정합성 검증 오류:', error)
    return NextResponse.json(
      { error: error.message || '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
