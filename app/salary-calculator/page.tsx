'use client'

import { useState } from 'react'

const base: React.CSSProperties = { fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f7f6f3', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { background: '#fff', borderBottom: '1px solid #ece9e1', position: 'sticky', top: 0, zIndex: 50 }
const headerInner: React.CSSProperties = { maxWidth: 680, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }

// ── 2026년 기준 4대보험 요율(근로자 부담분) ──
const PENSION_RATE = 0.0475        // 국민연금 4.75%
const PENSION_FLOOR = 410000       // 기준소득월액 하한
const PENSION_CEIL = 6590000       // 기준소득월액 상한
const HEALTH_RATE = 0.03595        // 건강보험 3.595%
const LONGTERM_CARE_RATE = 0.1314  // 장기요양보험 = 건강보험료의 13.14%
const EMPLOYMENT_RATE = 0.009      // 고용보험 0.9%

// ── 근로소득공제 (연간, 총급여 기준) ──
function workIncomeDeduction(gross: number) {
  if (gross <= 5_000_000) return gross * 0.7
  if (gross <= 15_000_000) return 3_500_000 + (gross - 5_000_000) * 0.4
  if (gross <= 45_000_000) return 7_500_000 + (gross - 15_000_000) * 0.15
  if (gross <= 100_000_000) return 12_000_000 + (gross - 45_000_000) * 0.05
  return 14_750_000 + (gross - 100_000_000) * 0.02
}

// ── 종합소득세 기본세율 구간 (2026년 기준, 누진공제 방식) ──
function incomeTaxByBracket(base: number) {
  if (base <= 14_000_000) return base * 0.06
  if (base <= 50_000_000) return base * 0.15 - 1_260_000
  if (base <= 88_000_000) return base * 0.24 - 5_760_000
  if (base <= 150_000_000) return base * 0.35 - 15_440_000
  if (base <= 300_000_000) return base * 0.38 - 19_940_000
  if (base <= 500_000_000) return base * 0.40 - 25_940_000
  if (base <= 1_000_000_000) return base * 0.42 - 35_940_000
  return base * 0.45 - 65_940_000
}

// ── 근로소득세액공제 ──
function earnedIncomeTaxCredit(calcTax: number, gross: number) {
  let credit = calcTax <= 1_300_000 ? calcTax * 0.55 : 715_000 + (calcTax - 1_300_000) * 0.3
  let limit = 740_000
  if (gross > 33_000_000 && gross <= 70_000_000) {
    limit = Math.max(740_000 - (gross - 33_000_000) * 0.008, 660_000)
  } else if (gross > 70_000_000) {
    limit = Math.max(660_000 - (gross - 70_000_000) * 0.5, 500_000)
  }
  return Math.min(credit, limit)
}

// ── 자녀세액공제 (20세 이하 자녀 수 기준, 단순화) ──
function childTaxCredit(childCount: number) {
  if (childCount <= 0) return 0
  if (childCount === 1) return 150_000
  if (childCount === 2) return 350_000
  return 350_000 + (childCount - 2) * 300_000
}

function calcNetSalary(annualSalary: number, nonTaxable: number, dependents: number, children: number) {
  const monthlyGross = annualSalary / 12
  const monthlyNonTaxable = nonTaxable
  const taxableMonthly = Math.max(monthlyGross - monthlyNonTaxable, 0)

  // 4대보험 (비과세 제외한 과세 대상 소득 기준)
  const pensionBase = Math.min(Math.max(taxableMonthly, PENSION_FLOOR), PENSION_CEIL)
  const pension = Math.round(pensionBase * PENSION_RATE)
  const health = Math.round(taxableMonthly * HEALTH_RATE)
  const longtermCare = Math.round(health * LONGTERM_CARE_RATE)
  const employment = Math.round(taxableMonthly * EMPLOYMENT_RATE)
  const insuranceTotal = pension + health + longtermCare + employment

  // 소득세 (연간 계산 후 월할)
  const annualTaxable = taxableMonthly * 12
  const deduction = workIncomeDeduction(annualTaxable)
  const earnedIncomeAmount = Math.max(annualTaxable - deduction, 0)
  const personalDeduction = dependents * 1_500_000
  const taxBase = Math.max(earnedIncomeAmount - personalDeduction, 0)
  const calcTax = Math.max(incomeTaxByBracket(taxBase), 0)
  const credit = earnedIncomeTaxCredit(calcTax, annualTaxable)
  const cTaxCredit = childTaxCredit(children)
  const annualIncomeTax = Math.max(calcTax - credit - cTaxCredit, 0)
  const monthlyIncomeTax = Math.round(annualIncomeTax / 12)
  const monthlyLocalTax = Math.round(monthlyIncomeTax * 0.1)
  const taxTotal = monthlyIncomeTax + monthlyLocalTax

  const monthlyNet = Math.round(monthlyGross - insuranceTotal - taxTotal)
  const effectiveTaxRate = taxableMonthly > 0 ? (monthlyIncomeTax / taxableMonthly) * 100 : 0

  return {
    monthlyGross: Math.round(monthlyGross),
    pension, health, longtermCare, employment, insuranceTotal,
    monthlyIncomeTax, monthlyLocalTax, taxTotal,
    effectiveTaxRate,
    monthlyNet,
    annualNet: monthlyNet * 12,
  }
}

export default function SalaryCalculatorPage() {
  const [salaryInput, setSalaryInput] = useState('')
  const [nonTaxable, setNonTaxable] = useState('')
  const [dependents, setDependents] = useState('')
  const [children, setChildren] = useState('')
  const [hasCalculated, setHasCalculated] = useState(false)
  const [formError, setFormError] = useState('')

  const annualSalary = parseInt(salaryInput.replace(/[^0-9]/g, '')) || 0
  const nonTaxableNum = parseInt(nonTaxable.replace(/[^0-9]/g, '')) || 0
  const dependentsNum = Math.max(parseInt(dependents) || 1, 1)
  const childrenNum = Math.max(parseInt(children) || 0, 0)

  const result = hasCalculated && annualSalary > 0 ? calcNetSalary(annualSalary, nonTaxableNum, dependentsNum, childrenNum) : null

  const handleCalculate = () => {
    if (annualSalary <= 0) {
      setFormError('연봉을 입력해주세요.')
      setHasCalculated(false)
      return
    }
    setFormError('')
    setHasCalculated(true)
  }

  return (
    <main style={base}>
      <header style={headerStyle}>
        <div style={headerInner}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 20, fontWeight: 900, color: '#0f2244', fontFamily: 'inherit' }}>
            잡통
          </button>
          <span style={{ fontSize: 13, color: '#666' }}>실수령액 계산기</span>
          <span style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#059669', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>무료 · 무제한</span>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f2244', margin: '0 0 6px' }}>💰 실수령액 계산기</h1>
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>2026년 기준 4대보험 요율로 세전 연봉 기준 월 실수령액을 계산해요.</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '22px', marginBottom: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>연봉 (세전, 필수)</label>
            <div style={{ position: 'relative' }}>
              <input
                value={salaryInput ? Number(salaryInput.replace(/[^0-9]/g, '') || 0).toLocaleString() : ''}
                onChange={e => { setSalaryInput(e.target.value); setHasCalculated(false) }}
                placeholder="예: 40,000,000"
                style={{ width: '100%', padding: '14px 44px 14px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#888' }}>원</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>비과세액 (월, 식대 등)</label>
            <input
              value={nonTaxable ? Number(nonTaxable.replace(/[^0-9]/g, '') || 0).toLocaleString() : ''}
              onChange={e => { setNonTaxable(e.target.value); setHasCalculated(false) }}
              placeholder="예: 200,000 (모르면 비워두세요)"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0' }}>보통 식대(월 20만원)가 비과세로 처리돼요. 비워두면 0원으로 계산돼요.</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>부양가족 수 (본인 포함)</label>
              <input
                type="number"
                min={1}
                value={dependents}
                onChange={e => { setDependents(e.target.value); setHasCalculated(false) }}
                placeholder="예: 1"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#333', display: 'block', marginBottom: 6 }}>20세 이하 자녀 수</label>
              <input
                type="number"
                min={0}
                value={children}
                onChange={e => { setChildren(e.target.value); setHasCalculated(false) }}
                placeholder="예: 0"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: '1.5px solid #ccc', fontSize: 14, fontFamily: 'inherit', color: '#222', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {formError && <p style={{ fontSize: 13, color: '#ef4444', margin: '14px 0 0' }}>{formError}</p>}

          <button
            onClick={handleCalculate}
            style={{ width: '100%', marginTop: 16, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '15px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            계산하기
          </button>
        </div>

        {result && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 20, padding: '32px 28px', textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>예상 월 실수령액</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>{result.monthlyNet.toLocaleString()}원</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>연 실수령액 약 {result.annualNet.toLocaleString()}원</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', padding: '22px', marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0f2244', margin: '0 0 14px' }}>공제 내역 상세 (월 기준)</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f0ede6', fontSize: 13 }}>
                <span style={{ color: '#666' }}>세전 월급</span>
                <span style={{ fontWeight: 700, color: '#222' }}>{result.monthlyGross.toLocaleString()}원</span>
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, color: '#999', margin: '14px 0 6px' }}>4대보험</p>
              {[
                ['국민연금', result.pension, '4.75%'],
                ['건강보험', result.health, '3.595%'],
                ['장기요양보험', result.longtermCare, '건보료의 13.14%'],
                ['고용보험', result.employment, '0.9%'],
              ].map(([label, val, rate]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{label} <span style={{ fontSize: 11, color: '#bbb' }}>({rate})</span></span>
                  <span style={{ color: '#ef4444' }}>-{(val as number).toLocaleString()}원</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f0ede6', marginTop: 4, fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: '#666' }}>4대보험 합계</span>
                <span style={{ color: '#ef4444' }}>-{result.insuranceTotal.toLocaleString()}원</span>
              </div>

              <p style={{ fontSize: 12, fontWeight: 700, color: '#999', margin: '14px 0 6px' }}>세금</p>
              {[
                ['소득세', result.monthlyIncomeTax, `실효세율 약 ${result.effectiveTaxRate.toFixed(1)}%`],
                ['지방소득세', result.monthlyLocalTax, '소득세의 10%'],
              ].map(([label, val, rate]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>{label} <span style={{ fontSize: 11, color: '#bbb' }}>({rate})</span></span>
                  <span style={{ color: '#ef4444' }}>-{(val as number).toLocaleString()}원</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f0ede6', marginTop: 4, fontSize: 13, fontWeight: 700 }}>
                <span style={{ color: '#666' }}>세금 합계</span>
                <span style={{ color: '#ef4444' }}>-{result.taxTotal.toLocaleString()}원</span>
              </div>
            </div>

            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.7 }}>
              2026년 기준 4대보험 요율과 종합소득세 세율표를 적용한 참고용 계산이며, 실제 급여명세서·원천징수세액과 차이가 있을 수 있습니다.<br />
              정확한 금액은 회사 인사·재무 담당자 또는 국세청 근로소득 간이세액표를 통해 확인해주세요.
            </p>
          </>
        )}

        {/* 잡통 유도 배너 */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: '20px 22px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>연봉만큼 중요한 건, 그 연봉을 받을 수 있는 서류예요</p>
          <p style={{ fontSize: 13, color: '#78350f', margin: '0 0 14px' }}>잡통이 자소서·이력서를 정밀 분석해드려요.</p>
          <button onClick={() => window.location.href = '/'} style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            취업 서류 정밀 분석 받으러 가기 →
          </button>
        </div>
      </div>
    </main>
  )
}
