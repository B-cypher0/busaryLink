// src/pages/News.jsx
import { useState, useEffect } from 'react'

const CATEGORIES = [
  { key: 'bursaries',  icon: '🎓', label: 'Bursaries',   color: 'var(--gold)' },
  { key: 'university', icon: '🏛️', label: 'University',  color: 'var(--blue)' },
  { key: 'career',     icon: '💼', label: 'Careers',     color: 'var(--green)' },
  { key: 'research',   icon: '🔬', label: 'Research',    color: 'var(--purple)' },
  { key: 'sport',      icon: '⚽', label: 'Sport',       color: '#FF7043' },
  { key: 'technology', icon: '⚡', label: 'Technology',  color: '#26C6DA' },
]

function timeAgo(dateStr) {
  try {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch { return '' }
}

export default function News() {
  const [active, setActive] = useState('bursaries')
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState({})
  const [aiLoading, setAiLoading] = useState(false)

  const cat = CATEGORIES.find(c => c.key === active)

  useEffect(() => { loadCategory(active) }, [active])

  const loadCategory = async (key) => {
    if (items[key]) return // cached
    setLoading(true)
    try {
      // In production this hits /.netlify/functions/rss?feed=<key>
      // In dev we use the same endpoint via Vite proxy or direct Netlify Dev
      const res = await fetch(`/api/rss?feed=${key}`)
      const data = await res.json()
      setItems(prev => ({ ...prev, [key]: data }))
    } catch {
      setItems(prev => ({ ...prev, [key]: [] }))
    }
    setLoading(false)
  }

  const summariseWithAI = async () => {
    if (aiSummary[active]) return
    const feed = items[active] || []
    if (feed.length === 0) return
    setAiLoading(true)
    const headlines = feed.slice(0, 6).map(i => `- ${i.title}`).join('\n')
    const prompt = `You are a helpful assistant for South African university students. Here are the latest ${cat.label} headlines:\n\n${headlines}\n\nIn 3-4 sentences, give students a quick "what you need to know" summary of these headlines. Focus on what's actionable or important for a student. Be concise and direct.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.map(b => b.text || '').join('') || ''
      setAiSummary(prev => ({ ...prev, [active]: text }))
    } catch { setAiSummary(prev => ({ ...prev, [active]: 'Could not load summary.' })) }
    setAiLoading(false)
  }

  const feed = items[active] || []

  return (
    <div style={{ padding: '40px 48px', maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>News Feed</h1>
        <p className="muted" style={{ fontSize: 14 }}>Live updates across bursaries, university, career, research, sport and technology.</p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setActive(c.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 20, border: '1px solid',
              borderColor: active === c.key ? c.color : 'var(--border)',
              background: active === c.key ? `${c.color}18` : 'var(--dark-2)',
              color: active === c.key ? c.color : 'var(--muted)',
              fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {/* AI Summary for this category */}
      <div className="ai-panel" style={{ marginBottom: 24 }}>
        <div className="ai-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ai-dot" />
            <div className="ai-title">{cat.icon} AI Summary — {cat.label}</div>
          </div>
          {!aiSummary[active] && (
            <button className="btn btn-outline btn-sm" onClick={summariseWithAI} disabled={aiLoading || feed.length === 0}>
              {aiLoading ? 'Summarising…' : 'Summarise'}
            </button>
          )}
        </div>
        <div className="ai-body">
          {aiSummary[active] ? (
            <p>{aiSummary[active]}</p>
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>
              {feed.length > 0 ? `Click "Summarise" to get an AI overview of today's ${cat.label.toLowerCase()} news.` : 'Loading news…'}
            </span>
          )}
        </div>
      </div>

      {/* News cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Loading {cat.label} news…
        </div>
      ) : feed.length === 0 ? (
        <div className="empty-state">
          <div className="icon">{cat.icon}</div>
          <h3>No news loaded</h3>
          <p>Check your internet connection or try refreshing. RSS feeds update every 15 minutes.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {feed.map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none', display: 'block' }}>
              <div className="card" style={{ padding: '18px 22px', margin: 0, transition: 'border-color 0.15s, transform 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        background: `${cat.color}15`, color: cat.color,
                        fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                      }}>{item.source || cat.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{timeAgo(item.pubDate)}</span>
                    </div>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.4, color: 'var(--text)' }}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                        {item.description.substring(0, 160)}{item.description.length > 160 ? '…' : ''}
                      </p>
                    )}
                  </div>
                  <span style={{ color: cat.color, fontSize: 18, flexShrink: 0 }}>→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        News refreshes every 15 minutes. Sources include NSFAS, UKZN, NRF, Sport24, Careers24 and more.
      </div>
    </div>
  )
}
