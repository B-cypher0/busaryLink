// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../lib/supabase'

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const name = session?.user?.user_metadata?.full_name || 'Student'

  useEffect(() => {
    getMyApplication().then(d => setApp(d)).catch(() => {})
  }, [])

  const score = app?.score || 0
  const scoreClass = score >= 75 ? 'green' : score >= 55 ? 'gold' : 'red'

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      {/* Greeting */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Welcome back,</div>
        <h1 style={{ fontSize: 30, fontWeight: 700 }}>{name}</h1>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Eligibility Score', value: app ? `${score}/100` : '—', color: scoreClass, sub: app ? (score >= 65 ? 'Top contender ✓' : 'Keep improving') : 'Apply to get scored' },
          { label: 'Matched Bursaries', value: app ? (app.bursaries?.length || 0) : '—', color: 'blue', sub: app?.bursaries?.join(', ') || 'Submit application first' },
          { label: 'Application Status', value: app ? 'Submitted' : 'Pending', color: app ? 'green' : 'gold', sub: app ? `Updated ${new Date(app.updated_at).toLocaleDateString('en-ZA')}` : 'Complete your profile' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: `var(--${s.color})`, marginBottom: 6 }}>{s.value}</div>
            {app && s.label === 'Eligibility Score' && (
              <div className="progress-bar" style={{ marginBottom: 8 }}>
                <div className="progress-fill" style={{ width: `${score}%` }} />
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: 16, marginBottom: 16 }}>Quick actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { icon: '✦', title: app ? 'Update Application' : 'Start Application', desc: 'Upload results, fill personal details, get scored', path: '/apply', cta: app ? 'Update' : 'Start now' },
          { icon: '◈', title: 'AI Career Match', desc: 'See which careers fit your marks (75%+ matches only)', path: '/career', cta: 'Explore careers' },
          { icon: '◉', title: 'News Feed', desc: 'Bursaries, research, sport, technology — all in one place', path: '/news', cta: 'Read news' },
          { icon: '▣', title: 'Admin Review', desc: 'Shortlist top applicants and export for the bursary office', path: '/review', cta: 'Open review' },
        ].map(a => (
          <div key={a.title} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
            onClick={() => navigate(a.path)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 22, marginBottom: 10 }}>{a.icon}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, marginBottom: 6 }}>{a.title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>{a.desc}</div>
            <span className="tag tag-gold">{a.cta} →</span>
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="alert alert-warn" style={{ fontSize: 13 }}>
        💡 <strong>Tip:</strong> Uploading your official results document improves your credibility with bursary offices. Go to Application → Upload Results.
      </div>
    </div>
  )
}
