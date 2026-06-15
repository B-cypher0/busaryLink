// src/pages/Analytics.jsx
import { useState, useEffect } from 'react'
import { getAllApplications } from '../lib/supabase'

function Bar({ label, value, max, color = 'var(--gold)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
        <span style={{ color:'var(--text)' }}>{label}</span>
        <span style={{ color, fontWeight:700, fontFamily:'Space Grotesk' }}>{value}</span>
      </div>
      <div className="progress-bar">
        <div style={{ height:'100%', borderRadius:3, width:`${pct}%`, background:color, transition:'width 1s ease' }} />
      </div>
    </div>
  )
}

export default function Analytics() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllApplications().then(d => { setApps(d || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center' }}>
      <div className="spinner" style={{ margin:'0 auto 16px' }} />
      <p className="muted">Loading analytics…</p>
    </div>
  )

  if (apps.length === 0) return (
    <div className="page-wrap">
      <h1 style={{ marginBottom:8 }}>Analytics</h1>
      <div className="empty-state"><div className="icon">📊</div><h3>No data yet</h3><p>Analytics will populate as students submit applications.</p></div>
    </div>
  )

  // Compute stats
  const total = apps.length
  const topContenders = apps.filter(a => a.score >= 65).length
  const avgScore = Math.round(apps.reduce((s,a) => s + (a.score||0), 0) / total)
  const withDocs = apps.filter(a => a.results_url).length

  const byField = {}
  const byProvince = {}
  const byScore = { '80-100':0, '65-79':0, '50-64':0, 'Below 50':0 }
  const byGender = {}
  const byBursary = {}

  apps.forEach(a => {
    const f = a.field_of_study || 'Unknown'
    byField[f] = (byField[f]||0) + 1
    const p = a.province || 'Unknown'
    byProvince[p] = (byProvince[p]||0) + 1
    const sc = a.score || 0
    if (sc >= 80) byScore['80-100']++
    else if (sc >= 65) byScore['65-79']++
    else if (sc >= 50) byScore['50-64']++
    else byScore['Below 50']++
    const g = a.gender || 'Unknown'
    byGender[g] = (byGender[g]||0) + 1;
    (a.bursaries || []).forEach(b => { byBursary[b] = (byBursary[b]||0) + 1 })
  })

  const sortedField = Object.entries(byField).sort((a,b) => b[1]-a[1])
  const sortedProvince = Object.entries(byProvince).sort((a,b) => b[1]-a[1])
  const sortedBursary = Object.entries(byBursary).sort((a,b) => b[1]-a[1])
  const maxField = sortedField[0]?.[1] || 1
  const maxProvince = sortedProvince[0]?.[1] || 1
  const maxBursary = sortedBursary[0]?.[1] || 1

  const COLORS = ['var(--gold)','var(--blue)','var(--green)','var(--purple)','#FF7043','#26C6DA']

  return (
    <div className="page-wrap">
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:26, marginBottom:6 }}>Analytics Dashboard</h1>
        <p className="muted" style={{ fontSize:14 }}>Real-time overview of all student applications.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }} className="stats-grid">
        {[
          { label:'Total Applications', value:total, color:'var(--text)', icon:'✦' },
          { label:'Top Contenders', value:topContenders, color:'var(--green)', icon:'🏆', sub:`${Math.round(topContenders/total*100)}% of total` },
          { label:'Average Score', value:avgScore+'/100', color:'var(--gold)', icon:'◎' },
          { label:'Docs Uploaded', value:withDocs, color:'var(--blue)', icon:'📄', sub:`${Math.round(withDocs/total*100)}% verified` },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'18px 20px', margin:0 }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:700, fontFamily:'Space Grotesk', color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{s.label}</div>
            {s.sub && <div style={{ fontSize:11, color:s.color, marginTop:2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Score distribution */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Score Distribution</h3>
          {Object.entries(byScore).map(([range, count], i) => (
            <Bar key={range} label={range} value={count} max={total} color={COLORS[i]} />
          ))}
        </div>

        {/* By Field */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Field of Study</h3>
          {sortedField.slice(0,6).map(([field, count], i) => (
            <Bar key={field} label={field} value={count} max={maxField} color={COLORS[i % COLORS.length]} />
          ))}
        </div>

        {/* By Province */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Province Breakdown</h3>
          {sortedProvince.slice(0,6).map(([prov, count], i) => (
            <Bar key={prov} label={prov} value={count} max={maxProvince} color={COLORS[i % COLORS.length]} />
          ))}
        </div>

        {/* Bursary matches */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Most Matched Bursaries</h3>
          {sortedBursary.length === 0 ? (
            <p className="muted" style={{ fontSize:13 }}>No bursary matches yet.</p>
          ) : sortedBursary.slice(0,6).map(([b, count], i) => (
            <Bar key={b} label={b} value={count} max={maxBursary} color={COLORS[i % COLORS.length]} />
          ))}
        </div>

        {/* Gender */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Gender Breakdown</h3>
          {Object.entries(byGender).map(([g, count], i) => (
            <Bar key={g} label={g} value={count} max={total} color={COLORS[i % COLORS.length]} />
          ))}
        </div>

        {/* Top institutions */}
        <div className="card">
          <h3 style={{ fontSize:15, marginBottom:20 }}>Top Institutions</h3>
          {(() => {
            const byInst = {}
            apps.forEach(a => { const k = a.institution||'Unknown'; byInst[k]=(byInst[k]||0)+1 })
            const sorted = Object.entries(byInst).sort((a,b)=>b[1]-a[1])
            const max = sorted[0]?.[1]||1
            return sorted.slice(0,6).map(([inst, count], i) => (
              <Bar key={inst} label={inst} value={count} max={max} color={COLORS[i % COLORS.length]} />
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
