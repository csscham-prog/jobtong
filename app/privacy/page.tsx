'use client'

import { APP_CONFIG } from '@/lib/config'
import { Emblem } from '@/components/Emblem'

export default function PrivacyPage() {
  const { primary, point } = APP_CONFIG.colors
  const dark = '#0a0f1e'
  const darkCard = 'rgba(255,255,255,0.06)'
  const darkBorder = 'rgba(255,255,255,0.12)'
  const textMain = '#ffffff'
  const textSub = 'rgba(255,255,255,0.75)'
  const textMuted = 'rgba(255,255,255,0.45)'

  const sections = [
    {
      title: '제1조 (개인정보의 처리 목적)',
      content: `${APP_CONFIG.companyName}(이하 "회사")이 운영하는 ${APP_CONFIG.name}(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

1. 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 등
2. 서비스 제공: 자소서 분석 서비스 제공, 분석 결과 제공, 맞춤 피드백 제공
3. 고충처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보
4. 마케팅 및 광고: 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공`,
    },
    {
      title: '제2조 (처리하는 개인정보의 항목)',
      content: `회사는 다음의 개인정보 항목을 처리하고 있습니다.

1. 필수항목: 이메일 주소
2. 자동 수집 항목: 접속 IP 정보, 쿠키, 접속 로그, 서비스 이용 기록

서비스 이용 과정에서 아래 개인정보 항목이 자동으로 생성되어 수집될 수 있습니다.
- IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 불량 이용 기록`,
    },
    {
      title: '제3조 (개인정보의 처리 및 보유 기간)',
      content: `① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.

② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
- 회원 가입 정보: 회원 탈퇴 시까지 (단, 관계법령에 따라 보존 필요 시 해당 기간까지 보유)
- 결제 정보: 전자상거래법에 따라 5년 보관
- 서비스 이용 기록: 통신비밀보호법에 따라 3개월 보관`,
    },
    {
      title: '제4조 (개인정보의 제3자 제공)',
      content: `회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.

현재 회사는 개인정보를 제3자에게 제공하지 않습니다.
단, 결제 서비스 제공을 위해 토스페이먼츠에 최소한의 결제 정보를 제공할 수 있습니다.`,
    },
    {
      title: '제5조 (개인정보 처리 위탁)',
      content: `① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.

| 수탁업체 | 위탁업무 내용 |
|---|---|
| Supabase Inc. | 회원 데이터베이스 운영 및 관리 |
| Vercel Inc. | 서비스 호스팅 및 운영 |
| 토스페이먼츠 | 결제 처리 |

② 회사는 위탁계약 체결 시 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고 있습니다.`,
    },
    {
      title: '제6조 (정보주체의 권리·의무 및 행사방법)',
      content: `① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
1. 개인정보 열람 요구
2. 오류 등이 있을 경우 정정 요구
3. 삭제 요구
4. 처리정지 요구

② 권리 행사는 ${APP_CONFIG.contactEmail}로 이메일을 통해 요청하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.`,
    },
    {
      title: '제7조 (개인정보의 파기)',
      content: `① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.

② 파기의 절차 및 방법은 다음과 같습니다.
1. 파기절차: 불필요한 개인정보 및 개인정보 파일은 개인정보책임자의 책임하에 파기합니다.
2. 파기방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 기술적 방법을 사용하여 삭제합니다.`,
    },
    {
      title: '제8조 (개인정보의 안전성 확보조치)',
      content: `회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.

1. 개인정보 암호화: 이용자의 개인정보는 암호화되어 저장 및 관리되고 있습니다.
2. 해킹 등에 대비한 기술적 대책: 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 있습니다.
3. 개인정보 취급 직원의 최소화 및 교육: 개인정보를 취급하는 직원을 최소화하고 있습니다.`,
    },
    {
      title: '제9조 (쿠키의 설치·운영 및 거부)',
      content: `① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 쿠키(cookie)를 사용합니다.

② 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.

③ 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹 브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.`,
    },
    {
      title: '제10조 (개인정보 보호책임자)',
      content: `① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

- 개인정보 보호책임자: 바른어플리케이션 대표
- 연락처: ${APP_CONFIG.contactEmail}

② 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.`,
    },
    {
      title: '제11조 (개인정보 처리방침의 변경)',
      content: `이 개인정보처리방침은 2026년 5월 18일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.`,
    },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: dark, minHeight: '100vh', color: textMain }}>
      {/* 헤더 */}
      <header style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${darkBorder}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => window.location.href = '/'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Emblem size={34} />
          <span style={{ fontSize: 20, fontWeight: 900, color: textMain, letterSpacing: '-0.5px' }}>잡통</span>
        </button>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* 타이틀 */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(139,159,255,0.15)', border: '1px solid rgba(139,159,255,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#8b9fff', marginBottom: 16 }}>
            법적 고지
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: textMain, marginBottom: 12, letterSpacing: '-1px' }}>
            개인정보처리방침
          </h1>
          <p style={{ fontSize: 14, color: textMuted }}>
            시행일: 2026년 5월 18일
          </p>
        </div>

        {/* 요약 박스 */}
        <div style={{ background: `rgba(230,168,0,0.1)`, border: `1px solid rgba(230,168,0,0.3)`, borderRadius: 16, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ fontSize: 14, color: textSub, lineHeight: 1.8, wordBreak: 'keep-all' }}>
            <strong style={{ color: point }}>핵심 요약:</strong> 잡통은 서비스 제공을 위해 이메일 주소만 수집합니다. 수집된 정보는 제3자에게 제공되지 않으며, 회원 탈퇴 시 즉시 삭제됩니다. 결제 정보는 토스페이먼츠가 직접 처리하며 잡통은 저장하지 않습니다.
          </p>
        </div>

        {/* 섹션들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map((section, i) => (
            <div key={i} style={{ background: darkCard, border: `1px solid ${darkBorder}`, borderRadius: 16, padding: '24px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: textMain, marginBottom: 14 }}>
                {section.title}
              </h2>
              <div style={{ fontSize: 14, color: textSub, lineHeight: 1.9, whiteSpace: 'pre-line', wordBreak: 'keep-all' }}>
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 */}
        <div style={{ marginTop: 48, textAlign: 'center', color: textMuted, fontSize: 13 }}>
          <p>문의: {APP_CONFIG.contactEmail}</p>
          <p style={{ marginTop: 8 }}>{APP_CONFIG.companyName} · {APP_CONFIG.url}</p>
        </div>
      </main>

      {/* 푸터 */}
      <footer style={{ background: '#050b14', padding: '28px 24px', borderTop: `1px solid ${darkBorder}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: textMuted }}>
            <button onClick={() => window.location.href = '/privacy'} style={{ background: 'none', border: 'none', color: point, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>개인정보처리방침</button>
            <button onClick={() => window.location.href = '/terms'} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>이용약관</button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 {APP_CONFIG.companyName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
