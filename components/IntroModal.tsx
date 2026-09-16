'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const DISMISS_KEY = 'jobtong_intro_dismissed_메인'
const OPEN_EVENT = 'jobtong:open-intro'

interface Tool {
  icon: string
  iconBg: string
  name: string
  badge?: { text: string; color: string }
  lines: string[]
  link: string
}

const TOOLS: Tool[] = [
  {
    icon: '📝',
    iconBg: '#e6f1fb',
    name: '자기소개서 정밀 분석',
    link: '/?start=analyze',
    lines: [
      '논리성·구체성·직무적합성까지 4가지 기준으로 정밀 채점해요.',
      '문장 하나하나를 BEFORE→AFTER로 비교해 구체적으로 고치는 법까지 알려드려요.',
      'AI가 쓴 것 같은 문장과 오탈자·맞춤법까지 잡아내 "사람다운 완성도"까지 챙겨드려요.',
    ],
  },
  {
    icon: '📋',
    iconBg: '#e6f1fb',
    name: '이력서·경력기술서 정밀 분석',
    link: '/?start=analyze',
    lines: [
      '채용담당자가 6초 안에 핵심을 파악할 수 있는 구조인지 진단해요.',
      '성과가 수치로 증명되는지, 개선 포인트를 6가지 이상 짚어드려요.',
      '경력이 아무리 많아도 지원 직무와 가장 관련 있는 순서로 재배치하는 법을 알려드려요.',
    ],
  },
  {
    icon: '✨',
    iconBg: '#f5f3ff',
    name: '잡통 플러스',
    badge: { text: 'PLUS', color: '#8b5cf6' },
    link: '/consistency-check',
    lines: [
      '자소서에서 말한 강점이 이력서로 실제 증명되는지 두 문서를 대조해드려요.',
      '서류에서 실제로 파생된 예상 면접 질문 5개와 근거·답변 팁까지 함께 드려요.',
      '가장 강력한 강점 하나에 집중한 1분 자기소개 스크립트까지 한 번에 준비해드려요.',
    ],
  },
  {
    icon: '🎤',
    iconBg: '#f5f3ff',
    name: '모의 면접',
    link: '/mock-interview',
    lines: [
      '서류를 바탕으로 만든 질문에 실제 음성으로 답하는 진짜 실전 연습이에요.',
      '질문 적합성·구체성·구조 등 6가지 기준으로 답변을 정밀 채점해드려요.',
      '잘한 점, 고칠 점, 반복되는 습관까지 짚어드려서 다음 면접에 바로 써먹을 수 있어요.',
    ],
  },
]

interface IntroModalProps {
  autoShow?: boolean
}

export default function IntroModal({ autoShow = false }: IntroModalProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (autoShow) {
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed !== 'true') {
        setOpen(true)
      }
    }

    const handleOpenEvent = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, handleOpenEvent)
    return () => window.removeEventListener(OPEN_EVENT, handleOpenEvent)
  }, [autoShow])

  const handleClose = () => {
    // 세션에서만 닫기 — 다음 방문 때는 autoShow 조건이면 다시 뜸
    setOpen(false)
  }

  const handleDismissForever = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setOpen(false)
  }

  if (!mounted || !open) return null

  const modal = (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 24, width: '100%', maxWidth: 860,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          fontFamily: "'Pretendard', -apple-system, sans-serif", wordBreak: 'keep-all',
        }}
      >
        {/* 헤더 (고정) */}
        <div style={{ padding: '30px 36px 22px', position: 'relative', borderBottom: '1px solid #f0ede6', flexShrink: 0 }}>
          <button
            onClick={handleClose}
            aria-label="닫기"
            style={{ position: 'absolute', top: 22, right: 26, background: 'none', border: 'none', fontSize: 20, color: '#bbb', cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#0f2244,#1a3a6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>J</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2244' }}>잡통</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f2244', margin: '0 0 14px' }}>잡통이 뭐예요?</h2>
          <div style={{ fontSize: 13.5, color: '#555', lineHeight: 1.85 }}>
            <p style={{ margin: '0 0 3px' }}>☕ 컨설팅 몇십만 원 대신, 커피 한 잔 값이면 자소서부터 면접까지 정직한 피드백을 받아보세요</p>
            <p style={{ margin: '0 0 3px' }}>🔁 몇 번을 고쳐도 확신이 안 서던 서류, 어디가 문제인지 콕 짚어서 잡통이 대신 끝내드려요</p>
            <p style={{ margin: 0 }}>🎯 취업 서류와 면접만 파고들어 수백 번 다듬은 AI가, 채용담당자 시선으로 냉정하게 진단해드려요</p>
          </div>
        </div>

        {/* 도구 리스트 (스크롤) */}
        <div style={{ overflowY: 'auto', padding: '6px 36px', flex: 1 }}>
          {TOOLS.map((tool, i) => (
            <div
              key={i}
              onClick={() => { window.location.href = tool.link }}
              style={{
                display: 'flex', gap: 18, alignItems: 'center', padding: '18px 4px',
                borderBottom: i < TOOLS.length - 1 ? '1px solid #f0ede6' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 12, background: tool.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 21 }}>
                {tool.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f2244' }}>{tool.name}</span>
                  {tool.badge && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: tool.badge.color, padding: '2px 7px', borderRadius: 20 }}>
                      {tool.badge.text}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>
                  {tool.lines.map((line, li) => (
                    <span key={li}>
                      {line}
                      {li < tool.lines.length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e6a800', flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'flex-start', paddingTop: 2 }}>
                바로가기 →
              </div>
            </div>
          ))}
        </div>

        {/* 하단 (고정) */}
        <div style={{ padding: '18px 36px 28px', borderTop: '1px solid #f0ede6', flexShrink: 0 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
            <p style={{ fontSize: 12.5, color: '#92400e', margin: 0, lineHeight: 1.75 }}>
              이 외에도 지원 일정 관리, 자소서 글자수 카운터, 실수령액 계산기, 취업 준비도 자가진단까지 — 로그인만 하면 모두 무료로 이용하실 수 있어요.
            </p>
          </div>
          <button
            onClick={handleDismissForever}
            style={{ width: '100%', background: '#f7f6f3', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

// 헤더 등 어디서든 이 함수를 호출하면 모달이 열림 (autoShow 여부와 무관하게 항상 동작)
export function openIntroModal() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}
