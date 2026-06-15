// src/pages/Apply.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveApplication, getMyApplication, uploadResultsDoc } from '../lib/supabase'
import { scoreApplicant, matchBursaries } from '../lib/scoring'

const SUBJECTS = [
  { key:'s_math',       label:'Mathematics'       },
  { key:'s_science',    label:'Physical Sciences'  },
  { key:'s_english',    label:'English'            },
  { key:'s_biology',    label:'Life Sciences'      },
  { key:'s_accounting', label:'Accounting'         },
  { key:'s_geography',  label:'Geography'          },
]

const EMPTY = {
  full_name:'', id_number:'', phone:'', province:'', race:'', gender:'',
  disability:'None', monthly_income:'', grade:'', institution:'',
  field_of_study:'', avg:'', s_math:'', s_science:'', s_english:'',
  s_biology:'', s_accounting:'', s_geography:'', statement:'', career_goal:'', results_url:'',
}

export default function Apply() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [liveScore, setLiveScore] = useState(0)
  const [matchedBursaries, setMatchedBursaries] = useState([])
  const [existing, setExisting] = useState(false)

  useEffect(() => {
    getMyApplication().then(d => {
      if (d) { setForm(f => ({ ...f, ...d })); setExisting(true) }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLiveScore(scoreApplicant(form))
    setMatchedBursaries(matchBursaries(form))
  }, [form])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5*1024*1024) { setMsg({ type:'error', text:'File must be under 5MB.' }); return }
    setUploading(true); setMsg(null)
    try {
      const url = await uploadResultsDoc(file)
      set('results_url', url)
      setMsg({ type:'success', text:'✅ Results document uploaded.' })
    } catch(e) { setMsg({ type:'error', text:'Upload failed: '+e.message }) }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.full_name) { setMsg({ type:'error', text:'Full name is required.' }); return }
    setLoading(true); setMsg(null)
    try {
      const score = scoreApplicant(form)
      const bursaries = matchBursaries(form)
      await saveApplication({ ...form, score, bursaries })
      // ✅ FIX: redirect to dashboard after save, show success there
      navigate('/?submitted=1')
    } catch(e) {
      setMsg({ type:'error', text:'Save failed: '+e.message })
      setLoading(false)
    }
  }

  const scoreColor = liveScore>=75?'var(--green)':liveScore>=55?'var(--gold)':'var(--red)'

  return (
    <div className="page-wrap">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontSize:26, marginBottom:6 }}>{existing ? 'Update Application' : 'Bursary Application'}</h1>
          <p className="muted" style={{ fontSize:14 }}>Your data is saved securely. Fill in what you can and return anytime.</p>
        </div>
        <div className="card" style={{ padding:'14px 20px', textAlign:'center', minWidth:140, margin:0 }}>
          <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Live Score</div>
          <div style={{ fontSize:34, fontWeight:700, fontFamily:'Space Grotesk', color:scoreColor }}>{liveScore}</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>out of 100</div>
          <div className="progress-bar" style={{ marginTop:8 }}>
            <div className="progress-fill" style={{ width:`${liveScore}%` }} />
          </div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {matchedBursaries.length > 0 && (
        <div className="card" style={{ padding:'14px 18px', marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'1px' }}>Currently Matching</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {matchedBursaries.map(b => <span key={b} className="tag tag-green">{b}</span>)}
          </div>
        </div>
      )}

      {/* Personal Info */}
      <div className="card">
        <h2 style={{ fontSize:16, marginBottom:18 }}>Personal Information</h2>
        <div className="form-grid">
          {[{k:'full_name',label:'Full Name',ph:'e.g. Sipho Dlamini'},{k:'id_number',label:'SA ID Number',ph:'13-digit ID'},{k:'phone',label:'Phone Number',ph:'082 123 4567'},{k:'monthly_income',label:'Monthly Household Income (ZAR)',ph:'e.g. 8500',type:'number'}].map(f=>(
            <div key={f.k} className="form-group">
              <label>{f.label}</label>
              <input type={f.type||'text'} placeholder={f.ph} value={form[f.k]} onChange={e=>set(f.k,e.target.value)} />
            </div>
          ))}
          {[{k:'province',label:'Province',opts:['KwaZulu-Natal','Gauteng','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West','Northern Cape','Free State']},{k:'race',label:'Population Group',opts:['African','Coloured','Indian/Asian','White','Prefer not to say']},{k:'gender',label:'Gender',opts:['Female','Male','Non-binary','Prefer not to say']},{k:'disability',label:'Disability Status',opts:['None','Visual impairment','Hearing impairment','Physical disability','Other']}].map(f=>(
            <div key={f.k} className="form-group">
              <label>{f.label}</label>
              <select value={form[f.k]} onChange={e=>set(f.k,e.target.value)}>
                <option value="">Select…</option>
                {f.opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Info */}
      <div className="card">
        <h2 style={{ fontSize:16, marginBottom:18 }}>Academic Information</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Current Grade / Year</label>
            <select value={form.grade} onChange={e=>set('grade',e.target.value)}>
              <option value="">Select…</option>
              {['Grade 11','Grade 12 (Matric)','1st Year','2nd Year','3rd Year','4th Year','Postgraduate'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Institution</label>
            <input placeholder="e.g. UKZN, DUT" value={form.institution} onChange={e=>set('institution',e.target.value)} />
          </div>
          <div className="form-group">
            <label>Field of Study</label>
            <select value={form.field_of_study} onChange={e=>set('field_of_study',e.target.value)}>
              <option value="">Select…</option>
              {['Engineering','Computer Science / IT','Medicine / Health Sciences','Commerce / Accounting','Law','Education','Agriculture','Natural Sciences','Humanities'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Overall Average (%)</label>
            <input type="number" placeholder="e.g. 72" min="0" max="100" value={form.avg} onChange={e=>set('avg',e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop:16 }}>
          <label style={{ fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'1px' }}>Subject Marks — drag sliders</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:12 }}>
            {SUBJECTS.map(s => {
              const val = parseInt(form[s.key])||0
              const col = val>=75?'var(--green)':val>=50?'var(--gold)':val>0?'var(--red)':'var(--muted)'
              return (
                <div key={s.key} style={{ background:'var(--dark-3)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:500 }}>{s.label}</span>
                    <span style={{ fontSize:15, fontWeight:700, color:col, fontFamily:'Space Grotesk' }}>{val||'—'}</span>
                  </div>
                  <input type="range" min="0" max="100" value={val} onChange={e=>set(s.key,e.target.value)} style={{ width:'100%', marginBottom:4 }} />
                  <div style={{ height:3, background:'var(--dark-4)', borderRadius:2 }}>
                    <div style={{ height:'100%', borderRadius:2, width:`${val}%`, background:col, transition:'width 0.2s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="card">
        <h2 style={{ fontSize:16, marginBottom:6 }}>Upload Results Document</h2>
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>Official school/university results (PDF, JPG, PNG — max 5MB)</p>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <label style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', border:'1px dashed var(--border)', borderRadius:8, cursor:'pointer', fontSize:14, color:'var(--muted)', transition:'all 0.15s', textTransform:'none', letterSpacing:'normal', fontWeight:500 }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>
            {uploading?'⏳ Uploading…':'📄 Choose file'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={handleUpload} disabled={uploading} />
          </label>
          {form.results_url && <a href={form.results_url} target="_blank" rel="noreferrer" className="tag tag-green">✓ Document uploaded — view</a>}
        </div>
      </div>

      {/* Statement */}
      <div className="card">
        <h2 style={{ fontSize:16, marginBottom:18 }}>Personal Statement</h2>
        <div className="form-group full">
          <label>Why do you need this bursary? (100–300 words)</label>
          <textarea rows={5} placeholder="Describe your financial situation, goals, and what you'll contribute…" value={form.statement} onChange={e=>set('statement',e.target.value)} />
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{(form.statement.trim().split(/\s+/).filter(Boolean).length)} words</div>
        </div>
        <div className="form-group full" style={{ marginBottom:0 }}>
          <label>Career Aspirations</label>
          <textarea rows={3} placeholder="What do you want to become and why?" value={form.career_goal} onChange={e=>set('career_goal',e.target.value)} />
        </div>
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <button className="btn btn-gold btn-lg" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : existing ? 'Update Application' : 'Submit Application'}
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/')}>Cancel</button>
      </div>
    </div>
  )
}
