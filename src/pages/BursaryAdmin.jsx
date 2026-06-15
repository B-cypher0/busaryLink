// src/pages/BursaryAdmin.jsx
// Private portal for bursary administrators — separate from main admin
import { useState, useEffect } from 'react'
import { getAllApplications, supabase } from '../lib/supabase'

const BURSARY_CONFIGS = {
  'nsfas@bursaries.gov.za':       { name:'NSFAS',          minScore:50, fields:[], color:'var(--blue)',   maxIncome:29167 },
  'bursaries@eskom.co.za':        { name:'Eskom',          minScore:65, fields:['Engineering','Computer Science / IT','Commerce / Accounting'], color:'var(--gold)', maxIncome:50000 },
  'nrf@research.ac.za':           { name:'NRF',            minScore:70, fields:['Natural Sciences','Engineering','Computer Science / IT'], color:'var(--purple)', maxIncome:60000 },
  'bursaries@transnet.net':       { name:'Transnet',       minScore:60, fields:['Engineering','Commerce / Accounting','Computer Science / IT'], color:'var(--green)', maxIncome:45000 },
  'bursaries@health.gov.za':      { name:'Dept of Health', minScore:60, fields:['Medicine / Health Sciences'], color:'var(--red)', maxIncome:40000 },
  'funder@bursaryoffice.co.za':   { name:'Demo Office',    minScore:55, fields:[], color:'var(--gold)',   maxIncome:99999 },
}

const DEGREE_COSTS = {
  'Engineering':              { annual:52000, years:4 },
  'Computer Science / IT':    { annual:38000, years:3 },
  'Medicine / Health Sciences':{ annual:85000, years:6 },
  'Commerce / Accounting':    { annual:35000, years:3 },
  'Law':                      { annual:40000, years:4 },
  'Education':                { annual:30000, years:4 },
  'Natural Sciences':         { annual:36000, years:3 },
  'Humanities':               { annual:28000, years:3 },
  'Agriculture':              { annual:32000, years:4 },
}

const SKILLS_MAP = {
  'Engineering':              ['Problem-solving','Technical drawing','Mathematical modelling','Critical thinking','Project management'],
  'Computer Science / IT':   ['Programming','System design','Logical thinking','Data analysis','Cybersecurity awareness'],
  'Medicine / Health Sciences':['Patient care','Clinical reasoning','Empathy','Attention to detail','Research skills'],
  'Commerce / Accounting':   ['Financial analysis','Attention to detail','Report writing','Excel/spreadsheets','Ethical reasoning'],
  'Law':                     ['Legal reasoning','Oral advocacy','Research','Written communication','Critical analysis'],
  'Education':               ['Communication','Patience','Curriculum design','Assessment','Mentoring'],
  'Natural Sciences':        ['Laboratory skills','Research methodology','Data analysis','Scientific writing','Critical thinking'],
}

function FeeEstimate({ app, config }) {
  const costs = DEGREE_COSTS[app.field_of_study]
  if (!costs) return null
  const yearNum = parseInt((app.grade||'').replace(/\D/g,'')) || 1
  const yearsLeft = Math.max(1, costs.years - yearNum + 1)
  const totalTuition = costs.annual * yearsLeft
  const accommodation = 48000 * yearsLeft
  const books = 8000 * yearsLeft
  const transport = 6000 * yearsLeft
  const total = totalTuition + accommodation + books + transport

  return (
    <div style={{ background:'var(--dark-3)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginTop:14 }}>
      <div style={{ fontSize:12, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:12 }}>
        💰 Estimated Funding Required
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        {[
          ['Tuition (×'+yearsLeft+' yrs)', `R${totalTuition.toLocaleString()}`],
          ['Accommodation', `R${accommodation.toLocaleString()}`],
          ['Books & Materials', `R${books.toLocaleString()}`],
          ['Transport', `R${transport.toLocaleString()}`],
        ].map(([l,v])=>(
          <div key={l} style={{ fontSize:12 }}>
            <span style={{ color:'var(--muted)' }}>{l}: </span>
            <span style={{ fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontWeight:700, fontFamily:'Space Grotesk' }}>Total Estimated</span>
        <span style={{ fontWeight:700, color:'var(--gold)', fontFamily:'Space Grotesk', fontSize:16 }}>R{total.toLocaleString()}</span>
      </div>
      <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>*Estimates based on average SA university costs. Adjust per institution.</div>
    </div>
  )
}

export default function BursaryAdmin({ session }) {
  const [apps, setApps] = useState([])
  const [hubData, setHubData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [aiAdvice, setAiAdvice] = useState({})
  const [aiLoading, setAiLoading] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const config = BURSARY_CONFIGS[session?.user?.email]

  useEffect(() => {
    if (!config) return
    getAllApplications().then(async all => {
      let filtered = all.filter(a => {
        const meetsScore = (a.score||0) >= config.minScore
        const meetsField = config.fields.length===0 || config.fields.includes(a.field_of_study)
        const meetsIncome = !config.maxIncome || (parseFloat(a.monthly_income)||0) <= config.maxIncome
        return meetsScore && meetsField && meetsIncome
      })
      setApps(filtered)
      // Load StudentHub data for each
      const userIds = filtered.map(a=>a.user_id).filter(Boolean)
      if (userIds.length) {
        const { data } = await supabase.from('student_hub').select('*').in('user_id', userIds)
        if (data) { const map={}; data.forEach(d=>map[d.user_id]=d); setHubData(map) }
      }
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const getAIAdvice = async (app) => {
    if (aiAdvice[app.user_id]) return
    setAiLoading(app.user_id)
    const hub = hubData[app.user_id]
    const prompt = `You are a South African bursary administrator reviewing a student for the ${config.name} bursary.

Student Profile:
- Name: ${app.full_name}
- Field: ${app.field_of_study}
- Career Goal: ${app.career_goal || 'Not stated'}
- Average: ${app.avg}%
- Maths: ${app.s_math||'N/A'}%, Science: ${app.s_science||'N/A'}%
- University results: ${hub ? JSON.stringify(hub.results).substring(0,300) : 'No university results yet'}
- Eligibility Score: ${app.score}/100

Provide a structured assessment with:
1. Career Choice Assessment (2-3 sentences): Is this student's career goal realistic given their marks? Why?
2. Estimated Skills (bullet list of 4-5 skills this student likely has based on their profile)
3. Bursary Recommendation (1-2 sentences): Should ${config.name} fund this student? Why?

Be direct, professional, and specific to South Africa.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1000, messages:[{role:'user',content:prompt}] })
      })
      const data = await res.json()
      const text = data.content?.map(b=>b.text||'').join('\n') || 'Could not generate advice.'
      setAiAdvice(prev=>({...prev,[app.user_id]:text}))
    } catch { setAiAdvice(prev=>({...prev,[app.user_id]:'AI advice unavailable.'})) }
    setAiLoading(null)
  }

  if (!config) return (
    <div style={{ padding:'80px 40px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🏛️</div>
      <h2 style={{ marginBottom:8 }}>Bursary Administrator Portal</h2>
      <p className="muted" style={{ maxWidth:400, margin:'0 auto 20px', fontSize:14 }}>
        This portal is for registered bursary organisations only. Contact BursaryLink to register your organisation.
      </p>
      <div className="alert alert-info" style={{ maxWidth:400, margin:'0 auto', textAlign:'left' }}>
        📧 Register your organisation: <strong>bongani3012@gmail.com</strong>
      </div>
    </div>
  )

  const displayed = apps
    .filter(a => filter==='verified' ? a.doc_verified : filter==='top' ? (a.score||0)>=75 : true)
    .filter(a => !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.institution?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>(b.score||0)-(a.score||0))

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:12, color:config.color, textTransform:'uppercase', letterSpacing:'1px', fontWeight:600, marginBottom:4 }}>
            {config.name} — Bursary Administrator
          </div>
          <h1 style={{ fontSize:26, marginBottom:4 }}>Qualified Applicants</h1>
          <p className="muted" style={{ fontSize:14 }}>Students meeting {config.name} criteria (score ≥{config.minScore}{config.fields.length?`, fields: ${config.fields.join(', ')}`:''}).</p>
        </div>
        <button className="btn btn-gold" onClick={() => {
          const csv = [['Rank','Name','Score','Field','Avg%','Institution','Province'],
            ...displayed.map((a,i)=>[i+1,a.full_name,a.score,a.field_of_study,a.avg,a.institution,a.province])]
            .map(r=>r.map(v=>`"${v||''}"`).join(',')).join('\n')
          const el=document.createElement('a'); el.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
          el.download=`${config.name}_shortlist.csv`; el.click()
        }}>⬇ Export Shortlist</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }} className="stats-grid">
        {[
          { label:'Qualified', value:apps.length, color:config.color },
          { label:'Score 75+', value:apps.filter(a=>(a.score||0)>=75).length, color:'var(--green)' },
          { label:'Docs Verified', value:apps.filter(a=>a.doc_verified).length, color:'var(--blue)' },
          { label:'With Uni Results', value:Object.keys(hubData).length, color:'var(--purple)' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'16px',margin:0 }}>
            <div style={{ fontSize:26,fontWeight:700,fontFamily:'Space Grotesk',color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11,color:'var(--muted)',marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search by name or institution…" value={search} onChange={e=>setSearch(e.target.value)} style={{ flex:1, minWidth:200 }} />
        {['all','top','verified'].map(f=>(
          <button key={f} className={`btn btn-sm ${filter===f?'btn-gold':'btn-outline'}`} onClick={()=>setFilter(f)}>
            {f==='all'?'All':f==='top'?'Score 75+':'Verified Docs'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center',padding:60 }}><div className="spinner" style={{ margin:'0 auto' }} /></div>
      ) : displayed.length===0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No qualified applicants yet</h3><p>Students meeting {config.name} criteria will appear here.</p></div>
      ) : (
        displayed.map((a,i) => {
          const sc=a.score||0
          const col=sc>=75?'var(--green)':sc>=60?'var(--gold)':'var(--red)'
          const hub=hubData[a.user_id]
          const skills=SKILLS_MAP[a.field_of_study]||[]
          return (
            <div key={a.user_id||i} className="card" style={{ padding:'18px 20px', margin:'0 0 12px', cursor:'pointer', transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=config.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              onClick={()=>{ setSelected(selected?.user_id===a.user_id?null:a); getAIAdvice(a) }}>

              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:44,height:44,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center', border:`2px solid ${col}`,background:`${col}15`,fontFamily:'Space Grotesk',fontWeight:700,color:col,fontSize:14,flexShrink:0 }}>{sc}</div>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontFamily:'Space Grotesk',fontWeight:600,fontSize:15,marginBottom:3 }}>{a.full_name||'—'}</div>
                  <div style={{ fontSize:12,color:'var(--muted)' }}>{a.institution||'—'} · {a.field_of_study||'—'} · Avg: {a.avg||'?'}%</div>
                  <div style={{ display:'flex',gap:6,marginTop:6,flexWrap:'wrap' }}>
                    {a.doc_verified && <span className="tag tag-green">📄 Verified</span>}
                    {hub && <span className="tag tag-blue">📊 Uni results loaded</span>}
                    {a.results_url && !a.doc_verified && <span className="tag tag-gold">📄 Doc uploaded</span>}
                  </div>
                </div>
                <div style={{ minWidth:90 }}>
                  <div className="progress-bar" style={{ width:90 }}>
                    <div style={{ height:'100%',borderRadius:3,width:`${sc}%`,background:col,transition:'width 0.8s' }} />
                  </div>
                  <div style={{ fontSize:11,color:'var(--muted)',marginTop:4,textAlign:'right' }}>{sc}/100</div>
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.user_id===a.user_id && (
                <div style={{ marginTop:16, borderTop:'1px solid var(--border)', paddingTop:16 }} onClick={e=>e.stopPropagation()}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {/* Left: skills + fee */}
                    <div>
                      <div style={{ fontSize:12,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,fontWeight:600 }}>Estimated Skills</div>
                      <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:16 }}>
                        {skills.map(s=>(
                          <div key={s} style={{ display:'flex',alignItems:'center',gap:8,fontSize:13 }}>
                            <div style={{ width:6,height:6,borderRadius:'50%',background:config.color,flexShrink:0 }} />
                            {s}
                          </div>
                        ))}
                      </div>
                      {/* University results if available */}
                      {hub && (
                        <div style={{ background:'var(--dark-3)',borderRadius:8,padding:12,marginBottom:12 }}>
                          <div style={{ fontSize:12,color:'var(--purple)',textTransform:'uppercase',letterSpacing:'1px',fontWeight:600,marginBottom:8 }}>University Results</div>
                          {Object.entries(hub.results||{}).map(([yr,mods])=>{
                            const vals=Object.values(mods).map(g=>gradeToNum ? 0 : 0)
                            return (
                              <div key={yr} style={{ marginBottom:6 }}>
                                <div style={{ fontSize:11,color:'var(--muted)',marginBottom:4 }}>{yr.replace('year_','Year ')}</div>
                                {Object.entries(mods).slice(0,3).map(([mod,grade])=>(
                                  <div key={mod} style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:2 }}>
                                    <span style={{ color:'var(--muted)' }}>{mod.substring(0,25)}{mod.length>25?'…':''}</span>
                                    <span style={{ color: grade.startsWith('A')||grade.startsWith('B')?'var(--green)':grade.startsWith('C')?'var(--gold)':'var(--red)', fontWeight:600 }}>{grade.split('(')[0].trim()}</span>
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <FeeEstimate app={a} config={config} />
                    </div>

                    {/* Right: AI advice */}
                    <div>
                      <div className="ai-panel">
                        <div className="ai-header">
                          <div className="ai-dot" />
                          <div className="ai-title">AI Assessment</div>
                        </div>
                        <div className="ai-body">
                          {aiLoading===a.user_id ? (
                            <span className="muted">Analysing student profile…</span>
                          ) : aiAdvice[a.user_id] ? (
                            aiAdvice[a.user_id].split('\n').filter(Boolean).map((p,i)=>(
                              <p key={i} style={{ marginBottom:8 }}>{p}</p>
                            ))
                          ) : (
                            <span className="muted" style={{ fontSize:13 }}>Click the card to load AI assessment.</span>
                          )}
                        </div>
                      </div>
                      {a.results_url && (
                        <a href={a.results_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop:12, display:'inline-flex' }}>
                          📄 View Results Document
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function gradeToNum(g) {
  const map={'A+ (90-100)':95,'A (80-89)':84,'B+ (75-79)':77,'B (70-74)':72,'C+ (65-69)':67,'C (60-64)':62,'D (50-59)':54,'F (Below 50)':40}
  return map[g]||0
}
