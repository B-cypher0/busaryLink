// src/pages/FunderPortal.jsx
// Separate login for bursary offices / funders to view their shortlist
import { useState, useEffect } from 'react'
import { getAllApplications } from '../lib/supabase'

// Funder accounts — add real funder emails here
const FUNDERS = [
  { email: 'funder@bursaryoffice.co.za', name: 'Demo Bursary Office', minScore: 65, fields: [] },
  // Add more funders: { email, name, minScore, fields: ['Engineering','Computer Science / IT'] }
]

export default function FunderPortal({ session }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const funder = FUNDERS.find(f => f.email === session?.user?.email)

  useEffect(() => {
    if (!funder) return
    getAllApplications().then(all => {
      let filtered = all.filter(a => (a.score||0) >= funder.minScore)
      if (funder.fields?.length > 0) {
        filtered = filtered.filter(a => funder.fields.includes(a.field_of_study))
      }
      setApps(filtered)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (!funder) return (
    <div style={{ padding:'80px 40px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <h2 style={{ marginBottom:8 }}>Funder Portal</h2>
      <p className="muted" style={{ fontSize:14, maxWidth:400, margin:'0 auto' }}>
        This portal is for registered bursary funders only. Contact BursaryLink to get your organisation set up.
      </p>
      <div className="alert alert-info" style={{ marginTop:24, textAlign:'left', maxWidth:400, margin:'24px auto 0' }}>
        📧 To register your organisation: <strong>bongani3012@gmail.com</strong>
      </div>
    </div>
  )

  const exportCSV = () => {
    const headers = ['Rank','Full Name','Phone','Institution','Field','Average%','Score','Matched Bursaries','Province','Docs']
    const rows = apps.map((a,i) => [
      i+1, a.full_name, a.phone, a.institution, a.field_of_study,
      a.avg, a.score, (a.bursaries||[]).join(' | '), a.province,
      a.results_url ? 'Yes' : 'No'
    ])
    const csv = [headers,...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url; el.download = `Shortlist_${funder.name}_${new Date().toISOString().slice(0,10)}.csv`
    el.click()
  }

  return (
    <div className="page-wrap">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6, fontWeight:600 }}>Funder Portal</div>
          <h1 style={{ fontSize:26, marginBottom:6 }}>{funder.name}</h1>
          <p className="muted" style={{ fontSize:14 }}>Shortlisted applicants scoring {funder.minScore}+ out of 100{funder.fields?.length > 0 ? ` in ${funder.fields.join(', ')}` : ''}.</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-gold" onClick={exportCSV}>⬇ Export Shortlist</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }} className="stats-grid">
        {[
          { label:'Shortlisted', value:apps.length, color:'var(--text)' },
          { label:'With Verified Docs', value:apps.filter(a=>a.results_url).length, color:'var(--green)' },
          { label:'Average Score', value: apps.length ? Math.round(apps.reduce((s,a)=>s+(a.score||0),0)/apps.length)+'/100' : '—', color:'var(--gold)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'18px 20px', margin:0 }}>
            <div style={{ fontSize:26, fontWeight:700, fontFamily:'Space Grotesk', color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
      ) : apps.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No shortlisted applicants yet</h3><p>Applicants meeting your criteria will appear here.</p></div>
      ) : (
        apps.map((a, i) => {
          const sc = a.score || 0
          const col = sc >= 75 ? 'var(--green)' : sc >= 65 ? 'var(--gold)' : 'var(--red)'
          return (
            <div key={a.id||i} className="card" style={{ padding:'16px 20px', margin:'0 0 10px', cursor:'pointer', transition:'border-color 0.15s' }}
              onClick={() => setSelected(a)}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <div style={{ fontSize:16, width:28, textAlign:'center' }}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                </div>
                <div style={{ width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  border:`2px solid ${col}`, background:`${col}15`, fontFamily:'Space Grotesk', fontWeight:700, color:col, fontSize:14 }}>
                  {sc}
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:15, marginBottom:3 }}>{a.full_name||'—'}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{a.institution||'—'} · {a.field_of_study||'—'} · Avg: {a.avg||'?'}%</div>
                  <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                    {a.results_url && <span className="tag tag-green">📄 Docs verified</span>}
                    {(a.bursaries||[]).map(b => <span key={b} className="tag tag-blue">{b}</span>)}
                  </div>
                </div>
                <div style={{ minWidth:90 }}>
                  <div className="progress-bar" style={{ width:90 }}>
                    <div style={{ height:'100%', borderRadius:3, width:`${sc}%`, background:col, transition:'width 0.8s' }} />
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', marginTop:4, textAlign:'right' }}>{sc}/100</div>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}
          onClick={() => setSelected(null)}>
          <div style={{ background:'var(--dark-2)', border:'1px solid var(--border)', borderRadius:16, padding:32, maxWidth:500, width:'100%', maxHeight:'80vh', overflow:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2>{selected.full_name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Score',selected.score+'/100'],['Average',selected.avg+'%'],['Institution',selected.institution],
                ['Field',selected.field_of_study],['Province',selected.province],['Phone',selected.phone]].map(([l,v]) => (
                <div key={l} style={{ background:'var(--dark-3)', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, color:'var(--muted)', marginBottom:2, textTransform:'uppercase' }}>{l}</div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{v||'—'}</div>
                </div>
              ))}
            </div>
            {selected.statement && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px' }}>Personal Statement</div>
                <p style={{ fontSize:13, lineHeight:1.7 }}>{selected.statement}</p>
              </div>
            )}
            {selected.results_url && (
              <a href={selected.results_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ marginTop:16, display:'inline-flex' }}>
                📄 View Results Document
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
