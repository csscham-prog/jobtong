import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const RESUME_FILE_MAX_SIZE = 10 * 1024 * 1024
const RESUME_FILE_MAX_COUNT = 3
const RESUME_TOTAL_TEXT_MAX_LENGTH = 12000
const COVERLETTER_MAX_LENGTH = 5000
const JOB_POSTING_MAX_SIZE = 5 * 1024 * 1024
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('paid_credits, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 403 })
    }

    const isAdmin = profile.role === 'admin'
    if (!isAdmin && (profile.paid_credits || 0) <= 0) {
      return NextResponse.json({ error: '분석권이 없습니다. 크레딧을 충전해주세요.' }, { status: 403 })
    }

    const body = await req.json()
    const company = body.company || ''
    const position = body.position || ''
    const companyVision = (body.companyVision || '').trim().slice(0, 1000)
    const jobPostingFile = body.jobPostingFile || null
    const coverLetterContent = (body.coverLetterContent || '').trim()
    const resumeFiles: UploadedFile[] = Array.isArray(body.resumeFiles) ? body.resumeFiles.slice(0, RESUME_FILE_MAX_COUNT) : []

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
            jobPostingError = '채용공고 PDF에서 텍스트를 추출하지 못해 분석에 반영되지 않았습니다.'
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
    const jobPostingSection = safeJobPosting ? '\n채용공고 원문:\n' + safeJobPosting + '\n' : ''
    const visionSection = safeCompanyVision ? '\n회사의 비전·인재상:\n' + safeCompanyVision + '\n' : ''

    const questionPrompt = '당신은 대기업 실무 면접관입니다. 아래 지원자의 서류를 바탕으로 실제 면접에서 던질 질문 정확히 5개를 설계하세요.\n\n' +
      '[분석 대상]\n' + companyLine + '\n' + positionLine + '\n\n' +
      '이력서/경력기술서 원문:\n' + safeResume + '\n\n' +
      '자기소개서 원문:\n' + safeCoverLetter + '\n' + jobPostingSection + visionSection + '\n' +
      '[반드시 지켜야 할 규칙]\n' +
      '- "자기소개를 해보세요", "지원 동기가 무엇인가요", "장단점을 말해보세요", "마지막으로 하고 싶은 말" 같이 어떤 지원자에게나 통용되는 뻔한 일반 질문은 절대 만들지 마세요\n' +
      '- 모든 질문은 이 지원자의 이력서·자기소개서에 실제로 적힌 특정 문장·경험·수치·경력 공백·직무 미스매치에서 파생되어야 합니다. 그 문서가 없었다면 나올 수 없는 질문이어야 합니다\n' +
      '- 채용공고가 제공된 경우, 공고의 요구 역량과 지원자 서류 사이의 간극에서도 질문을 뽑아내세요\n' +
      '- 5개 질문은 서로 다른 관점(경력 검증형, 직무 역량형, 공백·리스크 해명형, 성장 가능성형, 상황 대처형 등)을 골고루 다루도록 배분하세요\n' +
      '- 각 질문마다 evaluationFocus(면접관이 이 질문으로 실제로 검증하려는 것이 무엇인지, 좋은 답변이 갖춰야 할 조건 2-3문장)를 함께 작성하세요. 이 필드는 나중에 답변을 채점할 때 기준으로 쓰입니다\n\n' +
      '문자열 내 큰따옴표는 작은따옴표로 바꾸세요. JSON 외 텍스트는 절대 출력하지 마세요.\n\n' +
      '반드시 아래 JSON 형식으로만 응답하세요.\n' +
      '{"questions":[{"question":"...","evaluationFocus":"..."},{"question":"...","evaluationFocus":"..."},{"question":"...","evaluationFocus":"..."},{"question":"...","evaluationFocus":"..."},{"question":"...","evaluationFocus":"..."}]}'

    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: questionPrompt }],
    })

    const textBlock = message.content?.find((b: any) => b.type === 'text')
    const responseText = textBlock?.text || ''

    let parsed: any = null
    try { parsed = JSON.parse(responseText.trim()) } catch (e) {}
    if (!parsed) {
      try {
        const m = responseText.match(/\{[\s\S]*\}/)
        if (m) parsed = JSON.parse(m[0])
      } catch (e) {}
    }
    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return NextResponse.json({ error: 'AI 응답 오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (!isAdmin) {
      await adminSupabase
        .from('profiles')
        .update({ paid_credits: Math.max((profile.paid_credits || 0) - 1, 0) })
        .eq('id', user.id)
    }

    const { data: session, error: insertError } = await adminSupabase
      .from('mock_interview_sessions')
      .insert({
        user_id: user.id,
        company: company || null,
        position: position || null,
        resume_text: safeResume,
        coverletter_text: safeCoverLetter,
        job_posting_text: safeJobPosting || null,
        questions: parsed.questions,
      })
      .select('id')
      .single()

    if (insertError || !session) {
      console.error('모의 면접 세션 저장 실패:', insertError)
      return NextResponse.json({ error: '세션 생성 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId: session.id,
      questions: parsed.questions.map((q: any) => q.question),
      resumeFileWarning: resumeFileErrors.length > 0 ? resumeFileErrors.join(' ') : undefined,
      jobPostingWarning: jobPostingError || undefined,
    })

  } catch (error: any) {
    console.error('모의 면접 질문 생성 오류:', error)
    return NextResponse.json({ error: error.message || '오류가 발생했습니다.' }, { status: 500 })
  }
}
