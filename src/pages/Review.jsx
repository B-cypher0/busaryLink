// src/pages/Review.jsx
import { useState, useEffect } from 'react'
import { getAllApplications, supabase } from '../lib/supabase'

const DEADLINES = [
  { name: 'NSFAS',          date: '2025-09-30', color: 'var(--blue)'   },
  { name: 'Eskom',          date: '2025-08-31', color: 'var(--gold)'   },
  { name: 'NRF',            date: '2025-10-15', color: 'var(--purple)' },
  { name: 'Transnet',       date: '2025-09-15', color: 'var(--green)'  },
  { name: 'Dept of Health', date: '2025-08-15', color: 'var(--red)'    },
  { name: 'Sasol',          date: '2025-10-31', color: '#FF7043'       },
]

function daysLeft(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000)
  return diff
}

export default function Review() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [notifying, setNotifying] = useState(null)
  const [notifyMsg, setNotifyMsg] = useState(null)
  const [verifying, setVerifying] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = () => {
    setLoading(true)
    getAllApplications().then(d => { setApps(d||[]); setLoading(false) }).catch(() => setLoading(false))
  }

  const list = [...apps]
    .filter(a => filter === 'top' ? (a.score||0) >= 65 : filter === 'verified' ? a.doc_verified : true)
    .sort((a,b) => (b.score||0) - (a.score||0))

  const exportCSV = () => {
    const top = apps.filter(a => (a.score||0) >= 65).sort((a,b) => b.score-a.score)
    if (!top.length) { alert('No top contenders to export.'); return }
    const headers = ['Rank','Name','Phone','Institution','Field','Average%','Score','Bursaries','Province','Docs Verified']
    const rows = top.map((a,i) => [i+1, a.full_name, a.phone, a.institution, a.field_of_study, a.avg, a.score, (a.bursaries||[]).join(' | '), a.province, a.doc_verified?'Yes':'No'])
    const csv = [headers,...rows].map(r => r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href=url; el.download=`BursaryLink_Shortlist_${new Date().toISOString().slice(0,10)}.csv`
    el.click()
  }

  const notifyStudent = async (a) => {
    setNotifying(a.id); setNotifyMsg(null)
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: a.email || '', studentName: a.full_name, score: a.score, bursaries: a.bursaries })
      })
      const data = await res.json()
      if (data.id || res.ok) setNotifyMsg({ type:'success', text:`✅ Email sent to ${a.full_name}` })
      else setNotifyMsg({ type:'error', text: 'Email failed. Check RESEND_API_KEY in Netlify.' })
    } catch { setNotifyMsg({ type:'error', text: 'Network error sending email.' }) }
    setNotifying(null)
    setTimeout(() => setNotifyMsg(null), 4000)
  }

  const toggleVerified = async (a) => {
    setVerifying(a.id)
    const newVal = !a.doc_verified
    await supabase.from('applications').update({ doc_verified: newVal }).eq('user_id', a.user_id)
    setApps(prev => prev.map(x => x.user_id === a.user_id ? { ...x, doc_verified: newVal } : x))
    setVerifying(null)
  }

  return (
    <div className="page-wrap">
      {/* Deadlines banner */}
      <div style={{ background:'var(--dark-2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 20px', marginBottom:24, overflowX:'auto' }}>
        <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10, fontWeight:600 }}>Application Deadlines</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {DEADLINES.map(d => {
            const days = daysLeft(d.date)
            const urgent = days <= 14
            return (
              <div key={d.name} style={{ background:'var(--dark-3)', border:`1px solid ${urgent ? d.color : 'var(--border)'}`, borderRadius:8, padding:'8px 14px', minWidth:120 }}>
                <div style={{ fontSize:12, fontWeight:700, color:d.color }}>{d.name}</div>
                <div style={{ fontSize:11, color: urgent ? d.color : 'var(--muted)', marginTop:3 }}>
                  {days < 0 ? '❌ Closed' : days === 0 ? '🔴 Today!' : `${days}d left`}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontSize:26, marginBottom:6 }}>Applications Review</h1>
          <p className="muted" style={{ fontSize:14 }}>Ranked by eligibility score. Shortlist and notify top candidates.</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {['all','top','verified'].map(f => (
            <button key={f} className={`btn btn-sm ${filter===f?'btn-gold':'btn-outline'}`} onClick={() => setFilter(f)}>
              {f==='all'?`All (${apps.length})`:f==='top'?`Top 65+ (${apps.filter(a=>(a.score||0)>=65).length})`:`Verified (${apps.filter(a=>a.doc_verified).length})`}
            </button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>

      {notifyMsg && <div className={`alert alert-${notifyMsg.type}`}>{notifyMsg.text}</div>}

      {/* Summary */}
      {apps.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }} className="stats-grid">
          {[
            { label:'Total', val:apps.length, color:'var(--text)' },
            { label:'Top Contenders', val:apps.filter(a=>(a.score||0)>=65).length, color:'var(--green)' },
            { label:'Avg Score', val:Math.round(apps.reduce((s,a)=>s+(a.score||0),0)/apps.length), color:'var(--gold)' },
            { label:'Docs Verified', val:apps.filter(a=>a.doc_verified).length, color:'var(--blue)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:'14px 16px', margin:0 }}>
              <div style={{ fontSize:22, fontWeight:700, fontFamily:'Space Grotesk', color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}><div className="spinner" style={{ margin:'0 auto 16px' }} /> Loading…</div>
      ) : list.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No applications yet</h3><p>Applications will appear here once students submit.</p></div>
      ) : (
        list.map((a, i) => {
          const sc = a.score || 0
          const col = sc >= 75 ? 'var(--green)' : sc >= 55 ? 'var(--gold)' : 'var(--red)'
          return (
            <div key={a.id||i} style={{ background:'var(--dark-2)', border:'1px solid var(--border)', borderRadius:10, padding:'16px 18px', marginBottom:10, transition:'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:28, textAlign:'center', fontSize:15, flexShrink:0 }}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                </div>
                <div style={{ width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  border:`2px solid ${col}`, background:`${col}15`, fontFamily:'Space Grotesk', fontWeight:700, color:col, fontSize:14, flexShrink:0 }}>
                  {sc}
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontFamily:'Space Grotesk', fontWeight:600, fontSize:15, marginBottom:3 }}>{a.full_name||'—'}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{a.institution||'—'} · {a.field_of_study||'—'} · Avg: {a.avg||'?'}%</div>
                  <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                    {sc >= 65 ? <span className="tag tag-green">✓ Top Contender</span> : <span className="tag tag-red">Below threshold</span>}
                    {a.doc_verified && <span className="tag tag-blue">📄 Doc Verified</span>}
                    {(a.bursaries||[]).map(b => <span key={b} className="tag tag-gold">{b}</span>)}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', flexShrink:0 }}>
                  {/* Verify doc button */}
                  {a.results_url && (
                    <button className={`btn btn-sm ${a.doc_verified ? 'btn-green' : 'btn-outline'}`}
                      onClick={() => toggleVerified(a)}
                      disabled={verifying === a.id}>
                      {verifying===a.id ? '…' : a.doc_verified ? '✓ Verified' : 'Verify Doc'}
                    </button>
                  )}
                  {/* Notify button */}
                  {sc >= 65 && (
                    <button className="btn btn-sm btn-gold"
                      onClick={() => notifyStudent(a)}
                      disabled={notifying === a.id}>
                      {notifying===a.id ? 'Sending…' : '📧 Notify'}
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline" onClick={() => setDetail(a)}>View</button>
                </div>
              </div>
              {/* Score bar */}
              <div className="progress-bar" style={{ marginTop:12 }}>
                <div style={{ height:'100%', borderRadius:3, width:`${sc}%`, background:col, transition:'width 0.8s' }} />
              </div>
            </div>
          )
        })
      )}

      {/* Detail modal */}
      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}
          onClick={() => setDetail(null)}>
          <div style={{ background:'var(--dark-2)', border:'1px solid var(--border)', borderRadius:16, padding:32, maxWidth:540, width:'100%', maxHeight:'85vh', overflow:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h2>{detail.full_name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Score',detail.score+'/100'],['Average',(detail.avg||'—')+'%'],['Institution',detail.institution],
                ['Field',detail.field_of_study],['Province',detail.province],['Phone',detail.phone],
                ['Income','R'+(detail.monthly_income||'—')+'/mo'],['Maths',(detail.s_math||'—')+'%'],
                ['Science',(detail.s_science||'—')+'%'],['Docs',detail.doc_verified?'✓ Verified':detail.results_url?'Uploaded (unverified)':'Not uploaded']
              ].map(([l,v]) => (
                <div key={l} style={{ background:'var(--dark-3)', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, color:'var(--muted)', marginBottom:2, textTransform:'uppercase' }}>{l}</div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{v||'—'}</div>
                </div>
              ))}
            </div>
            {detail.statement && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'1px' }}>Statement</div>
                <p style={{ fontSize:13, lineHeight:1.7 }}>{detail.statement}</p>
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
              {detail.results_url && (
                <a href={detail.results_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">📄 View Document</a>
              )}
              {(detail.score||0) >= 65 && (
                <button className="btn btn-gold btn-sm" onClick={() => { notifyStudent(detail); setDetail(null) }}>📧 Send Shortlist Email</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
