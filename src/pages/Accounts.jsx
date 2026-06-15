// src/pages/Accounts.jsx
import { useState, useEffect } from 'react'

export default function Accounts() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | applied | no-application
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/get-users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data)
        else setError('Could not load users. Make sure SUPABASE_SERVICE_ROLE_KEY is set in Netlify.')
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filtered = users
    .filter(u => {
      if (filter === 'applied') return u.has_application
      if (filter === 'no-application') return !u.has_application
      return true
    })
    .filter(u => {
      if (!search) return true
      const s = search.toLowerCase()
      return (
        u.email?.toLowerCase().includes(s) ||
        u.full_name?.toLowerCase().includes(s) ||
        u.application?.institution?.toLowerCase().includes(s)
      )
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const total = users.length
  const applied = users.filter(u => u.has_application).length
  const noApp = users.filter(u => !u.has_application).length
  const verified = users.filter(u => u.application?.results_url).length

  function timeAgo(dateStr) {
    if (!dateStr) return '—'
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString('en-ZA')
  }

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Registered Accounts</h1>
        <p className="muted" style={{ fontSize: 14 }}>All students who have signed up — with or without an application.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          ⚠️ {error}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Go to Netlify → Site configuration → Environment variables → add <strong>SUPABASE_SERVICE_ROLE_KEY</strong>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Registered', value: total, color: 'var(--text)', icon: '👥', f: 'all' },
          { label: 'With Application', value: applied, color: 'var(--green)', icon: '✦', f: 'applied' },
          { label: 'No Application Yet', value: noApp, color: 'var(--gold)', icon: '⏳', f: 'no-application' },
          { label: 'Docs Verified', value: verified, color: 'var(--blue)', icon: '📄', f: 'applied' },
        ].map(s => (
          <div key={s.label} className="card"
            style={{ padding: '18px 20px', margin: 0, cursor: 'pointer', transition: 'border-color 0.15s',
              borderColor: filter === s.f && s.f !== 'all' ? s.color : 'var(--border)' }}
            onClick={() => setFilter(filter === s.f ? 'all' : s.f)}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = filter === s.f ? s.color : 'var(--border)'}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Grotesk', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Search by name, email or institution…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }} />
        {['all', 'applied', 'no-application'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'applied' ? 'Applied' : 'No Application'}
          </button>
        ))}
      </div>

      {/* User list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} /> Loading accounts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No accounts found</h3>
          <p>No students match your current filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(u => (
            <div key={u.id}
              style={{
                background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 10,
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                flexWrap: 'wrap', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onClick={() => setSelected(u)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: u.has_application ? 'var(--gold-dim)' : 'var(--dark-3)',
                border: `2px solid ${u.has_application ? 'var(--gold)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--gold)',
              }}>
                {(u.full_name || u.email || '?')[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, marginBottom: 3 }}>
                  {u.full_name || <span style={{ color: 'var(--muted)' }}>No name yet</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
              </div>

              {/* Application status */}
              <div style={{ minWidth: 120 }}>
                {u.has_application ? (
                  <div>
                    <span className="tag tag-green" style={{ marginBottom: 4, display: 'inline-block' }}>✦ Application submitted</span>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      {u.application?.institution || '—'} · {u.application?.field_of_study?.split(' ')[0] || '—'}
                    </div>
                  </div>
                ) : (
                  <span className="tag tag-gold">⏳ Registered only</span>
                )}
              </div>

              {/* Score */}
              {u.has_application && (
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{
                    fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk',
                    color: u.application.score >= 65 ? 'var(--green)' : u.application.score >= 45 ? 'var(--gold)' : 'var(--red)'
                  }}>
                    {u.application.score}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>score</div>
                </div>
              )}

              {/* Joined */}
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', minWidth: 70 }}>
                <div>Joined</div>
                <div style={{ color: 'var(--text)', fontWeight: 500 }}>{timeAgo(u.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24,
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--border)', borderRadius: 16,
            padding: 32, maxWidth: 520, width: '100%', maxHeight: '85vh', overflow: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, marginBottom: 4 }}>{selected.full_name || 'No name'}</h2>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.email}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Account info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                ['Joined', timeAgo(selected.created_at)],
                ['Last Sign In', timeAgo(selected.last_sign_in)],
                ['Account ID', selected.id?.slice(0, 8) + '…'],
                ['Status', selected.has_application ? 'Applied' : 'Registered only'],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--dark-3)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{l}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Application details */}
            {selected.has_application ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12, fontWeight: 600 }}>
                  Application Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['Institution', selected.application.institution],
                    ['Field', selected.application.field_of_study],
                    ['Average', (selected.application.avg || '—') + '%'],
                    ['Score', (selected.application.score || 0) + '/100'],
                    ['Province', selected.application.province],
                    ['Results Doc', selected.application.results_url ? '✓ Uploaded' : 'Not uploaded'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: 'var(--dark-3)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{l}</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
                {selected.application.bursaries?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Matched Bursaries</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selected.application.bursaries.map(b => <span key={b} className="tag tag-blue">{b}</span>)}
                    </div>
                  </div>
                )}
                {selected.application.results_url && (
                  <a href={selected.application.results_url} target="_blank" rel="noreferrer"
                    className="btn btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>
                    📄 View Results Document
                  </a>
                )}
              </>
            ) : (
              <div className="alert alert-warn">
                This student has registered but hasn't submitted an application yet.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="alert alert-warn" style={{ marginTop: 24, fontSize: 13 }}>
        ⭐ <strong>Premium subscriptions coming soon</strong> — R150/month for priority shortlisting and direct bursary office submission.
      </div>
    </div>
  )
}
