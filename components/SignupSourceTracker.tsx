'use client'

import { useEffect } from 'react'

// 가입 경로(유입 채널) 기록용 — 화면에는 아무것도 그리지 않음
export const SIGNUP_SOURCE_KEY = 'jobtong-signup-source'
const KEEP_DAYS = 30

type StoredSource = {
  source: string | null
  referrer: string | null
  landingAt: string
}

export default function SignupSourceTracker() {
  useEffect(() => {
    try {
      // 1) 30일 이내 저장값이 있으면 "처음 들어온 경로" 유지 → 덮어쓰지 않음
      const raw = localStorage.getItem(SIGNUP_SOURCE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as StoredSource
        const age = Date.now() - new Date(saved.landingAt).getTime()
        if (saved.landingAt && !isNaN(age) && age < KEEP_DAYS * 24 * 60 * 60 * 1000) return
      }

      // 2) utm_source 확인 (소문자, 50자 이내)
      const params = new URLSearchParams(window.location.search)
      const utm = (params.get('utm_source') || '').trim().toLowerCase().slice(0, 50)

      // 3) utm이 없으면 이전 사이트 도메인 (같은 사이트 내 이동은 제외)
      let referrer: string | null = null
      if (!utm && document.referrer) {
        try {
          const refHost = new URL(document.referrer).hostname.toLowerCase()
          if (refHost && refHost !== window.location.hostname.toLowerCase()) {
            referrer = refHost.replace(/^www\./, '').slice(0, 100)
          }
        } catch {}
      }

      // 4) 직접 방문이어도 최초 방문 시각은 반드시 기록
      const data: StoredSource = {
        source: utm || null,
        referrer,
        landingAt: new Date().toISOString(),
      }
      localStorage.setItem(SIGNUP_SOURCE_KEY, JSON.stringify(data))
    } catch {
      // 저장소 사용 불가 환경(시크릿 모드 등)은 조용히 무시
    }
  }, [])

  return null
}
