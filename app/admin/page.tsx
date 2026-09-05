'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [profile, setProfile] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'features' | 'users' | 'payments'>('stats')
  const [featureRows, setFeatureRows] = useState<any[]>([])
  const [featureLoading, setFeatureLoading] = useState(false)
  const [featurePeriod, setFeaturePeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [featureCustomStart, setFeatureCustomStart] = useState('')
  const [featureCustomEnd, setFeatureCustomEnd] = useState('')
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentPeriod, setPaymentPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [paymentCustomStart, setPaymentCustomStart] = useState('')
  const [paymentCustomEnd, setPaymentCustomEnd] = useState('')
  const [editingUser, setEditingUser] = useState<any>(null)
  const [creditAmount, setCreditAmount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [refundModal, setRefundModal] = useState<any>(null)  // 환불 모달 대상 결제
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState('')

  useEffect(() => { checkAdmin() }, [])

  useEffect(() => {
    if (activeTab === 'features') loadFeatureStats()
  }, [activeTab, featurePeriod, featureCustomStart, featureCustomEnd])

  useEffect(() => {
    const q = searchQuery.toLowerCase()
    setFilteredUsers(
      users.filter(u =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q)
      )
    )
  }, [searchQuery, users])

  useEffect(() => {
    if (users.length > 0) calcStats()
  }, [users, periodFilter, customStart, customEnd])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (!p || p.role !== 'admin') { window.location.href = '/'; return }
    setProfile(p)
    await loadData()
    // 점검 모드 상태 로드
    const { data: setting } = await supabase.from('settings').select('value').eq('key', 'maintenance_mode').single()
    if (setting) setMaintenance(setting.value === 'true')
    setLoading(false)
  }

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setUsers(data); setFilteredUsers(data)
    }
  }

  const getPeriodRange = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    if (periodFilter === 'today') {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    if (periodFilter === 'week') {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    if (periodFilter === 'month') {
      const start = new Date(now)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    if (periodFilter === 'custom' && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd + 'T23:59:59') }
    }
    return null
  }

  const calcStats = () => {
    const range = getPeriodRange()
    const filtered = range
      ? users.filter(u => {
          const d = new Date(u.created_at)
          return d >= range.start && d <= range.end
        })
      : users

    const total = users.length
    const periodNew = filtered.length
    const trialUsed = users.filter(u => u.free_trial_used).length
    const paidUsers = users.filter(u => u.paid_credits > 0).length
    const totalAnalyses = users.reduce((s, u) => s + (u.total_analyses || 0), 0)

    setStats({ total, periodNew, trialUsed, paidUsers, totalAnalyses })
  }

  const loadPayments = async () => {
    setPaymentsLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*, profiles(email)')
      .in('status', ['success', 'refunded', 'partial_refunded'])
      .order('created_at', { ascending: false })
    if (data) setPayments(data)
    setPaymentsLoading(false)
  }

  const getPaymentRange = () => {
    const now = new Date()
    const end = new Date(now); end.setHours(23, 59, 59, 999)
    if (paymentPeriod === 'today') { const start = new Date(now); start.setHours(0,0,0,0); return { start, end } }
    if (paymentPeriod === 'week') { const start = new Date(now); start.setDate(now.getDate()-6); start.setHours(0,0,0,0); return { start, end } }
    if (paymentPeriod === 'month') { const start = new Date(now); start.setDate(1); start.setHours(0,0,0,0); return { start, end } }
    if (paymentPeriod === 'custom' && paymentCustomStart && paymentCustomEnd) return { start: new Date(paymentCustomStart), end: new Date(paymentCustomEnd + 'T23:59:59') }
    return null
  }

  const getFeatureRange = () => {
    const now = new Date()
    const end = new Date(now); end.setHours(23, 59, 59, 999)
    if (featurePeriod === 'today') { const start = new Date(now); start.setHours(0,0,0,0); return { start, end } }
    if (featurePeriod === 'week') { const start = new Date(now); start.setDate(now.getDate()-6); start.setHours(0,0,0,0); return { start, end } }
    if (featurePeriod === 'month') { const start = new Date(now); start.setDate(1); start.setHours(0,0,0,0); return { start, end } }
    if (featurePeriod === 'custom' && featureCustomStart && featureCustomEnd) return { start: new Date(featureCustomStart), end: new Date(featureCustomEnd + 'T23:59:59') }
    return null
  }

  const loadFeatureStats = async () => {
    setFeatureLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setFeatureLoading(false); return }

    const range = getFeatureRange()
    const params = new URLSearchParams()
    if (range) {
      params.set('from', range.start.toISOString())
      params.set('to', range.end.toISOString())
    }

    const res = await fetch(`/api/admin/feature-stats?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setFeatureRows(data.rows || [])
    }
    setFeatureLoading(false)
  }

  const handleRefund = async () => {
    if (!refundModal || refundAmount <= 0) { setRefundError('환불액을 입력해주세요.'); return }
    if (refundAmount > refundModal.amount) { setRefundError(`결제 금액(₩${refundModal.amount.toLocaleString()})을 초과할 수 없습니다.`); return }

    setRefundLoading(true); setRefundError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/admin/refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ paymentId: refundModal.id, refundAmount }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      // 화면 즉시 반영 (새로고침 불필요)
      setPayments(prev => prev.map(p =>
        p.id === refundModal.id
          ? { ...p, refund_amount: refundAmount, refund_at: new Date().toISOString(), status: data.status }
          : p
      ))
      setRefundModal(null)
      setRefundAmount(0)
    } else {
      setRefundError(data.error || '환불 처리 중 오류가 발생했습니다.')
    }
    setRefundLoading(false)
  }

  const handleToggleMaintenance = async () => {
    setMaintenanceLoading(true)
    const newVal = !maintenance
    await supabase.from('settings').update({ value: String(newVal), updated_at: new Date().toISOString() }).eq('key', 'maintenance_mode')
    setMaintenance(newVal)
    setMaintenanceLoading(false)
  }

  const handleUpdateCredits = async (userId: string, credits: number, resetTrial: boolean) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/admin/credit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId, credits, resetTrial }),
    })
    await loadData()
    setEditingUser(null)
  }

  const periodLabel = () => {
    if (periodFilter === 'today') return '오늘'
    if (periodFilter === 'week') return '이번 주'
    if (periodFilter === 'month') return '이번 달'
    if (periodFilter === 'custom' && customStart && customEnd) return `${customStart} ~ ${customEnd}`
    return '기간'
  }

  const Emblem = () => (
    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #0f2244 0%, #1a3a6b 100%)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#e6a800', borderRadius: '50%' }} />
      <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>J</span>
    </div>
  )

  if (loading) return (
    <div style={{ fontFamily: "'Pretendard', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f6f3' }}>
      <p style={{ color: '#888' }}>로딩 중...</p>
    </div>
  )

  return (
    <main style={{ fontFamily: "'Pretendard', -apple-system, sans-serif", background: '#f7f6f3', minHeight: '100vh' }}>

      {/* 헤더 */}
      <header style={{ background: '#0f2244', color: '#fff', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Emblem />
          <span style={{ fontSize: 18, fontWeight: 800 }}>잡통</span>
          <span style={{ background: '#e6a800', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700, marginLeft: 4 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{profile?.email}</span>
          <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>사이트 보기</button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ background: 'none', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>로그아웃</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* 점검 모드 토글 */}
        <div style={{ background: maintenance ? '#fef2f2' : '#fff', borderRadius: 16, padding: '20px 24px', border: `2px solid ${maintenance ? '#fecaca' : '#ece9e1'}`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{maintenance ? '🔧' : '✅'}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: maintenance ? '#991b1b' : '#0f2244' }}>
                {maintenance ? '점검 모드 ON — 사용자 접근 차단 중' : '서비스 정상 운영 중'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
              {maintenance ? '일반 사용자에게 점검 화면이 표시됩니다. 어드민은 정상 접속 가능.' : '점검 모드를 켜면 일반 사용자 접속이 차단됩니다.'}
            </p>
          </div>
          <button
            onClick={handleToggleMaintenance}
            disabled={maintenanceLoading}
            style={{ background: maintenance ? '#ef4444' : '#0f2244', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: maintenanceLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: maintenanceLoading ? 0.7 : 1, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 16 }}
          >
            {maintenanceLoading ? '처리 중...' : maintenance ? '점검 모드 OFF' : '점검 모드 ON'}
          </button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[{ key: 'stats', label: '📊 통계' }, { key: 'features', label: '🧩 기능별 사용량' }, { key: 'users', label: '👥 회원 관리' }, { key: 'payments', label: '💳 결제 내역' }].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); if (tab.key === 'payments') loadPayments(); if (tab.key === 'features') loadFeatureStats() }}
              style={{ background: activeTab === tab.key ? '#0f2244' : '#fff', color: activeTab === tab.key ? '#fff' : '#555', border: '1px solid #e8e5dc', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              {tab.label}
            </button>
          ))}
          <button onClick={() => window.location.href = '/admin/job-notices'}
            style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            📢 채용공고
          </button>
        </div>

        {/* 통계 탭 */}
        {activeTab === 'stats' && stats && (
          <div>
            {/* 기간 필터 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #ece9e1', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#555', margin: '0 0 12px' }}>기간 선택</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {[
                  { key: 'today', label: '오늘' },
                  { key: 'week', label: '이번 주' },
                  { key: 'month', label: '이번 달' },
                  { key: 'custom', label: '기간 지정' },
                ].map(p => (
                  <button key={p.key} onClick={() => setPeriodFilter(p.key as any)}
                    style={{ background: periodFilter === p.key ? '#0f2244' : '#f7f6f3', color: periodFilter === p.key ? '#fff' : '#555', border: `1px solid ${periodFilter === p.key ? '#0f2244' : '#e8e5dc'}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p.label}
                  </button>
                ))}
                {periodFilter === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                      style={{ border: '1.5px solid #e5e3dc', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    <span style={{ color: '#888', fontSize: 13 }}>~</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                      style={{ border: '1.5px solid #e5e3dc', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                )}
              </div>
            </div>

            {/* 통계 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              {[
                { label: '총 회원 수', value: `${stats.total}명`, sub: '전체 누적', color: '#0f2244' },
                { label: `신규 가입 (${periodLabel()})`, value: `${stats.periodNew}명`, sub: '기간 내 신규', color: '#6366f1' },
                { label: '무료체험 사용', value: `${stats.trialUsed}명`, sub: `전환율 ${stats.total ? Math.round(stats.trialUsed / stats.total * 100) : 0}%`, color: '#e6a800' },
                { label: '유료 사용자', value: `${stats.paidUsers}명`, sub: `전환율 ${stats.total ? Math.round(stats.paidUsers / stats.total * 100) : 0}%`, color: '#10b981' },
                { label: '총 분석 건수', value: `${stats.totalAnalyses}건`, sub: '전체 누적', color: '#ef4444' },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #ece9e1' }}>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', fontWeight: 600 }}>{item.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: item.color, margin: '0 0 4px' }}>{item.value}</p>
                  <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>{item.sub}</p>
                </div>
              ))}
            </div>

            {/* 전환 퍼널 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #ece9e1' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2244', margin: '0 0 20px' }}>전환 퍼널</h3>
              {[
                { label: '회원가입', value: stats.total, max: stats.total, color: '#0f2244' },
                { label: '무료체험 사용', value: stats.trialUsed, max: stats.total, color: '#e6a800' },
                { label: '유료 전환', value: stats.paidUsers, max: stats.total, color: '#10b981' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#555', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontWeight: 700, color: item.color }}>{item.value}명 ({item.max ? Math.round(item.value / item.max * 100) : 0}%)</span>
                  </div>
                  <div style={{ height: 10, background: '#f0ede6', borderRadius: 5 }}>
                    <div style={{ height: '100%', width: `${item.max ? item.value / item.max * 100 : 0}%`, background: item.color, borderRadius: 5, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 기능별 사용량 탭 */}
        {activeTab === 'features' && (() => {
          const totalCount = featureRows.reduce((sum, r) => sum + r.count, 0)

          // 그룹별로 묶어서 rowSpan 계산
          const groupOrder: string[] = []
          const groupMap: Record<string, any[]> = {}
          featureRows.forEach(row => {
            if (!groupMap[row.group]) { groupMap[row.group] = []; groupOrder.push(row.group) }
            groupMap[row.group].push(row)
          })

          return (
            <div>
              {/* 기간 필터 */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #ece9e1', marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#555', margin: '0 0 12px' }}>기간 선택</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {[
                    { key: 'today', label: '오늘' },
                    { key: 'week', label: '이번 주' },
                    { key: 'month', label: '이번 달' },
                    { key: 'custom', label: '기간 지정' },
                  ].map(p => (
                    <button key={p.key} onClick={() => setFeaturePeriod(p.key as any)}
                      style={{ background: featurePeriod === p.key ? '#0f2244' : '#f7f6f3', color: featurePeriod === p.key ? '#fff' : '#555', border: `1px solid ${featurePeriod === p.key ? '#0f2244' : '#e8e5dc'}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {p.label}
                    </button>
                  ))}
                  {featurePeriod === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <input type="date" value={featureCustomStart} onChange={e => setFeatureCustomStart(e.target.value)}
                        style={{ border: '1.5px solid #e5e3dc', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                      <span style={{ color: '#888', fontSize: 13 }}>~</span>
                      <input type="date" value={featureCustomEnd} onChange={e => setFeatureCustomEnd(e.target.value)}
                        style={{ border: '1.5px solid #e5e3dc', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* 기간 내 총 이용 건수 카드 */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #ece9e1', marginBottom: 20, maxWidth: 260 }}>
                <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', fontWeight: 600 }}>기간 내 총 이용 건수</p>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#0f2244', margin: 0 }}>{totalCount.toLocaleString()}건</p>
              </div>

              {/* 기능별 사용량 표 */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden' }}>
                {featureLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>로딩 중...</div>
                ) : featureRows.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>데이터가 없습니다.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f7f6f3' }}>
                        {['메뉴', '세부 유형', '건수', '비중'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupOrder.map(group => {
                        const rows = groupMap[group]
                        const groupSum = rows.reduce((s, r) => s + r.count, 0)
                        return rows.map((row, i) => (
                          <tr key={`${group}-${row.label}`} style={{ borderTop: '1px solid #f0ede6' }}>
                            {i === 0 && (
                              <td rowSpan={rows.length + 1} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0f2244', verticalAlign: 'top', borderRight: '1px solid #f0ede6', background: '#faf9f7' }}>
                                {group}
                              </td>
                            )}
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#333' }}>{row.label}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#0f2244' }}>{row.count.toLocaleString()}건</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{totalCount ? Math.round(row.count / totalCount * 100) : 0}%</td>
                          </tr>
                        )).concat([
                          <tr key={`${group}-subtotal`} style={{ borderTop: '1px solid #e8e5dc', background: '#f7f6f3' }}>
                            <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#555' }}>소계</td>
                            <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 800, color: '#0f2244' }}>{groupSum.toLocaleString()}건</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#888' }}>{totalCount ? Math.round(groupSum / totalCount * 100) : 0}%</td>
                          </tr>
                        ])
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )
        })()}


        {/* 결제 내역 탭 */}
        {activeTab === 'payments' && (() => {
          const range = getPaymentRange()
          const fp = range ? payments.filter(p => { const d = new Date(p.created_at); return d >= range.start && d <= range.end }) : payments
          return (
            <div>
              {/* 기간 필터 */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #ece9e1', marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#555', margin: '0 0 12px' }}>기간 선택</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {[{ key: 'today', label: '오늘' }, { key: 'week', label: '이번 주' }, { key: 'month', label: '이번 달' }, { key: 'custom', label: '기간 지정' }].map(p => (
                    <button key={p.key} onClick={() => setPaymentPeriod(p.key as any)}
                      style={{ background: paymentPeriod === p.key ? '#0f2244' : '#f7f6f3', color: paymentPeriod === p.key ? '#fff' : '#555', border: `1px solid ${paymentPeriod === p.key ? '#0f2244' : '#e8e5dc'}`, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {p.label}
                    </button>
                  ))}
                  {paymentPeriod === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <input type="date" value={paymentCustomStart} onChange={e => setPaymentCustomStart(e.target.value)}
                        style={{ border: '1.5px solid #e5e3dc', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                      <span style={{ color: '#888', fontSize: 13 }}>~</span>
                      <input type="date" value={paymentCustomEnd} onChange={e => setPaymentCustomEnd(e.target.value)}
                        style={{ border: '1.5px solid #e5e3dc', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  )}
                </div>
              </div>
              {/* 요약 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                {[
                  { label: '총 결제 건수', value: `${fp.length}건`, color: '#0f2244' },
                  { label: '총 결제 금액', value: `₩${fp.reduce((s: number, p: any) => s + (p.amount || 0), 0).toLocaleString()}`, color: '#10b981' },
                  { label: '총 환불 금액', value: `₩${fp.reduce((s: number, p: any) => s + (p.refund_amount || 0), 0).toLocaleString()}`, color: '#ef4444' },
                  { label: '1회권 결제', value: `${fp.filter((p: any) => p.plan_type === 'plan_1').length}건`, color: '#6366f1' },
                  { label: '5회권 결제', value: `${fp.filter((p: any) => p.plan_type === 'plan_5').length}건`, color: '#e6a800' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #ece9e1' }}>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px', fontWeight: 600 }}>{item.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: item.color, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
              {/* 결제 명단 */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ede6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2244', margin: 0 }}>결제 명단 ({fp.length}건)</h3>
                  <button onClick={loadPayments} style={{ background: '#f7f6f3', color: '#555', border: '1px solid #e8e5dc', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>새로고침</button>
                </div>
                {paymentsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>로딩 중...</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f7f6f3' }}>
                          {['결제일', '이메일', '플랜', '결제 금액', '충전 횟수', '구분', '환불'].map(h => (
                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fp.length === 0 ? (
                          <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>결제 내역이 없습니다.</td></tr>
                        ) : fp.map((p: any, i: number) => (
                          <tr key={p.id} style={{ borderTop: '1px solid #f0ede6', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                              {new Date(p.created_at).toLocaleDateString('ko-KR')} {new Date(p.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#333' }}>{p.profiles?.email || '-'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ background: p.plan_type === 'plan_5' ? '#fffbeb' : '#f0f0ff', color: p.plan_type === 'plan_5' ? '#92400e' : '#3C3489', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                                {p.plan_name || p.plan_type}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: p.refund_amount > 0 ? '#aaa' : '#10b981', textDecoration: p.status === 'refunded' ? 'line-through' : 'none' }}>
                                ₩{(p.amount || 0).toLocaleString()}
                              </div>
                              {p.refund_amount > 0 && (
                                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>-₩{(p.refund_amount).toLocaleString()}</div>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0f2244' }}>{p.credits}회</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ background: p.is_test ? '#fef2f2' : '#ecfdf5', color: p.is_test ? '#991b1b' : '#065f46', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                                {p.is_test ? '테스트' : '실결제'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {p.status === 'refunded' ? (
                                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>환불완료</span>
                              ) : p.status === 'partial_refunded' ? (
                                <span style={{ fontSize: 11, color: '#f97316', fontWeight: 700 }}>부분환불</span>
                              ) : (
                                <button
                                  onClick={() => { setRefundModal(p); setRefundAmount(p.amount); setRefundError('') }}
                                  style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                                >
                                  환불
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* 회원 관리 탭 */}
        {activeTab === 'users' && (
          <div>
            {/* 검색창 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #ece9e1', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <input
                type="text"
                placeholder="이메일 또는 이름으로 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#333', fontFamily: 'inherit', background: 'transparent' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 18, padding: 0 }}>✕</button>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ede6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2244', margin: 0 }}>
                  회원 목록 {searchQuery ? `(검색결과 ${filteredUsers.length}명)` : `(총 ${users.length}명)`}
                </h3>
                <button onClick={loadData} style={{ background: '#f7f6f3', color: '#555', border: '1px solid #e8e5dc', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  새로고침
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f7f6f3' }}>
                      {['이메일', '이름', '가입일', '무료체험', '잔여횟수', '총분석', '잡통+', '역할', '관리'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                          {searchQuery ? '검색 결과가 없습니다.' : '회원이 없습니다.'}
                        </td>
                      </tr>
                    ) : filteredUsers.map((u, i) => (
                      <tr key={u.id} style={{ borderTop: '1px solid #f0ede6', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#333' }}>{u.email || '(없음)'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{u.name || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                          {new Date(u.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: u.free_trial_used ? '#fef2f2' : '#ecfdf5', color: u.free_trial_used ? '#991b1b' : '#065f46', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                            {u.free_trial_used ? '사용함' : '미사용'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: u.paid_credits > 0 ? '#0f2244' : '#aaa' }}>
                          {u.paid_credits || 0}회
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{u.total_analyses || 0}건</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: (u.consistency_credits || 0) > 0 ? '#0f2244' : '#aaa' }}>
                          {u.consistency_credits || 0}회
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: u.role === 'admin' ? '#EEEDFE' : '#f7f6f3', color: u.role === 'admin' ? '#3C3489' : '#888', fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                            {u.role === 'admin' ? 'admin' : 'user'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => { setEditingUser(u); setCreditAmount(u.paid_credits || 0) }}
                            style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            횟수 조정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 환불 모달 */}
      {refundModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f2244', margin: '0 0 4px' }}>환불 처리</h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>{refundModal.profiles?.email}</p>

            <div style={{ background: '#f7f6f3', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#555' }}>
              <div>결제일: <strong>{new Date(refundModal.created_at).toLocaleDateString('ko-KR')}</strong></div>
              <div style={{ marginTop: 4 }}>결제 금액: <strong style={{ color: '#0f2244' }}>₩{(refundModal.amount || 0).toLocaleString()}</strong></div>
              <div style={{ marginTop: 4 }}>플랜: <strong>{refundModal.plan_name || refundModal.plan_type}</strong></div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>환불액 입력</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => setRefundAmount(refundModal.amount)}
                  style={{ flex: 1, background: refundAmount === refundModal.amount ? '#0f2244' : '#f7f6f3', color: refundAmount === refundModal.amount ? '#fff' : '#555', border: '1px solid #ddd', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  전액 환불
                </button>
                <button
                  onClick={() => setRefundAmount(Math.floor(refundModal.amount / 2))}
                  style={{ flex: 1, background: '#f7f6f3', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  50% 환불
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={refundModal.amount}
                value={refundAmount}
                onChange={e => setRefundAmount(parseInt(e.target.value) || 0)}
                style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>최대 환불 가능액: ₩{(refundModal.amount || 0).toLocaleString()}</p>
            </div>

            {refundError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
                {refundError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleRefund}
                disabled={refundLoading}
                style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 14, cursor: refundLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: refundLoading ? 0.7 : 1 }}>
                {refundLoading ? '처리 중...' : `₩${refundAmount.toLocaleString()} 환불`}
              </button>
              <button
                onClick={() => { setRefundModal(null); setRefundAmount(0); setRefundError('') }}
                style={{ flex: 1, background: '#f7f6f3', color: '#555', border: '1px solid #ddd', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 횟수 조정 모달 */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f2244', margin: '0 0 4px' }}>횟수 조정</h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>{editingUser.email}</p>

            <div style={{ background: '#f7f6f3', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#555' }}>
              현재 잔여: <strong style={{ color: '#0f2244' }}>{editingUser.paid_credits || 0}회</strong>
              {' '}/ 무료체험: <strong style={{ color: editingUser.free_trial_used ? '#ef4444' : '#10b981' }}>{editingUser.free_trial_used ? '사용함' : '미사용'}</strong>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>유료 잔여 횟수 설정</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 3, 5, 10].map(n => (
                  <button key={n} onClick={() => setCreditAmount(n)}
                    style={{ flex: 1, background: creditAmount === n ? '#0f2244' : '#f7f6f3', color: creditAmount === n ? '#fff' : '#555', border: '1px solid #ddd', borderRadius: 8, padding: '8px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    {n}회
                  </button>
                ))}
              </div>
              <input type="number" min="0" value={creditAmount} onChange={e => setCreditAmount(parseInt(e.target.value) || 0)}
                style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginTop: 8 }} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button onClick={() => handleUpdateCredits(editingUser.id, creditAmount, false)}
                style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                저장
              </button>
              <button onClick={() => setEditingUser(null)}
                style={{ flex: 1, background: '#f7f6f3', color: '#555', border: '1px solid #ddd', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
            </div>

            {editingUser.free_trial_used && (
              <button onClick={() => handleUpdateCredits(editingUser.id, creditAmount, true)}
                style={{ width: '100%', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: 10, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                + 무료체험도 함께 초기화
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
