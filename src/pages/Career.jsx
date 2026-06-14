// src/pages/Career.jsx
import { useState, useEffect } from 'react'
import { getMyApplication } from '../lib/supabase'
import { careerMatches } from '../lib/scoring'

export default function Career() {
  const [subjects, setSubjects] = useState({ math: '', science: '', english: '', accounting: '', biology: '' })
  const [matches, setMatches] = useState(null)
  const [aiInsight, setAiInsight] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    getMyApplication().then(app => {
      if (app) {
        setSubjects({
          math: app.s_math || '',
          science: app.s_science || '',
          english: app.s_english || '',
          accounting: app.s_accounting || '',
          biology: app.s_biology || '',
        })
        setPrefilled(true)
      }
    }).catch(() => {})
  }, [])

  const set = (k, v) => setSubjects(s => ({ ...s, [k]: v }))

  const runMatch = () => {
    const results = careerMatches(subjects)
    setMatches(results)
    if (results.length > 0) fetchAiInsight(results)
  }

  const fetchAiInsight = async (results) => {
    setAiLoading(true); setAiInsight(null)
    const topCareers = results.slice(0, 3).map(r => `${r.career} (${r.pct}%)`).join(', ')
    const prompt = `A South African student has the following subject results:
- Mathematics: ${subjects.math || 'N/A'}%
- Physical Sciences: ${subjects.science || 'N/A'}%
- English: ${subjects.english || 'N/A'}%
- Accounting: ${subjects.accounting || 'N/A'}%
- Life Sciences: ${subjects.biology || 'N/A'}%

Their top career matches are: ${topCareers}

In 3 short paragraphs, give them:
1. A brief commentary on why these careers suit their profile
2. What South African universities offer the best programmes for their top match (be specific — name real SA universities)
3. One practical piece of advice to improve their competitiveness for a bursary in this field

Keep it encouraging, specific to South Africa, and under 200 words.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.map(b => b.text || '').join('\n') || ''
      setAiInsight(text)
    } catch { setAiInsight('Could not load AI insight. Your career matches above are still valid.') }
    setAiLoading(false)
  }

  const SUBJECT_FIELDS = [
    { k: 'math', label: 'Mathematics' },
    { k: 'science', label: 'Physical Sciences' },
    { k: 'english', label: 'English' },
    { k: 'accounting', label: 'Accounting' },
    { k: 'biology', label: 'Life Sciences' },
  ]

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>AI Career Match</h1>
        <p className="muted" style={{ fontSize: 14 }}>Only careers with 75%+ match are shown — no false hope, just real options.</p>
      </div>

      {prefilled && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          ✦ Your marks were pre-filled from your application. Adjust them below if needed.
        </div>
      )}

      {/* Subject inputs */}
      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 20 }}>Your Subject Marks</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {SUBJECT_FIELDS.map(f => {
            const val = parseInt(subjects[f.k]) || 0
            const color = val >= 75 ? 'var(--green)' : val >= 50 ? 'var(--gold)' : val > 0 ? 'var(--red)' : 'var(--muted)'
            return (
              <div key={f.k} style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{f.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Grotesk', color, textAlign: 'center', margin: '6px 0' }}>
                  {val || '—'}
                </div>
                <input type="range" min="0" max="100" value={val}
                  onChange={e => set(f.k, e.target.value)}
                  style={{ width: '100%' }} />
              </div>
            )
          })}
        </div>
        <button className="btn btn-gold" style={{ marginTop: 20 }} onClick={runMatch}>
          Show My Career Matches
        </button>
      </div>

      {/* Results */}
      {matches !== null && (
        <>
          {matches.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="icon">📊</div>
                <h3>No 75%+ matches yet</h3>
                <p>Your current marks don't reach the 75% threshold for any career. Focus on improving Maths and Sciences — that unlocks the most options.</p>
              </div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 16, marginBottom: 16 }}>Your Career Matches ({matches.length})</h2>
              {matches.map((m, i) => {
                const barColor = m.pct >= 90 ? 'var(--green)' : m.pct >= 80 ? 'var(--gold)' : 'var(--blue)'
                return (
                  <div key={m.career} className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17 }}>{m.career}</span>
                          {i === 0 && <span className="tag tag-gold">Best Match</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>{m.reason}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {m.bursaries.map(b => <span key={b} className="tag tag-blue">{b}</span>)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Space Grotesk', color: barColor }}>{m.pct}%</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>match</div>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ marginTop: 14 }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${m.pct}%`, background: barColor, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <span className="tag tag-purple" style={{ fontSize: 11 }}>Field: {m.field}</span>
                    </div>
                  </div>
                )
              })}

              {/* AI Insight */}
              <div className="ai-panel" style={{ marginTop: 8 }}>
                <div className="ai-header">
                  <div className="ai-dot" />
                  <div className="ai-title">AI Career Advisor</div>
                </div>
                <div className="ai-body">
                  {aiLoading ? (
                    <span className="muted">Analysing your profile and generating personalised advice…</span>
                  ) : aiInsight ? (
                    aiInsight.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
                  ) : null}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
