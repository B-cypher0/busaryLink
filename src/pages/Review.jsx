// src/pages/Review.jsx
import { useState, useEffect } from 'react'
import { getAllApplications } from '../lib/supabase'

export default function Review() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    getAllApplications().then(d => { setApps(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const list = apps
    .filter(a => filter === 'top' ? a.score >= 65 : true)
    .sort((a, b) => (b.score || 0) - (a.score || 0))

  const exportCSV = () => {
    const top = apps.filter(a => a.score >= 65).sort((a, b) => b.score - a.score)
    if (!top.length) { alert('No top contenders to export.'); return }
    const headers = ['Rank','Name','Email','Institution','Field','Average%','Score','Matched Bursaries','Province','Updated']
    const rows = top.map((a, i) => [
      i + 1, a.full_name, a.phone, a.institution, a.field_of_study,
      a.avg, a.score, (a.bursaries || []).join(' | '), a.province,
      new Date(a.updated_at).toLocaleDateString('en-ZA'),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url; el.download = `BursaryLink_Shortlist_${new Date().toISOString().slice(0, 10)}.csv`
    el.click()
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 6 }}>Admin Review</h1>
          <p className="muted" style={{ fontSize: 14 }}>All applications ranked by eligibility score. Export top contenders for the bursary office.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['all', 'top'].map(f => (
            <button key={f} className={`btn btn-${filter === f ? 'gold' : 'outline'} btn-sm`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${apps.length})` : `Top Contenders (${apps.filter(a => a.score >= 65).length})`}
            </button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>

      {/* Summary stats */}
      {apps.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Applications', val: apps.length, color: 'var(--text)' },
            { label: 'Top Contenders (65+)', val: apps.filter(a => a.score >= 65).length, color: 'var(--green)' },
            { label: 'Average Score', val: Math.round(apps.reduce((s, a) => s + (a.score || 0), 0) / apps.length), color: 'var(--gold)' },
            { label: 'With Results Doc', val: apps.filter(a => a.results_url).length, color: 'var(--blue)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 18px', margin: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} /> Loading applications…
        </div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>{filter === 'top' ? 'No top contenders yet' : 'No applications submitted yet'}</h3>
          <p>Applications will appear here once students submit their forms.</p>
        </div>
      ) : (
        list.map((a, i) => {
          const sc = a.score || 0
          const scoreColor = sc >= 75 ? 'var(--green)' : sc >= 55 ? 'var(--gold)' : 'var(--red)'
          const rank = i + 1
          return (
            <div key={a.id || i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px', background: 'var(--dark-2)', border: '1px solid var(--border)',
              borderRadius: 10, marginBottom: 10, flexWrap: 'wrap', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ width: 32, textAlign: 'center', fontSize: 16, flexShrink: 0 }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : <span style={{ color: 'var(--muted)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>#{rank}</span>}
              </div>

              {/* Score circle */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${scoreColor}`, background: `${scoreColor}15`,
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: scoreColor, flexShrink: 0,
              }}>{sc}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
                  {a.full_name || 'Unknown'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {a.institution || '—'} · {a.field_of_study || '—'} · Avg: {a.avg || '?'}% · {a.province || '—'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {sc >= 65
                    ? <span className="tag tag-green">✓ Top Contender</span>
                    : <span className="tag tag-red">Below threshold</span>}
                  {(a.bursaries || []).map(b => <span key={b} className="tag tag-blue">{b}</span>)}
                  {a.results_url && <span className="tag tag-purple">📄 Doc uploaded</span>}
                </div>
              </div>

              {/* Progress */}
              <div style={{ minWidth: 100, textAlign: 'right' }}>
                <div className="progress-bar" style={{ width: 100 }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${sc}%`, background: scoreColor, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sc}/100</div>
              </div>

              <button className="btn btn-outline btn-sm" onClick={() => setDetail(a)}>View</button>
            </div>
          )
        })
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
        }} onClick={() => setDetail(null)}>
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 16,
            padding: 32, maxWidth: 560, width: '100%', maxHeight: '80vh', overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20 }}>{detail.full_name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              {[
                ['Score', detail.score + '/100'],
                ['Average', (detail.avg || '—') + '%'],
                ['Institution', detail.institution || '—'],
                ['Field', detail.field_of_study || '—'],
                ['Province', detail.province || '—'],
                ['Income/mo', detail.monthly_income ? `R${detail.monthly_income}` : '—'],
                ['Phone', detail.phone || '—'],
                ['Maths', (detail.s_math || '—') + '%'],
                ['Science', (detail.s_science || '—') + '%'],
                ['English', (detail.s_english || '—') + '%'],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--dark-3)', borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2, textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            {detail.statement && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>Statement</div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>{detail.statement}</p>
              </div>
            )}
            {detail.results_url && (
              <a href={detail.results_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>
                📄 View Results Document
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
