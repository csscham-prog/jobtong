'use client'

import { useState } from 'react'

// ── 샘플 분석 결과 컴포넌트 ──────────────────────────────────
function SampleResult() {
  const [tab, setTab] = useState<'coverletter' | 'resume'>('coverletter')

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreLabel = (s: number) => s >= 80 ? '우수' : s >= 60 ? '보통' : '미흡'

  const coverLetterData = {
    company: 'IT 서비스 기업',
    position: '서비스 기획',
    totalScore: 61,
    summary: '전반적인 구성은 갖추어져 있으나, 지원 동기와 직무 역량 사이의 연결고리가 약해 면접관에게 "왜 이 기업이어야 하는가"에 대한 답을 주지 못하고 있습니다. 보유한 경험의 양은 충분하나 서비스 기획직이 요구하는 데이터 기반 사고와 사용자 중심 관점이 표면적으로만 언급되어 설득력이 떨어집니다. 문장 표현은 무난하지만 이 기업이 추구하는 "사용자 중심"과 "일상 속 편의"라는 가치와 본인의 경험이 유기적으로 연결되지 않아 차별화가 어렵습니다. 전체적인 완성도를 높이려면 경험을 재해석하고 이 기업의 맥락 위에 재배치하는 작업이 필요합니다.',
    mainIssue: '가장 큰 문제는 "나만의 차별점"이 보이지 않는다는 것입니다. "사용자 경험을 중시한다", "협업을 잘한다"는 표현은 지원자 대부분이 쓰는 문구로, 서비스 기획 포지션 지원자 수백 명 중에서 기억에 남기 어렵습니다. 본인이 실제로 지원 기업의 서비스를 분석하고, 문제를 발견하고, 개선안을 만들어본 경험이 있다면 그것이 가장 강력한 차별점이 될 수 있습니다.',
    scores: { logic: 62, specific: 48, fit: 71, expression: 66 },
    scoreItems: [
      { label: '논리성', key: 'logic', desc: '주장과 근거의 연결', icon: '🔗' },
      { label: '구체성', key: 'specific', desc: '수치·사례의 활용도', icon: '📌' },
      { label: '직무 적합성', key: 'fit', desc: '직무 역량 부합도', icon: '🎯' },
      { label: '표현력', key: 'expression', desc: '문장 품질·가독성', icon: '✍️' },
    ],
    improvements: [
      {
        category: '지원 동기',
        issue: '지원 동기가 "이 기업의 서비스를 자주 사용한다"는 수준에 머물고 있습니다. 면접관 입장에서는 단순 사용자와 기획자 지망생을 구분할 수 없어 설득력이 없습니다.',
        original: '귀사의 다양한 서비스를 이용하며 더 나은 사용자 경험을 만들고 싶다는 꿈을 키워왔습니다.',
        suggestion: '이 기업의 특정 서비스(예: 지도 앱의 길찾기 UI, 간편결제 서비스의 송금 플로우)에서 직접 불편함을 느끼고 개선안을 구체적으로 고민한 경험을 서술하세요. "사용자로서 느낀 불편 → 기획자 시각으로 분석 → 개선 아이디어 도출" 구조로 바꾸면 즉시 차별화됩니다.',
        addContent: '메신저 앱 오픈채팅 기능의 스팸 문제를 직접 분석하고 필터링 UX 개선안을 정리한 경험, 또는 지도 앱 간 UX 비교 분석 사례가 있다면 강력한 소재가 됩니다.',
      },
      {
        category: '구체성 부족',
        issue: '프로젝트 경험을 서술할 때 수치와 결과가 빠져있어 성과를 객관적으로 판단할 수 없습니다. 기획 직군은 특히 데이터 기반 사고를 중요시하기 때문에 수치 없는 경험 서술은 큰 감점 요인입니다.',
        original: '팀 프로젝트에서 기획 파트를 맡아 서비스를 성공적으로 출시하였고 좋은 평가를 받았습니다.',
        suggestion: '"OO 앱 기획 팀 프로젝트에서 PM 역할을 맡아 8주 만에 MVP를 출시, 사용자 100명 대상 베타테스트에서 만족도 4.2/5.0을 기록했습니다"처럼 기간·규모·결과를 모두 수치로 표현하세요.',
        addContent: 'DAU, 리텐션율, 전환율 등 서비스 기획 지표를 직접 추적하고 분석한 경험이 있다면 최우선으로 기재하세요.',
      },
      {
        category: '차별화 요소',
        issue: '"성실하다", "꼼꼼하다", "소통을 잘한다"는 표현이 반복적으로 등장하는데, 이는 지원자 대부분이 공통적으로 쓰는 표현입니다. 이런 진부한 표현은 오히려 역효과를 낼 수 있습니다.',
        original: '저는 성실하고 꼼꼼한 성격으로, 팀원들과의 소통을 중요시합니다.',
        suggestion: '성격 형용사 대신 그 성격이 드러난 구체적인 에피소드로 대체하세요. "마감 3일 전 치명적인 UX 오류를 발견하고 팀을 설득해 스펙을 변경한 경험"이 "꼼꼼하다"보다 훨씬 강렬한 메시지를 전달합니다.',
        addContent: 'IT 서비스 기업 면접에서 자주 나오는 "당신이 기획한 서비스의 실패 경험과 그로부터 배운 점"에 대한 답을 미리 녹여두면 면접에서도 유리합니다.',
      },
      {
        category: '입사 후 포부',
        issue: '입사 후 포부가 지나치게 추상적이고 선언적입니다. "최고의 기획자가 되겠다"는 표현은 면접관이 가장 많이 보는 클리셰 중 하나로, 읽는 순간 인상이 흐려집니다.',
        original: '입사 후에는 귀사의 발전에 기여하는 최고의 서비스 기획자가 되겠습니다.',
        suggestion: '"입사 첫 해에는 결제 서비스 사용성 개선 TF에 참여해 결제 완료율을 5% 이상 개선하는 것을 첫 목표로 삼겠습니다"처럼 구체적인 직무·지표·시간축으로 포부를 서술하세요.',
        addContent: '이 기업의 최근 신규 서비스나 투자 방향(AI, 헬스케어, 금융 등)과 연결해 본인의 성장 방향을 제시하면 시장 이해도와 주체성을 동시에 보여줄 수 있습니다.',
      },
      {
        category: '직무 연결성',
        issue: '보유한 경험들이 서비스 기획 직무와 어떻게 연결되는지 명시적으로 서술되지 않아, 면접관이 연결고리를 스스로 추론해야 하는 부담이 생깁니다. 자소서는 면접관의 해석에 의존해서는 안 됩니다.',
        original: '다양한 동아리 활동과 대외활동을 통해 협업 능력과 커뮤니케이션 스킬을 키웠습니다.',
        suggestion: '"UX 스터디에서 6개월간 매주 앱 서비스를 분석하며 사용자 여정 지도 작성 역량을 키웠고, 이 경험이 귀사 서비스의 사용자 경험 개선 업무에 직접 활용될 것이라 확신합니다"처럼 경험과 직무를 명시적으로 연결하세요.',
        addContent: '기업 공식 블로그나 개발자 컨퍼런스 내용을 인용해 이 기업의 기획 방향성을 이해하고 있다는 것을 보여주면 인상적입니다.',
      },
      {
        category: '논리 구조',
        issue: '각 문단이 독립적으로 구성되어 있어 자소서 전체의 스토리가 하나의 흐름으로 읽히지 않습니다. 면접관은 수백 개의 자소서를 읽기 때문에, 처음부터 끝까지 하나의 메시지로 관통되는 서사가 없으면 기억에 남기 어렵습니다.',
        original: '저는 항상 사용자의 입장에서 생각하려고 노력합니다. 또한 데이터를 중요시하며 의사결정을 합니다.',
        suggestion: '"사용자의 불편 → 데이터로 검증 → 해결책 기획 → 실행 및 검증"이라는 일관된 프레임을 자소서 전체에 적용하세요. 지원 동기부터 경험 사례, 입사 후 포부까지 이 흐름 위에서 서술하면 면접관이 "이 사람은 기획자처럼 생각한다"는 인상을 받게 됩니다.',
        addContent: 'IT 서비스 기업에서 실제로 활용하는 의사결정 방식(A/B테스트, 데이터 기반 UX 개선 등)을 언급하면 직무 이해도가 높다는 인상을 줄 수 있습니다.',
      },
    ],
    aiPatternCheck: [
      { patternType: '클리셰 표현', original: '저는 성실하고 꼼꼼한 성격으로, 팀원들과의 소통을 중요시합니다.', suggestion: '성격을 나열하지 말고, 그 성격이 드러난 구체적인 에피소드 하나로 대체하세요.' },
      { patternType: 'AI 서식 남용', original: '해당 없음', suggestion: '해당 없음' },
      { patternType: '정형화된 문단 구조', original: '해당 없음', suggestion: '해당 없음' },
      { patternType: '균일한 문장 리듬', original: '해당 없음', suggestion: '해당 없음' },
      { patternType: '추상적 서술', original: '다양한 경험을 통해 성장하며 사용자 중심 사고를 키워왔습니다.', suggestion: '어떤 경험에서, 무엇을, 어떻게 배웠는지 하나의 구체적 사례로 좁혀서 서술하세요.' },
      { patternType: '부자연스러운 어휘 선택', original: '해당 없음', suggestion: '해당 없음' },
    ],
    typoCheck: [
      { original: '더나은 사용자 경험을', corrected: '더 나은 사용자 경험을' },
      { original: '성공적으로 마쳤됬습니다', corrected: '성공적으로 마쳤습니다' },
      { original: '기여하는최고의 서비스', corrected: '기여하는 최고의 서비스' },
    ],
    strongPoints: [
      '지원 기업의 서비스에 대한 실제 사용 경험이 풍부하고, 서비스 기획 직무에 대한 기본적인 이해도가 확인됩니다.',
      '팀 프로젝트에서 기획 파트를 맡아 결과물을 도출한 실전 경험이 있습니다. 기획을 이론이 아닌 실제로 해본 경험이 있다는 것은 면접관이 신뢰를 가질 수 있는 중요한 근거입니다.',
      '문장 표현이 전반적으로 안정적이고 논리적 비약 없이 읽힙니다. 경험과 수치를 보완하면 완성도가 빠르게 올라갈 수 있는 구조입니다.',
    ],
    finalAdvice: '이 자소서는 "좋은 재료는 있지만 요리가 덜 된" 상태입니다. 경험 자체의 부족이 아니라, 경험을 지원 기업의 맥락에 맞게 재해석하지 않은 것이 가장 큰 문제입니다. 해당 기업 채용 페이지의 직무 기술서를 다시 읽고, 요구 역량 키워드를 각 문단에 명시적으로 대응시키세요. 모든 경험에 "얼마나, 몇 명, 몇 %"를 붙이는 작업을 먼저 완료하고, 자소서를 소리 내어 읽어보세요. 막히는 부분이 면접관도 똑같이 느끼는 지점입니다.',
  }

  const resumeData = {
    company: '무신사',
    position: '콘텐츠 마케터 (신입)',
    totalScore: 57,
    summary: '이력서 최상단에 직무와 무관한 아르바이트 경력이 먼저 배치되어 있어, 채용담당자가 6초 안에 "이 지원자가 콘텐츠 마케팅 역량이 있는지"를 파악하기 어렵습니다. 서포터즈·인턴 경험 자체는 관련성이 높지만 정성적 서술에 그쳐 있고, 팔로워 수·조회수·참여율 같은 수치가 전혀 없어 성과의 크기를 가늠할 수 없습니다. 툴 활용 능력도 "가능" 수준으로만 나열되어 실제 결과물과 연결되지 않습니다. 배치 순서와 성과 수치만 보완해도 통과 가능성이 크게 올라가는 상태입니다.',
    mainIssue: '가장 시급한 문제는 채용담당자가 관심 있는 "콘텐츠 마케팅 관련 경험"이 이력서 하단에 묻혀 있다는 것입니다. 상단에는 직무와 무관한 아르바이트 이력만 보이기 때문에, 채용담당자가 이력서를 끝까지 읽지 않고 다음 지원자로 넘어갈 위험이 큽니다.',
    scores: { structure: 52, achievement: 41, relevance: 66, completeness: 71 },
    scoreItems: [
      { label: '구조·가독성', key: 'structure', desc: '핵심 정보 파악 용이성', icon: '🗂️' },
      { label: '성과 정량화', key: 'achievement', desc: '수치·근거의 설득력', icon: '📈' },
      { label: '직무 연관성', key: 'relevance', desc: '지원 직무와의 연결성', icon: '🎯' },
      { label: '완결성', key: 'completeness', desc: '형식·정보의 완성도', icon: '✅' },
    ],
    improvements: [
      {
        category: '직무 포지셔닝',
        issue: '이력서 상단에 "이디야커피 아르바이트" 경력이 먼저 노출되고, 정작 콘텐츠 마케팅과 직결되는 SNS 서포터즈 경험은 중반부에 등장합니다. 채용담당자는 상단만 보고 무관한 지원자로 판단할 수 있습니다.',
        original: '이디야커피 홍대점 아르바이트 (2023.03 - 2023.08)',
        suggestion: '이력서 최상단에 "경력 요약" 섹션을 별도로 만들어, SNS 서포터즈·콘텐츠 제작 경험을 2줄로 먼저 요약해 배치하세요. 아르바이트 경력은 하단으로 내려도 무방합니다.',
        addContent: '서포터즈 활동 기간, 담당 채널(인스타그램/유튜브 등), 팔로워 규모를 요약 문장에 포함하면 즉시 직무 적합성이 드러납니다.',
      },
      {
        category: '성과 정량화 부족',
        issue: '"인스타그램 콘텐츠 기획 및 운영 보조"라는 서술은 실제로 무엇을 얼마나 해냈는지 알 수 없습니다. 마케팅 직군은 특히 수치 기반 성과를 중요하게 평가합니다.',
        original: '무신사 서포터즈 활동 중 인스타그램 콘텐츠 기획 및 운영 보조',
        suggestion: '"팔로워 3,200명 → 5,100명 성장(3개월), 평균 인게이지먼트율 4.8%, 단일 게시물 최대 도달 12만 회"처럼 구체적 수치로 성과를 증명하세요. 정확한 수치가 없다면 추정치라도 범위로 제시하는 것이 낫습니다.',
        addContent: '캠페인 전후 팔로워·좋아요·저장 수 변화, 콘텐츠 유형별 반응률 비교 데이터가 있다면 최우선으로 기재하세요.',
      },
      {
        category: '툴 활용 구체성',
        issue: '"포토샵, 프리미어프로 사용 가능"이라는 한 줄로만 처리되어 있어, 실제로 어떤 콘텐츠를 몇 편이나 제작했는지 확인할 수 없습니다.',
        original: '포토샵, 프리미어프로 사용 가능',
        suggestion: '"프리미어프로로 릴스 콘텐츠 24편 제작, 평균 조회수 8만 회"처럼 툴과 결과물을 함께 서술하세요. 툴 이름만 나열하는 것보다 훨씬 설득력이 높아집니다.',
        addContent: '실제 제작한 콘텐츠 링크나 포트폴리오가 있다면 이력서 상단에 QR코드나 링크로 안내하는 것도 좋은 방법입니다.',
      },
      {
        category: '직무 연관성',
        issue: '"다양한 동아리 활동을 통해 협업 능력을 길렀다"는 서술은 마케팅 직무와의 연결고리가 약합니다. 어떤 동아리에서 무슨 역할을 했는지가 빠져 있습니다.',
        original: '대학 재학 중 다양한 동아리 활동을 통해 협업 능력과 기획력을 길렀습니다.',
        suggestion: '동아리 활동 중 콘텐츠·홍보·기획과 관련된 역할만 선별해서 서술하세요. "학과 축제 홍보 콘텐츠 총괄, 인스타그램 스토리 조회수 전년 대비 40% 증가"처럼 직무와 직접 연결되는 경험 위주로 재구성하세요.',
        addContent: '동아리·학회에서 SNS 계정을 운영했거나 포스터·카드뉴스를 제작한 경험이 있다면 반드시 포함하세요.',
      },
      {
        category: '자격증 배치 순서',
        issue: '자격증이 취득 순서가 아니라 뒤섞여 나열되어 있고, 마케팅 직무와 무관한 오래된 자격증(컴퓨터활용능력 2급, 2021년 취득)이 최상단에 배치되어 있습니다. 채용담당자는 최신·직무 관련 자격증을 먼저 확인하고 싶어 합니다.',
        original: '컴퓨터활용능력 2급(2021), SNS광고마케터 1급(2024), GTQ 2급(2023)',
        suggestion: '최신순으로 재정렬하고, 마케팅 직무와 직결되는 "SNS광고마케터 1급"을 맨 위로 올리세요. 오래된 범용 자격증은 하단으로 내리거나 생략을 고려하세요.',
        addContent: '구글 애널리틱스(GA4), 네이버 광고 관련 자격증이 있다면 SNS광고마케터 자격증 바로 아래 추가하면 데이터 활용 역량까지 어필할 수 있습니다.',
      },
      {
        category: '자기 PR 부재',
        issue: '이력서에 지원자를 한눈에 요약해주는 소개 문구가 전혀 없어, 채용담당자가 여러 항목을 다 읽어야만 지원자의 특징을 파악할 수 있습니다. 상단에 짧은 한 줄 소개가 있으면 인상이 훨씬 명확해집니다.',
        original: '(자기 PR 문구 없음, 바로 학력 사항으로 시작)',
        suggestion: '이력서 최상단, 이름 아래에 "3,200명 → 5,100명 팔로워 성장을 이끈 콘텐츠 기획 경험을 가진 마케터 지망생"처럼 핵심 성과를 담은 1줄 소개를 추가하세요.',
        addContent: '가장 자신 있는 수치 성과 하나를 골라 한 문장으로 압축하면, 이력서 전체를 다 읽지 않아도 강점이 전달됩니다.',
      },
    ],
    aiPatternCheck: [
      { patternType: '클리셰 표현', original: '책임감을 가지고 맡은 업무에 최선을 다했습니다.', suggestion: '"책임감"이라는 단어 대신, 마감을 지키기 위해 실제로 취한 행동 하나를 구체적으로 서술하세요.' },
      { patternType: 'AI 서식 남용', original: '해당 없음', suggestion: '해당 없음' },
      { patternType: '정형화된 문단 구조', original: '해당 없음', suggestion: '해당 없음' },
      { patternType: '균일한 문장 리듬', original: '해당 없음', suggestion: '해당 없음' },
      { patternType: '추상적 서술', original: '다양한 콘텐츠를 기획하며 많은 것을 배웠습니다.', suggestion: '어떤 콘텐츠를 몇 편, 어떤 반응을 얻었는지로 구체화하세요. "많이 배웠다"는 채용담당자에게 정보를 주지 못합니다.' },
      { patternType: '부자연스러운 어휘 선택', original: '해당 없음', suggestion: '해당 없음' },
    ],
    typoCheck: [
      { original: '운영보조 하였습니다', corrected: '운영 보조를 하였습니다' },
      { original: '사용가능', corrected: '사용 가능' },
    ],
    strongPoints: [
      '무신사 서포터즈라는, 지원 회사와 직접 관련된 실제 활동 경험이 있습니다. 관심을 서류로 증명했다는 점에서 채용담당자에게 좋은 인상을 줄 수 있는 소재입니다.',
      '포토샵·프리미어프로 등 콘텐츠 제작에 필요한 툴을 다뤄본 경험이 있어, 실무 투입까지의 학습 곡선이 짧을 것으로 기대할 수 있습니다.',
      '자격증·학력 등 기본 정보가 빠짐없이 기재되어 있어 완결성 측면에서는 큰 결함이 없습니다.',
    ],
    finalAdvice: '이 이력서는 "관련 경험은 있는데 배치와 수치가 안 된" 전형적인 케이스입니다. 가장 먼저 이력서 최상단에 콘텐츠 마케팅 관련 경험 2~3줄 요약을 배치하고, 아르바이트 경력은 하단으로 내리세요. 그다음 서포터즈·인턴 경험의 모든 서술에 팔로워 수·조회수·참여율 같은 수치를 채워 넣으세요. 수치가 정확하지 않다면 "약 OO명 → OO명"처럼 범위로라도 제시하는 것이 아예 없는 것보다 훨씬 낫습니다. 마지막으로 클리셰 표현 한 줄을 실제 에피소드로 바꾸면, 지금 57점 수준의 이력서를 80점대 서류 통과권으로 끌어올릴 수 있습니다.',
  }

  const data = tab === 'coverletter' ? coverLetterData : resumeData
  const isResume = tab === 'resume'
  const totalScore = data.totalScore
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (totalScore / 100) * circumference

  return (
    <div style={{ fontFamily: "'Pretendard', -apple-system, sans-serif" }}>

      {/* 탭 스위처 */}
      <div style={{ display: 'flex', gap: 8, padding: '20px 24px 0' }}>
        {[
          { key: 'coverletter' as const, label: '✏️ 자기소개서' },
          { key: 'resume' as const, label: '📋 이력서·경력기술서' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px', borderRadius: '12px 12px 0 0', border: 'none',
              background: tab === t.key ? '#0f2244' : 'transparent',
              color: tab === t.key ? '#fff' : '#aaa',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', padding: '32px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* 원형 게이지 */}
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e6a800" strokeWidth="7"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{totalScore}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>/ 100</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ background: '#e6a800', color: '#fff', fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>PREMIUM REPORT</span>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 10, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>SAMPLE</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{data.company} · {data.position}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>샘플 분석 · 잡통 {isResume ? '서류' : '자소서'} 검토</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 36px 32px', background: '#fff' }}>

        {/* ── 종합 분석 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f2244', margin: 0 }}>종합 분석</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 총평 */}
          <div style={{ background: '#f7f6f3', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', marginBottom: 12 }}>📝 전체 총평</h3>
            <p style={{ fontSize: 14, color: '#333', lineHeight: 1.9 }}>{data.summary}</p>
          </div>

          {/* 핵심 문제 */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '24px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 12 }}>⚠️ 핵심 문제</h3>
            <p style={{ fontSize: 14, color: '#333', lineHeight: 1.9 }}>{data.mainIssue}</p>
          </div>

          {/* 역량 진단 */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>📊 역량 진단</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {data.scoreItems.map(item => {
                const score = (data.scores as any)[item.key]
                return (
                  <div key={item.key} style={{ background: getScoreBg(score), borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{item.icon} {item.label}</span>
                      <span style={{ background: getScoreColor(score), color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{getScoreLabel(score)}</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: getScoreColor(score) }}>{score}</div>
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2, marginTop: 8 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: getScoreColor(score), borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{item.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── 문장 개선 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
          <span style={{ fontSize: 16 }}>✏️</span>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f2244', margin: 0 }}>{isResume ? '구체적 개선 제안' : '문장 개선'}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 13, color: '#888', margin: '0 0 4px' }}>총 {data.improvements.length}개 개선 제안</p>
          {data.improvements.map((imp, i) => (
            <div key={i} style={{ border: '1.5px solid #ece9e1', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: '#0f2244', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: '#e6a800', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{imp.category}</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#e6a800', marginBottom: 6, letterSpacing: '0.05em' }}>ISSUE</div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>{imp.issue}</p>
                </div>
                <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>BEFORE</div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, fontStyle: 'italic' }}>"{imp.original}"</p>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', marginBottom: 6 }}>SUGGESTION</div>
                  <p style={{ fontSize: 13, color: '#333', lineHeight: 1.8 }}>{imp.suggestion}</p>
                </div>
                <div style={{ background: '#fffbeb', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>💡 추가하면 합격률이 올라가는 소재</div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>{imp.addContent}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI 작성 흔적 검증 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
          <span style={{ fontSize: 16 }}>🕵️</span>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f2244', margin: 0 }}>AI 작성 흔적 검증</h2>
        </div>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px', lineHeight: 1.7 }}>
          요즘 기업 AI 서류 심사는 AI가 대신 써준 것 같은 지원서를 반려시키는 경향이 있습니다. 6가지 패턴을 기준으로 서류에서 사람다움이 부족한 부분을 점검했습니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.aiPatternCheck.map((p, i) => {
            const isDetected = p.original !== '해당 없음'
            return (
              <div key={i} style={{ background: isDetected ? '#fef2f2' : '#f7f6f3', border: isDetected ? '1px solid #fecaca' : '1px solid #ece9e1', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isDetected ? 10 : 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isDetected ? '#991b1b' : '#888' }}>{p.patternType}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: isDetected ? '#fecaca' : '#e8e5dc', color: isDetected ? '#7f1d1d' : '#999' }}>
                    {isDetected ? '감지됨' : '해당 없음'}
                  </span>
                </div>
                {isDetected && (
                  <>
                    <div style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.7, marginBottom: 8, fontStyle: 'italic' }}>"{p.original}"</div>
                    <div style={{ fontSize: 13, color: '#065f46', lineHeight: 1.7, background: '#ecfdf5', borderRadius: 8, padding: '8px 12px' }}>{p.suggestion}</div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* ── 오탈자·맞춤법 체크 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
          <span style={{ fontSize: 16 }}>🔤</span>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f2244', margin: 0 }}>오탈자·맞춤법 체크</h2>
        </div>
        {data.typoCheck.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f7f6f3', borderRadius: 14, padding: '16px 18px' }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <p style={{ fontSize: 14, color: '#065f46', fontWeight: 600, margin: 0 }}>오탈자·맞춤법 오류가 발견되지 않았습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.typoCheck.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 13, color: '#991b1b', textDecoration: 'line-through', fontStyle: 'italic' }}>{t.original}</span>
                <span style={{ fontSize: 13, color: '#aaa' }}>→</span>
                <span style={{ fontSize: 13, color: '#065f46', fontWeight: 700 }}>{t.corrected}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── 강점 & 조언 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 16, paddingBottom: 10, borderBottom: '2px solid #0f2244' }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f2244', margin: 0 }}>강점 & 조언</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>✅ 잘 된 점</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.strongPoints.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, background: '#f0fdf4', borderRadius: 12, padding: '16px' }}>
                  <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>0{i + 1}</span>
                  <p style={{ fontSize: 14, color: '#333', lineHeight: 1.8, margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 16, padding: '28px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#e6a800', marginBottom: 16 }}>🎯 최종 합격 전략</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.9 }}>{data.finalAdvice}</p>
          </div>
        </div>

      </div>

      {/* 샘플 워터마크 */}
      <div style={{ background: '#f7f6f3', padding: '16px 36px', textAlign: 'center', borderTop: '1px solid #ece9e1' }}>
        <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
          🔒 이 결과는 샘플입니다. 내 {isResume ? '서류' : '자소서'}를 분석하면 나만을 위한 맞춤 리포트를 받을 수 있습니다.
        </p>
      </div>
    </div>
  )
}

export default function SamplePage() {
  return (
    <main style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#0f2244', minHeight: '100vh' }}>

      {/* 간단 헤더 */}
      <header style={{ height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, background: '#e6a800', borderRadius: '50%' }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>J</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>잡통</span>
        </button>
      </header>

      <section style={{ padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* 타이틀 */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-block', background: 'rgba(230,168,0,0.15)', border: '1px solid rgba(230,168,0,0.4)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#e6a800', marginBottom: 16, letterSpacing: '0.05em' }}>
              SAMPLE REPORT
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>실제 분석 결과물을 미리 확인해보세요</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              잡통이 실제로 어떤 수준의 피드백을 드리는지 샘플로 먼저 확인해보세요.
            </p>
          </div>

          {/* 샘플 분석 카드 */}
          <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <SampleResult />
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>
              위 결과는 샘플입니다. 내 자소서로 직접 분석받아보세요.
            </p>
            <button
              onClick={() => window.location.href = '/?start=analyze'}
              style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 52px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(230,168,0,0.4)' }}
            >
              내 서류로 직접 분석받기 →
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
