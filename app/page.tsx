'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PaidResult from '@/components/PaidResult'


// ── 샘플 분석 결과 컴포넌트 ──────────────────────────────────
function SampleResult() {
  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'guide'>('overview')

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTxt = (s: number) => s >= 80 ? '#065f46' : s >= 60 ? '#92400e' : '#991b1b'
  const getScoreLabel = (s: number) => s >= 80 ? '우수' : s >= 60 ? '보통' : '미흡'

  const totalScore = 61
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference - (totalScore / 100) * circumference

  const sampleData = {
    company: '카카오',
    position: '서비스 기획',
    summary: '전반적인 구성은 갖추어져 있으나, 지원 동기와 직무 역량 사이의 연결고리가 약해 면접관에게 "왜 카카오여야 하는가"에 대한 답을 주지 못하고 있습니다. 보유한 경험의 양은 충분하나 서비스 기획직이 요구하는 데이터 기반 사고와 사용자 중심 관점이 표면적으로만 언급되어 설득력이 떨어집니다. 문장 표현은 무난하지만 카카오가 추구하는 "연결"과 "일상의 혁신"이라는 가치와 본인의 경험이 유기적으로 연결되지 않아 차별화가 어렵습니다. 전체적인 완성도를 높이려면 경험을 재해석하고 카카오의 맥락 위에 재배치하는 작업이 필요합니다.',
    mainIssue: '가장 큰 문제는 "나만의 차별점"이 보이지 않는다는 것입니다. "사용자 경험을 중시한다", "협업을 잘한다"는 표현은 지원자 대부분이 쓰는 문구로, 카카오 서비스 기획 포지션 지원자 수백 명 중에서 기억에 남기 어렵습니다. 본인이 실제로 카카오 서비스를 분석하고, 문제를 발견하고, 개선안을 만들어본 경험이 있다면 그것이 가장 강력한 차별점이 될 수 있습니다.',
    scores: { logic: 62, specific: 48, fit: 71, expression: 66 },
    improvements: [
      {
        category: '지원 동기',
        issue: '지원 동기가 "카카오 서비스를 자주 사용한다"는 수준에 머물고 있습니다. 면접관 입장에서는 단순 사용자와 기획자 지망생을 구분할 수 없어 설득력이 없습니다. 왜 카카오의 기획자가 되어야 하는지, 다른 회사가 아닌 카카오인 이유가 명확하지 않습니다.',
        original: '카카오의 다양한 서비스를 이용하며 더 나은 사용자 경험을 만들고 싶다는 꿈을 키워왔습니다.',
        suggestion: '카카오의 특정 서비스(예: 카카오맵 길찾기 UI, 카카오페이 송금 플로우)에서 직접 불편함을 느끼고 개선안을 구체적으로 고민한 경험을 서술하세요. "사용자로서 느낀 불편 → 기획자 시각으로 분석 → 개선 아이디어 도출" 구조로 바꾸면 즉시 차별화됩니다.',
        addContent: '카카오톡 오픈채팅 기능의 스팸 문제를 직접 분석하고 필터링 UX 개선안을 정리한 경험, 또는 카카오맵 vs 네이버지도 UX 비교 분석 사례가 있다면 강력한 소재가 됩니다.',
      },
      {
        category: '구체성 부족',
        issue: '프로젝트 경험을 서술할 때 수치와 결과가 빠져있어 성과를 객관적으로 판단할 수 없습니다. "성공적으로 마쳤다", "좋은 평가를 받았다"는 표현은 면접관에게 아무런 정보를 주지 못합니다. 기획 직군은 특히 데이터 기반 사고를 중요시하기 때문에 수치 없는 경험 서술은 큰 감점 요인입니다.',
        original: '팀 프로젝트에서 기획 파트를 맡아 서비스를 성공적으로 출시하였고 좋은 평가를 받았습니다.',
        suggestion: '"OO 앱 기획 팀 프로젝트에서 PM 역할을 맡아 8주 만에 MVP를 출시, 사용자 100명 대상 베타테스트에서 만족도 4.2/5.0을 기록했습니다"처럼 기간·규모·결과를 모두 수치로 표현하세요. 수치가 작아도 괜찮습니다. 중요한 건 측정 가능성입니다.',
        addContent: 'DAU, 리텐션율, 전환율 등 서비스 기획 지표를 직접 추적하고 분석한 경험이 있다면 최우선으로 기재하세요.',
      },
      {
        category: '직무 연결성',
        issue: '보유한 경험들이 카카오 서비스 기획 직무와 어떻게 연결되는지 명시적으로 서술되지 않아, 면접관이 연결고리를 스스로 추론해야 하는 부담이 생깁니다. 자소서는 면접관의 해석에 의존해서는 안 됩니다.',
        original: '다양한 동아리 활동과 대외활동을 통해 협업 능력과 커뮤니케이션 스킬을 키웠습니다.',
        suggestion: '"UX 스터디에서 6개월간 매주 앱 서비스를 분석하며 사용자 여정 지도 작성 역량을 키웠고, 이 경험이 카카오 서비스의 사용자 경험 개선 업무에 직접 활용될 것이라 확신합니다"처럼 경험과 직무를 명시적으로 연결하세요.',
        addContent: '카카오 공식 블로그나 if(kakao) 개발자 컨퍼런스 내용을 인용해 카카오의 기획 방향성을 이해하고 있다는 것을 보여주면 인상적입니다.',
      },
      {
        category: '논리 구조',
        issue: '각 문단이 독립적으로 구성되어 있어 자소서 전체의 스토리가 하나의 흐름으로 읽히지 않습니다. 면접관은 수백 개의 자소서를 읽기 때문에, 처음부터 끝까지 하나의 메시지로 관통되는 서사가 없으면 기억에 남기 어렵습니다.',
        original: '저는 항상 사용자의 입장에서 생각하려고 노력합니다. 또한 데이터를 중요시하며 의사결정을 합니다.',
        suggestion: '"사용자의 불편 → 데이터로 검증 → 해결책 기획 → 실행 및 검증"이라는 일관된 프레임을 자소서 전체에 적용하세요. 지원 동기부터 경험 사례, 입사 후 포부까지 이 흐름 위에서 서술하면 면접관이 "이 사람은 기획자처럼 생각한다"는 인상을 받게 됩니다.',
        addContent: '카카오가 실제로 사용하는 의사결정 방식(A/B테스트, 데이터 기반 UX 개선 등)을 언급하면 직무 이해도가 높다는 인상을 줄 수 있습니다.',
      },
      {
        category: '차별화 요소',
        issue: '"성실하다", "꼼꼼하다", "소통을 잘한다"는 표현이 반복적으로 등장하는데, 이는 카카오 서비스 기획 포지션에 지원하는 지원자 대부분이 공통적으로 쓰는 표현입니다. 이런 진부한 표현은 오히려 역효과를 낼 수 있습니다.',
        original: '저는 성실하고 꼼꼼한 성격으로, 팀원들과의 소통을 중요시합니다.',
        suggestion: '성격 형용사 대신 그 성격이 드러난 구체적인 에피소드로 대체하세요. "마감 3일 전 치명적인 UX 오류를 발견하고 팀을 설득해 스펙을 변경한 경험"이 "꼼꼼하다"보다 100배 강렬한 메시지를 전달합니다.',
        addContent: '카카오 면접에서 실제로 물어보는 "당신이 기획한 서비스의 실패 경험과 그로부터 배운 점"에 대한 답을 자소서에 미리 녹여두면 면접에서도 유리합니다.',
      },
      {
        category: '입사 후 포부',
        issue: '입사 후 포부가 지나치게 추상적이고 선언적입니다. "최고의 기획자가 되겠다", "회사 발전에 기여하겠다"는 표현은 면접관이 가장 많이 보는 클리셰 중 하나로, 읽는 순간 인상이 흐려집니다.',
        original: '입사 후에는 카카오의 발전에 기여하는 최고의 서비스 기획자가 되겠습니다.',
        suggestion: '"입사 첫 해에는 카카오페이 사용성 개선 TF에 참여해 결제 완료율을 5% 이상 개선하는 것을 첫 목표로 삼겠습니다. 3년 내에는 신규 서비스 기획 PM으로 성장해 MAU 100만 서비스를 직접 기획하고 싶습니다"처럼 구체적인 직무·지표·시간축으로 포부를 서술하세요.',
        addContent: '카카오의 최근 신규 서비스나 투자 방향(AI, 헬스케어, 금융 등)과 연결해 본인의 성장 방향을 제시하면 시장 이해도와 주체성을 동시에 보여줄 수 있습니다.',
      },
    ],
    strongPoints: [
      '카카오 서비스에 대한 실제 사용 경험이 풍부하고, 서비스 기획 직무에 대한 기본적인 이해도가 확인됩니다. 막연한 동경이 아닌 직무 자체에 관심을 가지고 있다는 점은 긍정적입니다.',
      '팀 프로젝트에서 기획 파트를 맡아 결과물을 도출한 실전 경험이 있습니다. 기획을 단순히 이론으로만 아는 것이 아니라 실제로 해본 경험이 있다는 것은 면접관이 신뢰를 가질 수 있는 중요한 근거입니다.',
      '문장 표현이 전반적으로 안정적이고 논리적 비약 없이 읽힙니다. 기본 문서 작성 능력이 갖춰져 있어, 경험과 수치를 보완하면 완성도가 빠르게 올라갈 수 있는 구조입니다.',
    ],
    finalAdvice: '이 자소서는 "좋은 재료는 있지만 요리가 덜 된" 상태입니다. 경험 자체의 부족이 아니라, 경험을 카카오 맥락에 맞게 재해석하지 않은 것이 가장 큰 문제입니다. 지금 당장 할 수 있는 가장 효과적인 작업은 카카오 공식 채용 페이지에서 서비스 기획 직무 기술서를 다시 읽고, 요구 역량 키워드(데이터 기반 사고, 사용자 중심 설계, 크로스펑셔널 협업 등)를 각 문단에 명시적으로 대응시키는 것입니다. 수치 없는 경험은 절반의 가치만 인정받는다는 점을 항상 기억하고, 모든 경험에 "얼마나, 몇 명, 몇 %"를 붙이는 작업을 먼저 완료하세요. 마지막으로 자소서를 소리 내어 읽어보세요. 막히거나 어색한 부분이 면접관도 똑같이 느끼는 지점입니다.',
  }

  const scoreItems = [
    { label: '논리성', key: 'logic' as const, desc: '주장과 근거의 연결', icon: '🔗' },
    { label: '구체성', key: 'specific' as const, desc: '수치·사례의 활용도', icon: '📌' },
    { label: '직무 적합성', key: 'fit' as const, desc: '직무 역량 부합도', icon: '🎯' },
    { label: '표현력', key: 'expression' as const, desc: '문장 품질·가독성', icon: '✍️' },
  ]

  return (
    <div style={{ fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', padding: '32px 36px', borderRadius: '24px 24px 0 0' }}>
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
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>카카오 · 서비스 기획</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>샘플 분석 · 잡통 자소서 검토</div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 안내 문구 */}
      <div style={{ background: '#fffbeb', borderTop: '1px solid #fde68a', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          💡 아래 탭을 클릭하면 문장 개선 제안과 강점 & 조언을 확인할 수 있어요!
        </span>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f0ede6', background: '#faf9f7', padding: '0 8px', gap: 4 }}>
        {[
          { key: 'overview', label: '📊 종합 분석' },
          { key: 'detail', label: '✏️ 문장 개선' },
          { key: 'guide', label: '💡 강점 & 조언' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '14px 8px', border: 'none',
              borderBottom: `3px solid ${activeTab === tab.key ? '#0f2244' : 'transparent'}`,
              background: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#0f2244' : '#999',
              fontWeight: activeTab === tab.key ? 900 : 500,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s', borderRadius: '8px 8px 0 0',
              boxShadow: activeTab === tab.key ? '0 -2px 8px rgba(0,0,0,0.06)' : 'none',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '32px 36px', background: '#fff' }}>

        {/* 종합 분석 탭 */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 총평 */}
            <div style={{ background: '#f7f6f3', borderRadius: 16, padding: '24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', marginBottom: 12 }}>📝 전체 총평</h3>
              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.9 }}>{sampleData.summary}</p>
            </div>

            {/* 핵심 문제 */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 12 }}>⚠️ 핵심 문제</h3>
              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.9 }}>{sampleData.mainIssue}</p>
            </div>

            {/* 역량 진단 */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>📊 역량 진단</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {scoreItems.map(item => {
                  const score = sampleData.scores[item.key]
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
        )}

        {/* 문장 개선 탭 */}
        {activeTab === 'detail' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 4px' }}>총 {sampleData.improvements.length}개 문장 개선 제안</p>
            {sampleData.improvements.map((imp, i) => (
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
        )}

        {/* 강점 & 조언 탭 */}
        {activeTab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', marginBottom: 16 }}>✅ 잘 된 점</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sampleData.strongPoints.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, background: '#f0fdf4', borderRadius: 12, padding: '16px' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>0{i + 1}</span>
                    <p style={{ fontSize: 14, color: '#333', lineHeight: 1.8, margin: 0 }}>{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 16, padding: '28px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#e6a800', marginBottom: 16 }}>🎯 최종 합격 전략</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.9 }}>{sampleData.finalAdvice}</p>
            </div>
          </div>
        )}
      </div>

      {/* 샘플 워터마크 */}
      <div style={{ background: '#f7f6f3', padding: '16px 36px', borderRadius: '0 0 24px 24px', textAlign: 'center', borderTop: '1px solid #ece9e1' }}>
        <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
          🔒 이 결과는 샘플입니다. 내 자소서를 분석하면 나만을 위한 맞춤 리포트를 받을 수 있습니다.
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const [step, setStep] = useState<'landing' | 'analyze' | 'result'>('landing')
  const [analyzeType, setAnalyzeType] = useState<'free' | 'paid'>('free')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false)
  const [showPromoSlide, setShowPromoSlide] = useState(false)
  const [promoClosed, setPromoClosed] = useState(false)

  // 앱 목록 — 새 앱 추가 시 여기에만 추가하면 됩니다
  const APP_LIST = [
    {
      id: 'jobtong',
      name: '잡통',
      emoji: '💼',
      tag: '자소서 검토',
      desc: '합격을 위한 정직한 조언',
      url: 'https://jobtong.vercel.app',
      color: '#e6a800',
      current: true,
    },
    {
      id: 'geultong',
      name: '글통',
      emoji: '✍️',
      tag: 'SNS 변환',
      desc: 'SNS 콘텐츠 자동 변환 서비스',
      url: 'https://geultong.vercel.app',
      color: '#8b9fff',
      current: false,
    },
    {
      id: 'jiptong',
      name: '집통',
      emoji: '🏠',
      tag: '부동산 전략',
      desc: '부동산 전략 서비스',
      url: 'https://jiptong.vercel.app',
      color: '#3b82f6',
      current: false,
    },
  ]

  useEffect(() => {
    // 점검 모드 체크 (어드민은 제외)
    supabase.from('settings').select('value').eq('key', 'maintenance_mode').single()
      .then(({ data }) => { if (data?.value === 'true') setMaintenance(true) })

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const keepLogin = localStorage.getItem('jobtong-keep-login') === 'true'
      const sessionOnly = sessionStorage.getItem('jobtong-session-only') === 'true'
      if (session?.user && !keepLogin && !sessionOnly) {
        await supabase.auth.signOut()
        setUser(null); setAuthLoading(false); return
      }
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setUserProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setUserProfile(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setUserProfile(null); setStep('landing')
  }

  const handleStartAnalyze = () => {
    if (!user) { window.location.href = '/login'; return }
    setStep('analyze')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.txt')) { setError('TXT 파일만 업로드 가능합니다.'); return }
    setFileName(file.name); setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (text) {
        if (text.trim().length > 5000) {
          setError('파일 내용이 5,000자를 초과합니다. 분석할 내용을 5,000자 이내로 줄여주세요.')
          return
        }
        setContent(text)
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  // 어떤 분석 타입인지 계산
  const getAnalyzeMode = (): 'login' | 'paid' | 'both' | 'free' | 'purchase' => {
    if (!user) return 'login'
    if ((userProfile?.paid_credits || 0) > 0) return 'paid'
    if (!userProfile?.free_trial_used) return 'both'
    return 'purchase'
  }

  const handleAnalyze = async (type: 'free' | 'paid') => {
    if (!content.trim()) { setError('자소서 내용을 입력해주세요.'); return }
    if (content.trim().length < 100) { setError('자소서를 100자 이상 입력해주세요.'); return }
    if (content.trim().length > 5000) { setError('자소서는 5,000자 이하로 입력해주세요.'); return }
    setError(''); setLoading(true); setAnalyzeType(type)
    try {
      // 로그인 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ company, position, content, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      setResult(data)
      setStep('result')
      // 분석 결과 확인 후 3초 뒤 홍보 슬라이드인 배너 표시
      const closed = localStorage.getItem('jobtong-promo-closed')
      if (!closed || Date.now() > parseInt(closed)) {
        setTimeout(() => setShowPromoSlide(true), 3000)
      }

      // 크레딧 차감
      if (type === 'paid' && userProfile) {
        await supabase.from('profiles').update({
          paid_credits: (userProfile.paid_credits || 0) - 1,
          total_analyses: (userProfile.total_analyses || 0) + 1,
          free_trial_used: true,
        }).eq('id', user.id)
        fetchProfile(user.id)
      } else if (type === 'free' && userProfile) {
        await supabase.from('profiles').update({
          free_trial_used: true,
          total_analyses: (userProfile.total_analyses || 0) + 1,
        }).eq('id', user.id)
        fetchProfile(user.id)
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  // 점검 모드 화면 — 어드민은 통과
  if (maintenance && userProfile?.role !== 'admin') {
    return (
      <main style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#0f2244', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🔧</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.5px' }}>서버 점검 중입니다</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 8 }}>
            더 나은 서비스를 위해 잠시 점검 중입니다.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            불편을 드려 죄송합니다. 곧 다시 서비스됩니다.
          </p>
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1a3a6b 0%, #0f2244 100%)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#e6a800', borderRadius: '50%' }} />
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>J</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>잡통</span>
          </div>
        </div>
      </main>
    )
  }

  const getScoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const getScoreLabel = (s: number) => s >= 80 ? '우수' : s >= 60 ? '보통' : '미흡'
  const getScoreBg = (s: number) => s >= 80 ? '#ecfdf5' : s >= 60 ? '#fffbeb' : '#fef2f2'
  const getScoreTxt = (s: number) => s >= 80 ? '#065f46' : s >= 60 ? '#92400e' : '#991b1b'

  const Emblem = ({ size = 36 }: { size?: number }) => (
    <div style={{ width: size, height: size, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: size * 0.25, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: size * 0.08, right: size * 0.08, width: size * 0.22, height: size * 0.22, background: '#e6a800', borderRadius: '50%' }} />
      <span style={{ fontSize: size * 0.46, fontWeight: 900, color: '#fff', fontFamily: "'Pretendard', sans-serif" }}>J</span>
    </div>
  )

  const Logo = ({ dark = false }: { dark?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, whiteSpace: 'nowrap' }}>
      <Emblem size={36} />
      <span style={{ fontSize: 20, fontWeight: 800, color: dark ? '#fff' : '#0f2244', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>잡통</span>
    </div>
  )

  const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
  const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
  const headerInner: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }

  const Header = () => (
    <header style={headerStyle}>
      <div style={headerInner}>
        {/* 로고 + 앱 스위처 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' }}>
          <button onClick={() => setStep('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Logo /></button>

          {/* 앱 스위처 버튼 */}
          <button
            onClick={() => setAppSwitcherOpen(prev => !prev)}
            style={{ background: 'none', border: '1px solid #e5e3dc', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#999', fontSize: 15, flexShrink: 0 }}
            title="다른 서비스 보기"
          >
            ⊞
          </button>

          {/* 드롭다운 바깥 클릭 닫기 레이어 */}
          {appSwitcherOpen && (
            <div
              onClick={() => setAppSwitcherOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 150 }}
            />
          )}

          {/* 앱 스위처 드롭다운 */}
          {appSwitcherOpen && (
            <div style={{ position: 'absolute', top: 44, left: 0, zIndex: 151, background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #ece9e1', padding: '10px', minWidth: 260 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', padding: '4px 8px 8px', margin: 0 }}>BARUN APPLICATION</p>
              {APP_LIST.map(app => (
                <button
                  key={app.id}
                  onClick={() => { if (!app.current) window.open(app.url, '_blank'); setAppSwitcherOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 10, border: app.current ? `1.5px solid ${app.color}` : '1.5px solid transparent', background: app.current ? `${app.color}12` : 'transparent', cursor: app.current ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 4 }}
                >
                  <span style={{ fontSize: 22 }}>{app.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f2244' }}>{app.name}</span>
                      {app.current && (
                        <span style={{ background: app.color, color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>현재</span>
                      )}
                      <span style={{ background: '#f0ede6', color: '#888', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{app.tag}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>{app.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="jobtong-slogan" style={{ fontWeight: 800, margin: 0, letterSpacing: '-0.5px', lineHeight: 1.3, textAlign: 'center' }}>
            <span style={{ color: '#0f2244' }}>합격을 위한 정직한 조언,&nbsp;</span>
            <span style={{ color: '#e6a800' }}>잡통의 바른 자소서 검토</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                {(userProfile?.paid_credits || 0) > 0 ? `잔여 ${userProfile.paid_credits}회` : !userProfile?.free_trial_used ? '무료 1회 남음' : ''}
              </span>
              <button onClick={handleStartAnalyze} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>분석 시작</button>
              <button onClick={() => window.location.href = '/mypage'} style={{ background: 'none', color: '#0f2244', border: '1px solid #0f2244', borderRadius: 10, padding: '10px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>내 기록</button>
              <button onClick={handleLogout} className="mobile-hide" style={{ background: 'none', color: '#aaa', border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>로그아웃</button>
            </>
          ) : (
            <>
              <button onClick={() => window.location.href = '/login'} style={{ background: 'none', color: '#0f2244', border: '1.5px solid #0f2244', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>로그인</button>
              <button onClick={handleStartAnalyze} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>무료 체험</button>
            </>
          )}
        </div>
      </div>
    </header>
  )

  // ── LANDING ──
  if (step === 'landing') {
    return (
      <main style={base}>
        <Header />
        <section style={{ background: 'linear-gradient(160deg, #0a1628 0%, #1a3a6b 60%, #152f58 100%)', color: '#fff', padding: '80px 24px 90px', position: 'relative' }}>

          {/* 장식 레이어 — div 기반 눈금자 + 돋보기 */}

          {/* 눈금자 상단 가로선 */}
          <div style={{ position: 'absolute', top: 28, left: '12%', right: '12%', height: '1px', background: 'rgba(184,217,238,0.28)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.4)' }} />
            <div style={{ position: 'absolute', right: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.4)' }} />
            <div style={{ position: 'absolute', left: '16%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '33%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '50%', top: '-5px', width: '1px', height: '11px', background: 'rgba(184,217,238,0.35)' }} />
            <div style={{ position: 'absolute', left: '66%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '83%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.28)' }} />
          </div>

          {/* 눈금자 하단 가로선 */}
          <div style={{ position: 'absolute', bottom: 44, left: '16%', right: '16%', height: '1px', background: 'rgba(184,217,238,0.22)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', right: 0, top: '-6px', width: '2px', height: '14px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', left: '25%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.22)' }} />
            <div style={{ position: 'absolute', left: '50%', top: '-5px', width: '1px', height: '11px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', left: '75%', top: '-4px', width: '1px', height: '9px', background: 'rgba(184,217,238,0.22)' }} />
          </div>

          {/* 눈금자 좌측 세로선 */}
          <div style={{ position: 'absolute', left: '4%', top: '14%', bottom: '14%', width: '1px', background: 'rgba(184,217,238,0.22)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', top: '33%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '-5px', width: '11px', height: '1px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', top: '66%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
          </div>

          {/* 눈금자 우측 세로선 */}
          <div style={{ position: 'absolute', right: '4%', top: '14%', bottom: '14%', width: '1px', background: 'rgba(184,217,238,0.22)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '-6px', width: '14px', height: '2px', background: 'rgba(184,217,238,0.32)' }} />
            <div style={{ position: 'absolute', top: '33%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '-5px', width: '11px', height: '1px', background: 'rgba(184,217,238,0.28)' }} />
            <div style={{ position: 'absolute', top: '66%', left: '-4px', width: '9px', height: '1px', background: 'rgba(184,217,238,0.22)' }} />
          </div>

          {/* 돋보기 좌상단 */}
          <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 44, left: '7%', width: 80, height: 80, opacity: 0.24, pointerEvents: 'none' }} viewBox="0 0 80 80" fill="none">
            <circle cx="32" cy="32" r="22" stroke="#b8d9ee" strokeWidth="3.5" fill="none"/>
            <line x1="48" y1="48" x2="70" y2="70" stroke="#b8d9ee" strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="21" y1="32" x2="43" y2="32" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
            <line x1="32" y1="21" x2="32" y2="43" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* 돋보기 우상단 */}
          <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 36, right: '7%', width: 66, height: 66, opacity: 0.2, pointerEvents: 'none', transform: 'scaleX(-1)' }} viewBox="0 0 80 80" fill="none">
            <circle cx="32" cy="32" r="22" stroke="#b8d9ee" strokeWidth="3.5" fill="none"/>
            <line x1="48" y1="48" x2="70" y2="70" stroke="#b8d9ee" strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="21" y1="32" x2="43" y2="32" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
            <line x1="32" y1="21" x2="32" y2="43" stroke="#b8d9ee" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* 메인 카피 */}
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <h1 className="hero-title" style={{ fontWeight: 900, lineHeight: 1.25, marginBottom: 28, letterSpacing: '-1.5px' }}>
              당신의 이야기를<br />
              <span style={{ color: '#f0c040' }}>더 특별하게.</span><br />
              잡통의 정밀 자소서 검토.
            </h1>
            <p style={{ fontSize: 19, color: '#b8d9ee', lineHeight: 1.85, marginBottom: 44 }}>
              전문가의 눈으로 문장을 다듬고,<br />합격을 위한 정직한 솔루션을 드립니다.
            </p>
            <button onClick={handleStartAnalyze} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '20px 52px', fontWeight: 800, fontSize: 20, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(230,168,0,0.3)', position: 'relative', zIndex: 1 }}>
              {!user ? '무료로 분석 시작하기 →' :
               (userProfile?.paid_credits || 0) > 0 ? '전체 분석 시작하기 →' :
               !userProfile?.free_trial_used ? '무료 분석 시작하기 →' :
               '분석 시작하기 →'}
            </button>
          </div>
        </section>

        <section style={{ background: '#fff', padding: '72px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#0f2244', marginBottom: 8, letterSpacing: '-0.5px' }}>단순한 교정을 넘어, 합격의 확신을 드리는 '마지막 한 문장'까지</h2>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 52 }}>"어떻게 써야 할지" 고민하는 시간을 "어떻게 합격할지" 확신하는 시간으로 바꿔드립니다.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                { icon: '🔍', title: '가감 없는 냉철한 분석', desc: '좋은 말만 나열하는 위로보다, 합격에 꼭 필요한 정직한 조언을 우선합니다. 면접관의 시선에서 당신의 자소서가 가진 약점을 숨김없이 짚어내어, 합격 가능성을 객관적으로 높여드립니다.' },
                { icon: '✏️', title: '스토리를 완성하는 문장 교정', desc: '모호한 표현은 선명하게, 평범한 경험은 특별하게 다듬습니다. 단순히 오타를 잡는 수준을 넘어, 당신의 진심이 인사담당자에게 바르게 전달되도록 문장 단위로 세밀하게 손봅니다.' },
                { icon: '✓', title: '전략적인 직무 타겟팅', desc: '모든 회사에 통하는 범용 자소서는 없습니다. 지원하시는 산업군과 포지션에서 요구하는 핵심 역량을 정확히 꿰뚫어, 당신의 커리어가 해당 직무의 정답처럼 보이도록 전략을 설계합니다.' },
              ].map(item => (
                <div key={item.title} style={{ background: '#f7f6f3', borderRadius: 16, padding: '36px 32px', border: '1px solid #e8e5dc' }}>
                  <div style={{ fontSize: 40, marginBottom: 20 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f2244', marginBottom: 14 }}>{item.title}</h3>
                  <p style={{ fontSize: 15, color: '#444', lineHeight: 1.85 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── 샘플 분석 결과 섹션 ── */}
        <section style={{ background: '#0f2244', padding: '80px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            {/* 타이틀 */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-block', background: 'rgba(230,168,0,0.15)', border: '1px solid rgba(230,168,0,0.4)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#e6a800', marginBottom: 16, letterSpacing: '0.05em' }}>
                SAMPLE REPORT
              </div>
              <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>실제 분석 결과물을 미리 확인해보세요</h2>
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
                onClick={handleStartAnalyze}
                style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 52px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 24px rgba(230,168,0,0.4)' }}
              >
                내 자소서 분석받기 →
              </button>
            </div>
          </div>
        </section>

        <section style={{ background: '#f7f6f3', padding: '72px 24px' }}>
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, color: '#0f2244', marginBottom: 8, letterSpacing: '-0.5px' }}>무료 체험 vs 전체 분석</h2>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 16, marginBottom: 52 }}>전문 컨설턴트의 1/50 가격으로 정밀 피드백을</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #e8e5dc' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 12, letterSpacing: 1 }}>무료 체험</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#0f2244', marginBottom: 4 }}>₩0</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f0ede6' }}>지금 바로 체험</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[{ t: '종합 점수', ok: true }, { t: '전체 총평', ok: true }, { t: '핵심 문제 1가지', ok: true }, { t: '항목별 세부 점수', ok: false }, { t: '문장 단위 개선 제안', ok: false }, { t: '"이런 내용 추가하세요" 제안', ok: false }, { t: '잘 된 점 피드백', ok: false }, { t: '최종 종합 조언', ok: false }].map(item => (
                    <li key={item.t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: item.ok ? '#222' : '#bbb' }}>
                      <span style={{ fontWeight: 800, color: item.ok ? '#10b981' : '#ddd', fontSize: 16, flexShrink: 0 }}>{item.ok ? '✓' : '✗'}</span>{item.t}
                    </li>
                  ))}
                </ul>
                <button onClick={handleStartAnalyze} style={{ marginTop: 28, width: '100%', background: '#f7f6f3', color: '#0f2244', border: '1.5px solid #ddd', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기</button>
              </div>
              <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #e8e5dc' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', marginBottom: 12, letterSpacing: 1 }}>1회 분석권</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#0f2244', marginBottom: 4 }}>₩2,900</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f0ede6' }}>1회 전체 분석</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['종합 점수', '전체 총평', '핵심 문제 1가지', '항목별 세부 점수', '문장 단위 개선 제안', '"이런 내용 추가하세요" 제안', '잘 된 점 피드백', '최종 종합 조언'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#222' }}><span style={{ fontWeight: 800, color: '#10b981', fontSize: 16, flexShrink: 0 }}>✓</span>{item}</li>
                  ))}
                </ul>
                <button onClick={() => window.location.href = '/payment?plan=plan_1'} style={{ marginTop: 28, width: '100%', background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>1회권 구매하기</button>
              </div>
              <div style={{ background: '#0f2244', borderRadius: 20, padding: '36px 32px', border: '1.5px solid #0f2244', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#e6a800', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 18px', borderRadius: 20, whiteSpace: 'nowrap' }}>⭐ 추천</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: 1 }}>5회 분석권</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 4 }}>₩9,900</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>1회당 ₩1,980 · 32% 할인</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['종합 점수', '전체 총평', '핵심 문제 1가지', '항목별 세부 점수', '문장 단위 개선 제안', '"이런 내용 추가하세요" 제안', '잘 된 점 피드백', '최종 종합 조언'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}><span style={{ fontWeight: 800, color: '#f0c040', fontSize: 16, flexShrink: 0 }}>✓</span>{item}</li>
                  ))}
                </ul>
                <button onClick={() => window.location.href = '/payment?plan=plan_5'} style={{ marginTop: 28, width: '100%', background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>5회권 구매하기</button>
              </div>
            </div>
          </div>
        </section>

        <section style={{ background: '#0f2244', padding: '72px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.5px' }}>
            {!user || !userProfile?.free_trial_used ? '지금 바로 무료로 체험해보세요' : '자소서 분석을 시작해보세요'}
          </h2>
          <p style={{ color: '#b8d9ee', fontSize: 16, marginBottom: 36, lineHeight: 1.8 }}>
            {!user || !userProfile?.free_trial_used ? '첫 분석은 무료입니다. 총평과 핵심 문제점을 바로 확인하세요.' : '합격을 위한 정직한 피드백을 바로 확인하세요.'}
          </p>
          <button onClick={handleStartAnalyze} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px 44px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>
            {!user ? '무료로 분석 시작하기 →' :
             (userProfile?.paid_credits || 0) > 0 ? '전체 분석 시작하기 →' :
             !userProfile?.free_trial_used ? '무료 분석 시작하기 →' :
             '분석 시작하기 →'}
          </button>
        </section>

        <style>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  .jobtong-slogan { font-size: 28px; white-space: nowrap; }
  .hero-title { font-size: clamp(38px, 6vw, 64px); }
  @media (max-width: 768px) {
    .jobtong-slogan { display: none; }
    .hero-title { font-size: 28px; }
    .promo-grid { grid-template-columns: 1fr !important; }
    .promo-card { padding: 28px 20px !important; }
    .promo-title { font-size: 22px !important; }
  }
`}</style>
        {/* 홍보 이벤트 인라인 섹션 */}
        <section style={{ background: '#f7f6f3', padding: '64px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>

            {/* 타이틀 */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'inline-block', background: 'rgba(230,168,0,0.15)', border: '1px solid rgba(230,168,0,0.4)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, color: '#b8860b', marginBottom: 16, letterSpacing: '0.05em' }}>
                🎁 홍보 이벤트 · 상시 운영
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f2244', marginBottom: 12, letterSpacing: '-0.5px', lineHeight: 1.35 }} className="promo-title">
                잡통이 도움이 됐다면,<br />주변에 알려주세요!
              </h2>
              <p style={{ fontSize: 15, color: '#555', lineHeight: 1.9, marginBottom: 0 }}>
                에브리타임, 블라인드, 인스타그램, 카카오오픈채팅, 네이버카페 등 어디든 좋아요.<br />
                잡통을 소개하는 글을 올리고 링크나 캡처를<br />
                <strong style={{ color: '#0f2244' }}>barunapplication@gmail.com</strong> 으로 보내주시면<br />
                확인 후 <strong style={{ color: '#e6a800' }}>분석권 1회를 무료로 드립니다! 🎉</strong>
              </p>
            </div>

            {/* 카드 */}
            <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 24, padding: '40px 48px', position: 'relative', overflow: 'hidden', textAlign: 'left', maxWidth: 640, margin: '0 auto 32px' }} className="promo-card">
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'rgba(230,168,0,0.08)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: -50, left: -20, width: 140, height: 140, background: 'rgba(230,168,0,0.05)', borderRadius: '50%' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#e6a800', marginBottom: 16, letterSpacing: '0.05em' }}>📋 유의사항</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }} className="promo-grid">
                  {[
                    '본인이 직접 작성한 게시글만 인정됩니다',
                    '게시글 삭제 시 크레딧이 회수될 수 있습니다',
                    '동일 채널 중복 신청은 불가합니다',
                    '검토 후 3영업일 이내 지급됩니다',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#e6a800', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✔</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA 버튼 */}
            <a
              href="mailto:barunapplication@gmail.com?subject=잡통 홍보 인증&body=안녕하세요! 잡통 홍보 게시글 링크/캡처를 첨부합니다.%0A%0A채널: %0A링크 또는 캡처 첨부:"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#e6a800', color: '#fff', borderRadius: 14, padding: '16px 36px', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 6px 20px rgba(230,168,0,0.35)' }}
            >
              📧 인증 메일 보내기
            </a>
          </div>
        </section>

        {/* 다른 서비스 섹션 */}
        <section style={{ background: '#f0ede6', padding: '56px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.12em', marginBottom: 10 }}>BARUN APPLICATION</p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f2244', margin: 0, letterSpacing: '-0.5px' }}>바른어플리케이션의 다른 서비스</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              {APP_LIST.filter(app => !app.current).map(app => (
                <div
                  key={app.id}
                  onClick={() => window.open(app.url, '_blank')}
                  style={{ background: '#fff', borderRadius: 20, padding: '28px 28px', border: `2px solid #e5e3dc`, cursor: 'pointer', width: 280, transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = app.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${app.color}22` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e3dc'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 32 }}>{app.emoji}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#0f2244' }}>{app.name}</span>
                        <span style={{ background: `${app.color}20`, color: app.color, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{app.tag}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 14px' }}>{app.desc}</p>
                  <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>{app.url.replace('https://', '')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer style={{ background: '#0a1628', color: 'rgba(184,217,238,0.5)', padding: '40px 24px', textAlign: 'center', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <Emblem size={28} /><span style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>잡통</span>
          </div>
          <p>자소서 정밀 검토 서비스 · 문의: barunapplication@gmail.com</p>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 24 }}>
            <button onClick={() => window.location.href = '/privacy'} style={{ background: 'none', border: 'none', color: 'rgba(184,217,238,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>개인정보처리방침</button>
            <button onClick={() => window.location.href = '/terms'} style={{ background: 'none', border: 'none', color: 'rgba(184,217,238,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>이용약관</button>
          </div>
          <p style={{ marginTop: 12, color: '#fff', fontSize: 13 }}>바른어플리케이션 | 대표: 조신성 | 사업자등록번호: 896-03-03938 · 통신판매업신고: 제2026-경기광명-0710호 | Tel: 070-8064-1382</p>
          <p style={{ marginTop: 4, color: '#fff', fontSize: 13 }}>경기도 광명시 소하로 162</p>
          <p style={{ marginTop: 6, color: 'rgba(184,217,238,0.3)', fontSize: 11 }}>© 2026 바른어플리케이션. All rights reserved.</p>
        </footer>
      </main>
    )
  }

  // ── ANALYZE ──
  if (step === 'analyze') {
    const mode = getAnalyzeMode()
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #ece9e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>✏️</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f2244', letterSpacing: '-0.5px' }}>자소서 분석 시작</h2>
            </div>
            <p style={{ color: '#555', fontSize: 15, marginBottom: 36, lineHeight: 1.8 }}>
              자소서를 직접 입력하거나 파일을 업로드해주세요.<br />즉시 분석하고 정직하게 피드백합니다.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>지원 회사</label>
                <p style={{ fontSize: 12, color: '#e6a800', fontWeight: 600, margin: '0 0 8px' }}>※ 지원 회사나 직무를 입력하면 더욱 정밀한 분석이 가능합니다.</p>
                <input type="text" style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="예: 삼성전자, 카카오, 현대자동차" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 8 }}>지원 직무</label>
                <input type="text" style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="예: 마케팅, 백엔드 개발, 영업관리" value={position} onChange={e => setPosition(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>자소서 내용 <span style={{ color: '#e63946' }}>*</span></label>
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #e5e3dc', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: 12, background: fileName ? '#f0fdf4' : '#faf9f7' }}>
                  <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                  {fileName ? (
                    <><p style={{ fontSize: 14, fontWeight: 700, color: '#10b981', margin: 0 }}>✓ {fileName}</p><p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>파일이 업로드됐습니다. 아래에서 내용을 확인하거나 수정할 수 있어요.</p></>
                  ) : (
                    <><p style={{ fontSize: 14, fontWeight: 700, color: '#0f2244', margin: 0 }}>📄 TXT 파일 업로드</p><p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>클릭하여 업로드</p><p style={{ fontSize: 11, color: '#bbb', margin: '6px 0 0', lineHeight: 1.6 }}>워드/한글 → 다른 이름으로 저장 → 파일 형식: 일반 텍스트(.txt)</p></>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
                  <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>또는 직접 입력</span>
                  <div style={{ flex: 1, height: 1, background: '#e8e5dc' }} />
                </div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    style={{ width: '100%', border: `1.5px solid ${content.length > 5000 ? '#ef4444' : '#e5e3dc'}`, borderRadius: 12, padding: '16px', fontSize: 15, color: '#1a1a1a', background: '#faf9f7', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.8, boxSizing: 'border-box' }}
                    rows={14}
                    maxLength={5100}
                    placeholder="자소서 내용을 여기에 직접 입력하거나 붙여넣어 주세요. (최소 100자 ~ 최대 5,000자)"
                    value={content}
                    onChange={e => { setContent(e.target.value); if (fileName) setFileName('') }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                    <span style={{ color: '#aaa' }}>최소 100자 이상 입력해주세요</span>
                    <span style={{ color: content.length > 5000 ? '#ef4444' : content.length > 4500 ? '#f59e0b' : '#aaa', fontWeight: content.length > 4500 ? 700 : 400 }}>
                      {content.length.toLocaleString()} / 5,000자
                    </span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 12, color: '#bbb' }}>{content.length}자</div>
                </div>
              </div>

              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, padding: '14px 16px', fontSize: 14 }}>{error}</div>}

              {/* 분석 버튼 — 상태에 따라 다르게 */}
              {mode === 'paid' && (
                <div>
                  <button onClick={() => handleAnalyze('paid')} disabled={loading} style={{ width: '100%', background: loading ? '#ccc' : '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {loading ? <><svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" /><path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>정밀 분석 중입니다...</> : `전체 분석 시작하기 (잔여 ${userProfile?.paid_credits || 0}회) →`}
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>분석 후 1회 차감됩니다</p>
                </div>
              )}

              {mode === 'both' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => handleAnalyze('free')} disabled={loading} style={{ width: '100%', background: loading ? '#ccc' : '#f7f6f3', color: '#0f2244', border: '1.5px solid #ddd', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    무료 분석 (총평 + 핵심문제만)
                  </button>
                  <button onClick={() => window.location.href = '/payment'} disabled={loading} style={{ width: '100%', background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}>
                    전체 분석권 구매하기 →
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 4 }}>1회권 ₩2,900 / 5회권 ₩9,900</p>
                </div>
              )}

              {mode === 'free' && (
                <div>
                  <button onClick={() => handleAnalyze('free')} disabled={loading} style={{ width: '100%', background: loading ? '#ccc' : '#0f2244', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    {loading ? <><svg style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4" /><path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>정밀 분석 중입니다...</> : '무료 분석 시작하기 →'}
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>총평 + 핵심 문제 1가지 제공</p>
                </div>
              )}

              {mode === 'purchase' && (
                <div>
                  <button onClick={() => window.location.href = '/payment'} style={{ width: '100%', background: '#e6a800', color: '#fff', border: 'none', borderRadius: 14, padding: '18px', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}>
                    전체 분석권 구매하기 (₩2,900~) →
                  </button>
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8 }}>무료 체험을 이미 사용하셨습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .jobtong-slogan { font-size: 28px; white-space: nowrap; } @media (max-width: 768px) { .jobtong-slogan { display: none; } }`}</style>
      </main>
    )
  }

  // ── RESULT ──
  if (step === 'result' && result) {
    const isPaid = analyzeType === 'paid'
    return (
      <main style={base}>
        <Header />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 분석 타입 표시 + PDF 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }} />
            <span style={{ background: isPaid ? '#0f2244' : '#f7f6f3', color: isPaid ? '#fff' : '#888', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20 }}>
              {isPaid ? '✓ 전체 분석 결과' : '무료 분석 결과'}
            </span>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              {isPaid && (
                <button
                  onClick={async () => {
                    const element = document.getElementById('pdf-all-content')
                    if (!element) return
                    if (!(window as any).html2pdf) {
                      const script = document.createElement('script')
                      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
                      document.head.appendChild(script)
                      await new Promise(resolve => { script.onload = resolve })
                    }
                    const filename = `잡통_자소서분석_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.pdf`
                    element.style.display = 'block'
                    await (window as any).html2pdf().set({
                      margin: [10, 10, 10, 10], filename,
                      image: { type: 'jpeg', quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true },
                      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    }).from(element).save()
                    element.style.display = 'none'
                  }}
                  style={{ background: '#fff', color: '#0f2244', border: '1.5px solid #0f2244', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📄 전체 결과 PDF 저장
                </button>
              )}
            </div>
          </div>

          {/* 종합 점수 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', border: '1px solid #ece9e1', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#aaa', fontWeight: 700, marginBottom: 12, letterSpacing: 2 }}>종합 점수</p>
            <div style={{ fontSize: 88, fontWeight: 900, color: getScoreColor(result.totalScore), lineHeight: 1, marginBottom: 8 }}>{result.totalScore}</div>
            <div style={{ fontSize: 16, color: '#bbb', marginBottom: 16 }}>/ 100점</div>
            <div style={{ display: 'inline-block', background: getScoreBg(result.totalScore), color: getScoreTxt(result.totalScore), fontSize: 14, fontWeight: 700, padding: '6px 20px', borderRadius: 20 }}>{getScoreLabel(result.totalScore)}</div>
          </div>

          {/* 총평 */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', border: '1px solid #ece9e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🔍</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f2244' }}>총평</h3>
            </div>
            <p style={{ color: '#333', lineHeight: 1.85, fontSize: 15 }}>{result.summary}</p>
          </div>

          {/* 핵심 문제 */}
          <div style={{ background: '#fffbeb', borderRadius: 20, padding: '32px 36px', border: '2px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>
                핵심 문제
                {!isPaid && <span style={{ fontSize: 11, background: '#fde68a', color: '#92400e', padding: '2px 10px', borderRadius: 20, marginLeft: 8, fontWeight: 700 }}>무료 공개</span>}
              </h3>
            </div>
            <p style={{ color: '#444', lineHeight: 1.85, fontSize: 15 }}>{result.mainIssue}</p>
          </div>

          {/* 유료 전용 결과 — 프리미엄 컴포넌트 */}
          {isPaid && (
            <PaidResult
              result={result}
              company={company}
              position={position}
              onReanalyze={() => { setStep('analyze'); setResult(null); setContent(''); setFileName('') }}
            />
          )}

          {/* 무료 결과 → 결제 유도 */}
          {!isPaid && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #ece9e1', overflow: 'hidden', position: 'relative' }}>
              <div style={{ padding: '32px 36px', filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.45 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2244', marginBottom: 20 }}>📊 항목별 세부 점수</h3>
                {['논리성', '구체성', '직무 적합성', '표현력'].map(item => (
                  <div key={item} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: '#333' }}>{item}</span>
                      <span style={{ color: '#aaa' }}>-- 점</span>
                    </div>
                    <div style={{ height: 8, background: '#eee', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: '65%', background: '#0f2244', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.97) 30%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '40px 36px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f2244', marginBottom: 10 }}>전체 분석 결과 보기</h3>
                  <p style={{ color: '#555', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>항목별 점수, 문장 개선 제안, 최종 종합 조언까지<br />결제 후 바로 확인하세요.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => window.location.href = '/payment'} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>1회권 ₩2,900</button>
                    <button onClick={() => window.location.href = '/payment'} style={{ background: '#e6a800', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>5회권 ₩9,900 ⭐</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isPaid && (
            <button onClick={() => { setStep('analyze'); setResult(null); setContent(''); setFileName('') }} style={{ width: '100%', background: '#fff', color: '#0f2244', border: '2px solid #0f2244', borderRadius: 14, padding: '16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              다른 자소서 분석하기
            </button>
          )}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideInUp { from { transform: translateY(120%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .jobtong-slogan { font-size: 28px; white-space: nowrap; }
          @media (max-width: 768px) { .jobtong-slogan { display: none; } }
        `}</style>

        {/* 홍보 슬라이드인 배너 */}
        {showPromoSlide && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, width: 320, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'slideInUp 0.4s ease' }}>
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setShowPromoSlide(false)
                setPromoClosed(true)
                localStorage.setItem('jobtong-promo-closed', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
              }}
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 14, zIndex: 1 }}
            >✕</button>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(230,168,0,0.2)', border: '1px solid rgba(230,168,0,0.4)', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: '#e6a800', marginBottom: 12 }}>
                🎁 홍보 이벤트
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>
                잡통이 도움이 됐다면,<br />주변에 알려주세요!
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 16 }}>
                SNS나 커뮤니티에 잡통을 소개하고<br />
                링크/캡처를 <strong style={{ color: '#fff' }}>barunapplication@gmail.com</strong> 으로 보내주시면<br />
                <strong style={{ color: '#e6a800' }}>분석권 1회를 무료로 드립니다! 🎉</strong>
              </p>
              <a
                href="mailto:barunapplication@gmail.com?subject=잡통 홍보 인증&body=안녕하세요! 잡통 홍보 게시글 링크/캡처를 첨부합니다.%0A%0A채널: %0A링크 또는 캡처 첨부:"
                style={{ display: 'block', textAlign: 'center', background: '#e6a800', color: '#fff', borderRadius: 10, padding: '11px', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}
              >
                📧 인증 메일 보내기
              </a>
            </div>
          </div>
        )}

      </main>
    )
  }

  return null
}
