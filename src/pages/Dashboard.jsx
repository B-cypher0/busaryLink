// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../lib/supabase'
import { isAdmin } from '../components/Layout'

const STUDENT_HIGHLIGHTS = [
  { icon: '♟️', category: 'Chess',     name: 'Kagiso Sithole',    school: 'St Johns College, JHB',    achievement: 'National U18 Chess Champion 2024' },
  { icon: '🎤', category: 'Speech',    name: 'Amahle Dube',       school: 'UKZN',                      achievement: '1st Place Pan-African Debate League' },
  { icon: '📐', category: 'Maths',     name: 'Siphamandla Moyo',  school: 'Pretoria Boys High',        achievement: 'SA Mathematics Olympiad Gold 2024' },
  { icon: '⚛️', category: 'Physics',   name: 'Lerato Nkosi',      school: 'Wits University',           achievement: 'IPhO International Physics Olympiad Top 10' },
  { icon: '💻', category: 'Coding',    name: 'Thabo Mahlangu',    school: 'Cape Town High School',     achievement: 'Google Code-In Africa Finalist' },
  { icon: '🔬', category: 'Science',   name: 'Nandi Zulu',        school: 'DUT',                       achievement: 'Best Young Researcher — SA Science Expo' },
  { icon: '📖', category: 'Academic',  name: 'Precious Molefe',   school: 'Free State University',     achievement: 'Top NSFAS Scholar — 4.0 GPA 3 years running' },
  { icon: '🏆', category: 'Sport',     name: 'Siya Kolisi Jr',    school: 'Hilton College',            achievement: 'SA Schools Rugby Player of the Year' },
]

function HighlightTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % STUDENT_HIGHLIGHTS.length); setVisible(true) }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const h = STUDENT_HIGHLIGHTS[idx]
  const CAT_COLORS = { Chess:'var(--purple)', Speech:'var(--blue)', Maths:'var(--gold)', Physics:'var(--green)', Coding:'#26C6DA', Science:'#FF7043', Academic:'var(--gold)', Sport:'var(--green)' }
  const col = CAT_COLORS[h.category] || 'var(--gold)'

  return (
    <div style={{ background:'var(--dark-2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 20px', marginBottom:28, overflow:'hidden' }}>
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:10 }}>
        🏅 Top Students — South Africa
      </div>
      <div style={{ opacity: visible ? 1 : 0, transition:'opacity 0.4s', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ fontSize:32 }}>{h.icon}</div>
        <div style={{ flex:1, minWidth:180 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:16 }}>{h.name}</span>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:`${col}18`, color:col, fontWeight:700, border:`1px solid ${col}30` }}>{h.category}</span>
          </div>
          <div style={{ fontSize:13, color:'var(--gold)', fontWeight:500, marginBottom:2 }}>{h.achievement}</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>{h.school}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {STUDENT_HIGHLIGHTS.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width:6, height:6, borderRadius:'50%', background: i===idx ? col : 'var(--border)', cursor:'pointer', transition:'background 0.3s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [app, setApp] = useState(null)
  const admin = isAdmin(session)
  const name = session?.user?.user_metadata?.full_name || 'Student'

  useEffect(() => {
    getMyApplication().then(d => setApp(d)).catch(() => {})
  }, [])

  const score = app?.score || 0
  const scoreColor = score >= 75 ? 'var(--green)' : score >= 55 ? 'var(--gold)' : 'var(--red)'

  const STUDENT_ACTIONS = [
    { icon:'✦', title: app ? 'Update Application' : 'Start Application', desc:'Fill in your details and get your eligibility score instantly', path:'/apply', cta: app ? 'Update' : 'Start now' },
    { icon:'◈', title:'Career Match', desc:'See which careers fit your marks — only 75%+ matches shown', path:'/career', cta:'Explore' },
    { icon:'◉', title:'News Feed', desc:'Bursaries, research, sport, technology — all categories', path:'/news', cta:'Read now' },
    { icon:'📚', title:'StudentHub', desc:'Track your university modules and semester results', path:'/studenthub', cta:'Open Hub' },
  ]

  return (
    <div className="page-wrap">
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:4 }}>Welcome back,</div>
        <h1 style={{ fontSize:28, fontWeight:700 }}>{name} {admin && <span style={{ fontSize:14, color:'var(--purple)', fontWeight:500 }}>· Admin</span>}</h1>
      </div>

      {/* Top Students Ticker */}
      <HighlightTicker />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }} className="stats-grid">
        {[
          { label:'Eligibility Score', value: app ? `${score}/100` : '—', color: scoreColor, sub: app ? (score>=65?'Top contender ✓':'Keep improving') : 'Submit application first' },
          { label:'Matched Bursaries', value: app ? (app.bursaries?.length||0) : '—', color:'var(--blue)', sub: app?.bursaries?.slice(0,2).join(', ') || 'Complete application first' },
          { label:'Application Status', value: app ? 'Submitted ✓' : 'Pending', color: app?'var(--green)':'var(--gold)', sub: app ? `Updated ${new Date(app.updated_at).toLocaleDateString('en-ZA')}` : 'Not submitted yet' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'18px 20px', margin:0 }}>
            <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:700, fontFamily:'Space Grotesk', color:s.color, marginBottom:4 }}>{s.value}</div>
            {app && s.label==='Eligibility Score' && <div className="progress-bar" style={{ marginBottom:6 }}><div className="progress-fill" style={{ width:`${score}%` }} /></div>}
            <div style={{ fontSize:12, color:'var(--muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions — student only, no admin review */}
      <h2 style={{ fontSize:16, marginBottom:14 }}>Quick Actions</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:28 }}>
        {STUDENT_ACTIONS.map(a => (
          <div key={a.title} className="card" style={{ cursor:'pointer', transition:'border-color 0.15s', margin:0 }}
            onClick={() => navigate(a.path)}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{ fontSize:22, marginBottom:10 }}>{a.icon}</div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:600, marginBottom:6 }}>{a.title}</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:14, lineHeight:1.5 }}>{a.desc}</div>
            <span className="tag tag-gold">{a.cta} →</span>
          </div>
        ))}
      </div>

      <div className="alert alert-warn" style={{ fontSize:13 }}>
        💡 Upload your official results document in the Application tab to strengthen your profile with bursary offices.
      </div>
    </div>
  )
}
