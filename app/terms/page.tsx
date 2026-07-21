'use client'



export default function TermsPage() {
  const point = '#e6a800'
  const dark = '#0a0f1e'
  const darkCard = 'rgba(255,255,255,0.06)'
  const darkBorder = 'rgba(255,255,255,0.12)'
  const textMain = '#ffffff'
  const textSub = 'rgba(255,255,255,0.75)'
  const textMuted = 'rgba(255,255,255,0.45)'

  const sections = [
    {
      title: '제1조 (목적)',
      content: `이 약관은 바른어플리케이션(이하 "회사")이 운영하는 잡통(Jobtong) 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 서비스 이용조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.`,
    },
    {
      title: '제2조 (정의)',
      content: `이 약관에서 사용하는 용어의 정의는 다음과 같습니다.

1. "서비스"란 회사가 제공하는 AI 자소서 분석 서비스 및 이와 관련된 제반 서비스를 의미합니다.
2. "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
4. "크레딧"이란 서비스 이용을 위해 충전하거나 무료로 제공받은 포인트로, 1크레딧 = 1회 자소서 분석을 의미합니다.
5. "분석 결과"란 회원이 서비스를 이용하여 생성한 자소서 분석 리포트를 말합니다.`,
    },
    {
      title: '제3조 (약관의 효력 및 변경)',
      content: `① 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.

② 회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위 내에서 이 약관을 변경할 수 있습니다.

③ 회사가 약관을 변경할 경우에는 적용일자 및 변경 사유를 명시하여 현행 약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 공지합니다. 다만, 이용자에게 불리한 약관 변경의 경우에는 30일 전부터 공지합니다.

④ 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 이용계약을 해지할 수 있습니다.`,
    },
    {
      title: '제4조 (서비스의 내용)',
      content: `회사는 다음과 같은 서비스를 제공합니다.

1. 자소서 무료 분석: 회원 가입 후 1회 무료 분석 제공 (종합 점수, 전체 총평, 핵심 문제 공개)
2. 자소서 전체 분석: 크레딧 사용 시 전체 분석 결과 제공 (종합 분석, 문장 개선, 강점 & 조언)
3. 분석 이력 저장: 마이페이지에서 과거 분석 결과 재확인
4. PDF 저장: 분석 결과를 PDF로 저장
5. 기타 회사가 추가 개발하거나 제휴 계약을 통해 제공하는 서비스`,
    },
    {
      title: '제5조 (서비스 이용 요금)',
      content: `① 서비스의 기본 이용은 무료이며, 회원 가입 시 무료 크레딧 2건을 제공합니다.

② 추가 서비스 이용을 위해서는 크레딧을 구매해야 합니다. 요금 체계는 다음과 같습니다.
- 1회권: 2,900원 / 1건
- 5회권: 9,900원 / 5건 (1회당 1,980원, 32% 할인)

③ 크레딧은 만료일 없이 영구 사용 가능합니다.

④ 1회 자소서 분석 시 크레딧 1건이 차감됩니다.

⑤ 요금은 사전 공지 후 변경될 수 있습니다.`,
    },
    {
      title: '제6조 (청약철회 및 환불 정책)',
      content: `① 청약철회 (구매 취소)
전자상거래 등에서의 소비자보호에 관한 법률 제17조에 따라, 이용자는 크레딧 구매일로부터 7일 이내에 청약철회(구매 취소)를 요청할 수 있습니다. 단, 구매한 크레딧을 1회라도 사용한 경우에는 사용한 분량을 제외한 잔여 크레딧에 대해서만 환불이 가능합니다.

② 환불 사유
다음 각 호의 경우 환불을 요청할 수 있습니다.
1. 단순 변심: 구매일로부터 7일 이내, 미사용 크레딧에 한해 전액 환불
2. 부분 사용: 구매일로부터 7일 이내, 미사용 잔여 크레딧에 대해 비례 환불
3. 서비스 장애: 회사 귀책 사유로 인한 서비스 불가 시 미사용 크레딧 전액 환불 또는 크레딧 복구
4. 오결제: 이용자의 의도와 다르게 결제된 경우 전액 환불

③ 환불 제한 사유
다음 각 호의 경우 환불이 제한됩니다.
1. 구매일로부터 7일이 경과한 경우
2. 구매한 크레딧을 전부 사용한 경우
3. 이용약관 위반으로 서비스 이용이 제한된 경우
4. 부정한 방법으로 크레딧을 취득한 경우

④ 환불 신청 방법
환불을 원하시는 경우 아래 방법으로 신청하시기 바랍니다.
- 이메일: barunapplication@gmail.com
- 이메일 제목: [환불 요청] 가입 이메일 주소
- 본문 필수 기재 사항: 가입 이메일, 구매일, 구매 상품명, 환불 사유

⑤ 환불 처리 절차
1. 환불 신청 접수 (이메일 수신)
2. 신청 내용 확인 및 환불 가능 여부 검토 (1영업일 이내)
3. 환불 승인 후 결제 취소 처리
4. 환불 완료 안내 이메일 발송

⑥ 환불 소요 기간
- 신용카드: 환불 승인 후 3~5 영업일 이내 (카드사 정책에 따라 다를 수 있음)
- 간편결제(카카오페이, 토스페이 등): 환불 승인 후 1~3 영업일 이내
- 환불 요청 접수부터 처리 완료까지 최대 7 영업일이 소요될 수 있습니다.

⑦ 기타
환불과 관련하여 분쟁이 발생할 경우 한국소비자원(www.kca.go.kr) 또는 공정거래위원회(www.ftc.go.kr)에 도움을 요청하실 수 있습니다.`,
    },
    {
      title: '제7조 (이용자의 의무)',
      content: `① 이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다.

1. 타인의 정보를 도용하거나 허위 정보를 등록하는 행위
2. 회사가 게시한 정보를 변경하거나 허가받지 않은 방법으로 정보를 수집하는 행위
3. 서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위
4. 다른 이용자의 개인정보를 수집, 저장, 공개하는 행위
5. 서비스의 운영을 방해하거나 안정적 운영을 방해할 수 있는 정보를 전송하는 행위
6. 음란물, 혐오 콘텐츠, 불법 콘텐츠 생성에 서비스를 사용하는 행위
7. 타인의 저작권, 상표권 등 지적재산권을 침해하는 콘텐츠 생성 행위`,
    },
    {
      title: '제8조 (저작권)',
      content: `① 이용자가 서비스를 통해 생성한 콘텐츠의 저작권은 이용자에게 귀속됩니다.

② 이용자는 서비스를 통해 생성된 콘텐츠를 상업적·비상업적 목적으로 자유롭게 활용할 수 있습니다.

③ 회사는 서비스 개선, AI 모델 학습 등을 위해 이용자의 입력 데이터를 익명화하여 활용할 수 있습니다.

④ 회사가 제공하는 서비스의 디자인, 로고, 상표 등은 회사의 지적재산권으로 보호됩니다.`,
    },
    {
      title: '제9조 (서비스의 제한 및 중단)',
      content: `① 회사는 다음의 경우 서비스의 전부 또는 일부를 제한하거나 중단할 수 있습니다.

1. 서비스용 설비의 유지·보수 등 공사로 인한 부득이한 경우
2. 전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지했을 경우
3. 국가비상사태, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 서비스 이용에 지장이 있는 경우
4. 기타 중대한 사유로 인하여 회사가 서비스 제공을 지속하는 것이 부적당하다고 인정하는 경우

② 회사는 서비스 중단 시 사전에 공지합니다. 단, 불가피한 경우 사후에 공지할 수 있습니다.`,
    },
    {
      title: '제10조 (면책 조항)',
      content: `① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.

② 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.

③ AI 모델의 특성상 자소서 분석 결과에 오류가 포함될 수 있으며, 회사는 분석 결과의 정확성, 완전성, 합격 보장에 대해 보증하지 않습니다. 이용자는 분석 결과를 참고 자료로 활용하고 최종 판단은 본인이 해야 합니다.

④ 회사는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 서비스를 통해 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.`,
    },
    {
      title: '제11조 (분쟁 해결)',
      content: `① 회사와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법원에 제기합니다.

② 회사와 이용자 간에 제기된 소송에는 대한민국 법률이 적용됩니다.

③ 서비스 이용과 관련하여 분쟁이 발생한 경우 ${'barunapplication@gmail.com'}로 먼저 연락 주시면 성실히 협의하겠습니다.`,
    },
    {
      title: '제12조 (기타)',
      content: `① 이 약관에 명시되지 않은 사항은 관련 법령 및 회사가 정한 서비스 운영 정책에 따릅니다.

② 이 약관의 일부 조항이 법령에 의해 무효로 되더라도 나머지 조항의 효력에는 영향을 미치지 않습니다.

부칙
이 약관은 2026년 5월 18일부터 시행합니다.`,
    },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: dark, minHeight: '100vh', color: textMain }}>
      {/* 헤더 */}
      <header style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${darkBorder}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => window.location.href = '/'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: '#e6a800', borderRadius: '50%' }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>J</span>
          </div>
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
            이용약관
          </h1>
          <p style={{ fontSize: 14, color: textMuted }}>
            시행일: 2026년 5월 18일
          </p>
        </div>

        {/* 요약 박스 */}
        <div style={{ background: 'rgba(230,168,0,0.1)', border: '1px solid rgba(230,168,0,0.3)', borderRadius: 16, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ fontSize: 14, color: textSub, lineHeight: 1.8, wordBreak: 'keep-all' }}>
            <strong style={{ color: point }}>핵심 요약:</strong> 잡통은 한국 취준생을 위한 AI 자소서 분석 서비스입니다. 가입 시 무료 분석 1회를 드리며, 추가 이용은 크레딧 구매가 필요합니다. 분석 결과는 합격률 향상을 위한 참고 자료로 활용하시기 바랍니다.
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
          <p>문의: {'barunapplication@gmail.com'}</p>
          <p style={{ marginTop: 8 }}>바른어플리케이션 | 대표: 조신성 | 사업자등록번호: 896-03-03938</p>
          <p style={{ marginTop: 4 }}>Tel: 070-8064-1382 | 경기도 광명시 소하로 162</p>
          <p style={{ marginTop: 8 }}>{'https://jobtong.vercel.app'}</p>
        </div>
      </main>

      {/* 푸터 */}
      <footer style={{ background: '#050b14', padding: '28px 24px', borderTop: `1px solid ${darkBorder}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, fontSize: 13, color: textMuted }}>
            <button onClick={() => window.location.href = '/privacy'} style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>개인정보처리방침</button>
            <button onClick={() => window.location.href = '/terms'} style={{ background: 'none', border: 'none', color: point, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>이용약관</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '0 0 4px' }}>바른어플리케이션 | 대표: 조신성 | 사업자등록번호: 896-03-03938 | Tel: 070-8064-1382</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: '0 0 4px' }}>경기도 광명시 소하로 162</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>© 2026 바른어플리케이션. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
