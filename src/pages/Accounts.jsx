// src/pages/Accounts.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Accounts() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Fetch all applications which contain user info
    supabase
      .from('applications')
      .select('user_id, full_name, institution, field_of_study, score, bursaries, updated_at, results_url, avg')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setUsers(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.institution?.toLowerCase().includes(search.toLowerCase())
  )

  const total = users.length
  const verified = users.filter(u => u.results_url).length
  const premium = 0 // will populate when payments are added

  return (
    <div style={{ padding: '40px 48px', maxWidth: 960 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Registered Accounts</h1>
        <p className="muted" style={{ fontSize: 14 }}>All students who have submitted applications.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Registered', value: total, color: 'var(--text)', icon: '👥' },
          { label: 'Docs Uploaded (Verified)', value: verified, color: 'var(--green)', icon: '✅' },
          { label: 'Premium Members', value: premium, color: 'var(--gold)', icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px', margin: 0 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'Space Grotesk', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <input placeholder="Search by name or institution…" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} /> Loading accounts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No accounts yet</h3>
          <p>Students who complete applications will appear here.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--dark-3)' }}>
                {['Student', 'Institution', 'Field', 'Avg %', 'Score', 'Docs', 'Last Active'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11,
                    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px',
                    borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.user_id || i}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, fontFamily: 'Space Grotesk' }}>{u.full_name || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>{u.institution || '—'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>{u.field_of_study || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: u.avg >= 70 ? 'var(--green)' : u.avg >= 50 ? 'var(--gold)' : 'var(--red)', fontWeight: 600 }}>
                      {u.avg || '—'}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: u.score >= 65 ? 'var(--green)' : 'var(--muted)', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                      {u.score || 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {u.results_url
                      ? <span className="tag tag-green">✓ Uploaded</span>
                      : <span className="tag tag-red">None</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: 12 }}>
                    {u.updated_at ? new Date(u.updated_at).toLocaleDateString('en-ZA') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Premium coming soon */}
      <div className="alert alert-warn" style={{ marginTop: 24, fontSize: 13 }}>
        ⭐ <strong>Premium subscriptions coming soon</strong> — R150/month for priority shortlisting, application review feedback, and direct bursary office submission. The Premium column will populate once payments are live.
      </div>
    </div>
  )
}
