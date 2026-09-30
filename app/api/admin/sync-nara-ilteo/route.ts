import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 여러 조합을 순회하므로 넉넉하게 (플랜에 따라 상한이 다를 수 있음)

const API_BASE = 'https://apis.data.go.kr/1760000/PblJobService/getList'
const PBLANC_TYPES = ['e01', 'e02', 'e03', 'e04', 'e06'] // 공모직위(e06) 등 5종 — 인턴 코드는 없음
const INSTT_TYPES = ['g01', 'g02', 'g03', 'g04'] // 국가공무원/지방공무원/공공기관/교육청
const NUM_OF_ROWS = 100
const MAX_PAGES_PER_COMBO = 3 // 조합당 최대 300건 — 타임아웃 방지 안전장치 (병렬 처리해도 배치 내 가장 느린 조합이 전체를 좌우함)
const FETCH_WINDOW_DAYS = 60 // 최근 60일 등록분만 수집 (오래된 마감 공고까지 긁어올 필요 없음)

interface NaraItem {
  idx: string
  title: string
  insttname: string
  enddate: string // yyyymmdd
  regdate: string
  type01: string
}

function formatDateHyphen(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function toIsoDate(yyyymmdd: string): string | null {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

function getTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim() : ''
}

function parseItems(xml: string): NaraItem[] {
  const items: NaraItem[] = []
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
  for (const raw of itemMatches) {
    const idx = getTag(raw, 'idx')
    const title = getTag(raw, 'title')
    if (!idx || !title) continue
    items.push({
      idx,
      title,
      insttname: getTag(raw, 'insttname'),
      enddate: getTag(raw, 'enddate'),
      regdate: getTag(raw, 'regdate'),
      type01: getTag(raw, 'type01'),
    })
  }
  return items
}

async function fetchPage(pblancTy: string, insttSe: string, beginDe: string, endDe: string, pageNo: number): Promise<string> {
  const params = new URLSearchParams({
    serviceKey: process.env.NARA_ILTEO_SERVICE_KEY!,
    pageNo: String(pageNo),
    numOfRows: String(NUM_OF_ROWS),
    Pblanc_ty: pblancTy,
    Instt_se: insttSe,
    Begin_de: beginDe,
    End_de: endDe,
    Sort_order: '1',
  })
  const res = await fetch(`${API_BASE}?${params.toString()}`)
  return res.text()
}

interface ComboResult {
  fetched: number
  upserted: number
  errors: string[]
}

// 조합(공고유형×기관구분) 하나를 끝까지 처리 — 여러 조합이 이 함수를 동시에 병렬로 돌림
async function processCombo(
  supabaseAdmin: SupabaseClient,
  pblancTy: string,
  insttSe: string,
  beginDe: string,
  endDe: string
): Promise<ComboResult> {
  const result: ComboResult = { fetched: 0, upserted: 0, errors: [] }
  let pageNo = 1
  let totalCount = Infinity

  while ((pageNo - 1) * NUM_OF_ROWS < totalCount && pageNo <= MAX_PAGES_PER_COMBO) {
    try {
      const xml = await fetchPage(pblancTy, insttSe, beginDe, endDe, pageNo)

      const resultCode = getTag(xml, 'resultCode')
      if (resultCode && resultCode !== '00') {
        result.errors.push(`${pblancTy}/${insttSe} p${pageNo}: resultCode=${resultCode} ${getTag(xml, 'resultMsg')}`)
        break
      }

      totalCount = parseInt(getTag(xml, 'totalCount') || '0', 10)
      const items = parseItems(xml)
      result.fetched += items.length
      if (items.length === 0) break

      const rows = items
        .map(item => {
          const enddateIso = toIsoDate(item.enddate)
          if (!enddateIso) return null
          return {
            idx: item.idx,
            title: item.title,
            insttname: item.insttname,
            pblanc_ty: item.type01 || pblancTy,
            enddate: enddateIso,
            regdate: toIsoDate(item.regdate),
            synced_at: new Date().toISOString(),
          }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)

      if (rows.length > 0) {
        const { error } = await supabaseAdmin.from('nara_ilteo_notices').upsert(rows, { onConflict: 'idx' })
        if (error) {
          result.errors.push(`upsert ${pblancTy}/${insttSe} p${pageNo}: ${error.message}`)
        } else {
          result.upserted += rows.length
        }
      }

      pageNo++
    } catch (e: any) {
      result.errors.push(`${pblancTy}/${insttSe} p${pageNo}: ${e.message}`)
      break
    }
  }

  return result
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    if (!process.env.NARA_ILTEO_SERVICE_KEY) {
      return NextResponse.json({ error: 'NARA_ILTEO_SERVICE_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const today = new Date()
    const windowStart = new Date(today.getTime() - FETCH_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const beginDe = formatDateHyphen(windowStart)
    const endDe = formatDateHyphen(today)
    const todayIso = endDe

    let totalFetched = 0
    let totalUpserted = 0
    const errors: string[] = []

    // 20개 조합(공고유형×기관구분)을 만들어서, 5개씩 묶어 동시에 처리 (순차 처리 시 Vercel 게이트웨이 타임아웃 발생했음)
    const combos: { pblancTy: string; insttSe: string }[] = []
    for (const pblancTy of PBLANC_TYPES) {
      for (const insttSe of INSTT_TYPES) {
        combos.push({ pblancTy, insttSe })
      }
    }

    const CONCURRENCY = 5
    for (let i = 0; i < combos.length; i += CONCURRENCY) {
      const batch = combos.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(
        batch.map(({ pblancTy, insttSe }) => processCombo(supabaseAdmin, pblancTy, insttSe, beginDe, endDe))
      )
      for (const r of batchResults) {
        totalFetched += r.fetched
        totalUpserted += r.upserted
        errors.push(...r.errors)
      }
    }

    // 접수 마감이 지난 공고는 정리 (테이블이 계속 불어나지 않도록)
    const { error: deleteError } = await supabaseAdmin
      .from('nara_ilteo_notices')
      .delete()
      .lt('enddate', todayIso)
    if (deleteError) errors.push(`마감 공고 정리 실패: ${deleteError.message}`)

    return NextResponse.json({
      success: true,
      fetched: totalFetched,
      upserted: totalUpserted,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (e: any) {
    console.error('[sync-nara-ilteo] 오류:', e)
    return NextResponse.json({ error: e.message || '서버 오류' }, { status: 500 })
  }
}
