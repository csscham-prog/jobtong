'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats')
  const [editingUser, setEditingUser] = useState<any>(null)
  const [creditAmount, setCreditAmount] = useState(0)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profileData || profileData.role !== 'admin') {
      window.location.href = '/'
      return
    }

    setUser(session.user)
    setProfile(profileData)
    await loadData()
    setLoading(false)
  }

  const loadData = async () => {
    // 전체 회원 목록
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersData) setUsers(usersData)

    // 통계
    const total = usersData?.length || 0
    const trialUsed = usersData?.filter(u => u.free_trial_used).length || 0
    const paidUsers = usersData?.filter(u => u.paid_credits > 0).length || 0
    const totalAnalyses = usersData?.reduce((sum, u) => sum + (u.total_analyses || 0), 0) || 0

    setStats({ total, trialUsed, paidUsers, totalAnalyses })
  }

  const handleUpdateCredits = async (userId: string, newCredits: number, resetTrial: boolean) => {
    await supabase
      .from('profiles')
      .update({
        paid_credits: newCredits,
        ...(resetTrial ? { free_trial_used: false } : {}),
      })
      .eq('id', userId)
    await loadData()
    setEditingUser(null)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{profile?.email}</span>
          <button onClick={() => window.location.href = '/'} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            사이트 보기
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ background: 'none', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            로그아웃
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[
            { key: 'stats', label: '📊 통계' },
            { key: 'users', label: '👥 회원 관리' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{ background: activeTab === tab.key ? '#0f2244' : '#fff', color: activeTab === tab.key ? '#fff' : '#555', border: '1px solid #e8e5dc', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 통계 탭 */}
        {activeTab === 'stats' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: '총 회원 수', value: `${stats.total}명`, color: '#0f2244' },
                { label: '무료체험 사용', value: `${stats.trialUsed}명`, color: '#e6a800' },
                { label: '유료 사용자', value: `${stats.paidUsers}명`, color: '#10b981' },
                { label: '총 분석 건수', value: `${stats.totalAnalyses}건`, color: '#6366f1' },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #ece9e1' }}>
                  <p style={{ fontSize: 13, color: '#888', margin: '0 0 8px' }}>{item.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, color: item.color, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #ece9e1' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2244', margin: '0 0 16px' }}>전환율 분석</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#555' }}>무료체험 전환율</span>
                    <span style={{ fontWeight: 600 }}>{stats.total ? Math.round(stats.trialUsed / stats.total * 100) : 0}%</span>
                  </div>
                  <div style={{ height: 8, background: '#f0ede6', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${stats.total ? stats.trialUsed / stats.total * 100 : 0}%`, background: '#e6a800', borderRadius: 4 }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#555' }}>유료 전환율</span>
                    <span style={{ fontWeight: 600 }}>{stats.total ? Math.round(stats.paidUsers / stats.total * 100) : 0}%</span>
                  </div>
                  <div style={{ height: 8, background: '#f0ede6', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${stats.total ? stats.paidUsers / stats.total * 100 : 0}%`, background: '#10b981', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 회원 관리 탭 */}
        {activeTab === 'users' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ece9e1', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0ede6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2244', margin: 0 }}>전체 회원 ({users.length}명)</h3>
              <button onClick={loadData} style={{ background: '#f7f6f3', color: '#555', border: '1px solid #e8e5dc', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                새로고침
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f6f3' }}>
                    {['이메일', '가입일', '무료체험', '잔여횟수', '총분석', '역할', '관리'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderTop: '1px solid #f0ede6', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#333' }}>{u.email || '(이메일 없음)'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>
                        {new Date(u.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: u.free_trial_used ? '#fef2f2' : '#ecfdf5', color: u.free_trial_used ? '#991b1b' : '#065f46', fontSize: 12, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                          {u.free_trial_used ? '사용함' : '미사용'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: u.paid_credits > 0 ? '#0f2244' : '#aaa' }}>
                        {u.paid_credits || 0}회
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{u.total_analyses || 0}건</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: u.role === 'admin' ? '#EEEDFE' : '#f7f6f3', color: u.role === 'admin' ? '#3C3489' : '#888', fontSize: 12, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                          {u.role === 'admin' ? 'admin' : 'user'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => { setEditingUser(u); setCreditAmount(u.paid_credits || 0) }}
                          style={{ background: '#0f2244', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                        >
                          횟수 조정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 횟수 조정 모달 */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f2244', margin: '0 0 6px' }}>횟수 조정</h3>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 24px' }}>{editingUser.email}</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>유료 잔여 횟수</label>
              <input
                type="number"
                min="0"
                value={creditAmount}
                onChange={e => setCreditAmount(parseInt(e.target.value) || 0)}
                style={{ width: '100%', border: '1.5px solid #e5e3dc', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => handleUpdateCredits(editingUser.id, creditAmount, false)}
                style={{ flex: 1, background: '#0f2244', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                저장
              </button>
              <button
                onClick={() => setEditingUser(null)}
                style={{ flex: 1, background: '#f7f6f3', color: '#555', border: '1px solid #ddd', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                취소
              </button>
            </div>

            {editingUser.free_trial_used && (
              <button
                onClick={() => handleUpdateCredits(editingUser.id, creditAmount, true)}
                style={{ width: '100%', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', borderRadius: 10, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                무료체험 횟수도 초기화
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
